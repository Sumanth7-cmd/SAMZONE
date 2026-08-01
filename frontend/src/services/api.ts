import { supabase } from './supabaseClient';
import { normalizeImageUrl, getProductImage, PLACEHOLDER } from '../utils/productImage';
import { OUTFIT_TEMPLATES, COLOR_FAMILY_FALLBACK, COLOR_COMPATIBILITY } from './outfitEngine';
import { applyPresentationSafeFilter, applyFashionOnlyFilter, filterPresentationSafe, isPresentationSafeProduct } from './filters/presentationSafe';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const API_BASE_URL = `${env.VITE_API_URL || 'http://localhost:8081'}/api`;

// Amazon-sourced prices in the database are stored in USD; Myntra prices are
// already in INR. There's no reliable per-row way to tell them apart, so we
// apply this as a blanket approximation to make prices read correctly for
// Indian users (Myntra items will look inflated as a known tradeoff).
export const USD_TO_INR_RATE = 83;


export interface Product {
    id: number;
    name: string;
    brand: string;
    description: string;
    price: number;
    rating: number;
    image: string;
    category: string;
    images?: string[];
    discount?: number;
    originalPrice?: number;
    stock?: number;
    colors?: string[];
    sizes?: string[];
    specifications?: string;
    style?: string;
    tags?: string[];
}

export const PRODUCT_SELECT = 'product_id, uniq_id, pid, name, brand_id, category_id, retail_price, discounted_price, description, rating, image, specifications, created_at, brands!fk_brand(name), categories!fk_category(path)';
const CACHE_TTL_MS = 60_000;

interface CachedValue<T> {
    value: T;
    expiresAt: number;
}

const requestCache = new Map<string, CachedValue<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function withRequestCache<T>(key: string, request: () => Promise<T>): Promise<T> {
    const cached = requestCache.get(key) as CachedValue<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

    const inFlight = inFlightRequests.get(key) as Promise<T> | undefined;
    if (inFlight) return inFlight;

    const pending = request()
        .then((value) => {
            requestCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
            return value;
        })
        .finally(() => inFlightRequests.delete(key));
    inFlightRequests.set(key, pending);
    return pending;
}

function firstImage(image: unknown): string {
    if (Array.isArray(image)) {
        const value = image.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
        return value || '';
    }
    if (typeof image === 'string') return image;
    return '';
}

function parseNumeric(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
}

function extractImageUrls(value: unknown): string[] {
    const urls: string[] = [];
    function recurse(v: unknown) {
        if (!v) return;
        if (typeof v === 'string') {
            const t = v.trim();
            const normalized = normalizeImageUrl(t);
            if (normalized) { urls.push(normalized); return; }
            if (t.startsWith('[') || t.startsWith('"')) {
                try { recurse(JSON.parse(t)); return; } catch (_) {}
            }
            const stripped = t.replace(/^\\["']+|\\["']+$/g, '').trim();
            const strippedNorm = normalizeImageUrl(stripped);
            if (strippedNorm) { urls.push(strippedNorm); return; }
            if (stripped.startsWith('[') || stripped.startsWith('"')) {
                try { recurse(JSON.parse(stripped)); return; } catch (_) {}
            }
        } else if (Array.isArray(v)) {
            v.forEach(recurse);
        }
    }
    recurse(value);
    return urls;
}

function normalizeProductImages(image: unknown, imageUrls?: unknown): string[] {
    const urls = [...extractImageUrls(imageUrls), ...extractImageUrls(image)];
    // Deduplicate while preserving order
    const seen = new Set<string>();
    return urls.filter(u => { if (seen.has(u)) return false; seen.add(u); return true; });
}

function normalizeCategoryFilter(value?: string): string | undefined {
    const normalized = value?.trim().toLowerCase();
    return normalized ? normalized : undefined;
}

export function mapRawProduct(p: any): Product {
    const retailPrice = parseNumeric(p.retail_price);
    const discountPrice = p.discounted_price ? parseNumeric(p.discounted_price) : undefined;
    const price = discountPrice && discountPrice < retailPrice ? discountPrice : retailPrice;
    const brandName = p.brands?.name ?? (p.brand ?? '');
    const categoryPath = p.categories?.path ?? (p.category ?? '');
    const rawImages = p.images || p.image || p.imageUrl;
    const images = normalizeProductImages(p.image, p.images || p.imageUrl);
    return {
        id: p.product_id ?? p.id ?? 0,
        name: p.name ?? '',
        brand: brandName,
        description: p.description ?? '',
        price: price,
        rating: p.rating ?? 0,
        image: images[0] || PLACEHOLDER,
        category: categoryPath,
        images,
        discount: p.discount ?? undefined,
        originalPrice: retailPrice || p.price,
        stock: p.stock ?? undefined,
        colors: p.colors || [],
        sizes: p.sizes || [],
        specifications: p.specifications ?? undefined,
    };
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface ProductFilters {
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export const productApi = {
    getProducts: async (page: number = 0, size: number = 20, filters?: ProductFilters): Promise<PaginatedResponse<Product>> => withRequestCache(
        `products:${page}:${size}:${JSON.stringify(filters ?? {})}`,
        async () => {
        try {
            let selectStr = PRODUCT_SELECT;
            if (filters?.category || filters?.brand) {
                if (filters?.category) {
                    selectStr = selectStr.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
                }
                if (filters?.brand) {
                    selectStr = selectStr.replace('brands!fk_brand(name)', 'brands!fk_brand!inner(name)');
                }
            }

            let query = supabase
                .from('products_new')
                .select(selectStr);
            // Centralized safety filters
            query = applyPresentationSafeFilter(query);
            query = applyFashionOnlyFilter(query);

            if (filters?.search) {
                const q = filters.search.trim();
                if (q) {
                    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
                }
            }

            if (filters?.category) {
                query = query.ilike('categories.path', `%${filters.category}%`);
            }

            if (filters?.brand) {
                query = query.ilike('brands.name', `%${filters.brand}%`);
            }

            if (filters?.minPrice != null) {
                query = query.gte('retail_price', filters.minPrice);
            }

            if (filters?.maxPrice != null) {
                query = query.lte('retail_price', filters.maxPrice);
            }

            if (filters?.sortBy === 'price') {
                query = query.order('retail_price', { ascending: filters.sortDir === 'asc' });
            } else if (filters?.sortBy === 'rating') {
                query = query.order('rating', { ascending: filters.sortDir === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            query = query.order('product_id', { ascending: true });

            const from = page * size;
            const to = from + size - 1;
            const { data, error } = await query.range(from, to);

            if (error) throw error;

            // Separate count query without relational selects
            const { count } = await supabase
                .from('products_new')
                .select('product_id', { count: 'exact', head: true });

            console.log('[shop-api] supabase rows', { filters, count, rows: (data || []).slice(0, 3) });
            const content = filterPresentationSafe((data || []).map((row: any) => mapRawProduct(row)));
            console.log('[shop-api] mapped rows', { count: content.length, rows: content.slice(0, 3) });
            const totalElements = count ?? content.length;
            const totalPages = Math.max(1, Math.ceil(totalElements / size));
            return {
                content,
                totalElements,
                totalPages,
                size,
                number: page,
                first: page <= 0,
                last: page >= totalPages - 1,
            };
        } catch (error) {
            console.error('Supabase product fetch failed:', error);
            throw error;
        }
        },
    ),

    getAllProducts: async (): Promise<Product[]> => withRequestCache('products:all:100', async () => {
        const data = await productApi.getProducts(0, 100);
        return data.content;
    }),

    getProductById: async (id: number): Promise<Product> => {
        const { data, error } = await supabase
            .from('products_new')
            .select(PRODUCT_SELECT)
            .eq('product_id', id)
            .maybeSingle();

        if (error) throw new Error(`Supabase error: ${error.message}`);
        if (!data) throw new Error(`Product ${id} not found`);
        const product = mapRawProduct(data);
        if (!isPresentationSafeProduct(product)) {
            throw new Error(`Product ${id} not available`);
        }
        return product;
    },

    searchProducts: async (query: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<Product>> => {

        const q = query.trim();
        let request = supabase.from('products_new').select(PRODUCT_SELECT, { count: 'exact' });
            // Apply central filters
            request = applyPresentationSafeFilter(request);
            request = applyFashionOnlyFilter(request);
        if (q) {
            request = request.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
        }
        const from = page * size;
        const to = from + size - 1;
        const { data, count, error } = await request.order('created_at', { ascending: false }).range(from, to);
        if (error) throw error;
        const content = (data || []).map((row: any) => mapRawProduct(row));
        return {
            content,
            totalElements: count ?? content.length,
            totalPages: Math.max(1, Math.ceil((count ?? content.length) / size)),
            size,
            number: page,
            first: page <= 0,
            last: page >= Math.max(1, Math.ceil((count ?? content.length) / size)) - 1,
        };
    },

    getCategories: async (): Promise<string[]> => withRequestCache('categories', async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('path')
                .order('path', { ascending: true });
            if (error) throw error;
            return (data || []).map((row: any) => row.path).filter(Boolean);
        } catch (error) {
            console.warn('Failed to fetch categories from Supabase:', error);
            return [];
        }
    }),

    getBrands: async () => withRequestCache('brands', async () => {

        try {
            const { data, error } = await supabase
                .from('brands')
                .select('name')
                .order('name', { ascending: true });
            if (error) throw error;
            return (data || []).map((row: any) => row.name).filter(Boolean);
        } catch (error) {
            console.warn('Failed to fetch brands from Supabase:', error);
            return [];
        }
    }),

    getBestsellers: async (): Promise<Product[]> => {
        // Shares the same cached request as the cold-start recommendation rail
        // (both are the eight highest rated products), eliminating a duplicate
        // network round-trip without changing the rendered results.
        const result = await productApi.getProducts(0, 8, { sortBy: 'rating', sortDir: 'desc' });
        return result.content;
    },

    getDeals: async (): Promise<Product[]> => {
        try {
            let query = supabase
                .from('products_new')
                .select(PRODUCT_SELECT)
                .gt('retail_price', 0)
                .order('retail_price', { ascending: true })
                .limit(8);
            query = applyPresentationSafeFilter(query);
            query = applyFashionOnlyFilter(query);
            
            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map((row: any) => mapRawProduct(row));
        } catch (error) {
            console.warn('Failed to fetch deals from Supabase:', error);
            return [];
        }
    },

    // Ranks apparel items first (Tops -> Bottoms/Dresses -> Footwear) and caps accessories/jewellery to max 20% of total results.
    rankApparelFirst: (products: Product[], limit: number): Product[] => {
        let safeProducts = filterPresentationSafe(products);

        // Filter out Kids/Infant items for main storefront recommendations unless explicitly targeting kids
        const adultProducts = safeProducts.filter((p) => {
            const cat = (p.category || '').toLowerCase();
            return !cat.includes("kids'") && !cat.includes("baby care") && !cat.includes("infant wear") && !cat.includes("boys wear") && !cat.includes("girls wear");
        });
        const pool = adultProducts.length > 0 ? adultProducts : safeProducts;

        // Name-pattern deduplication to prevent 4 of the exact same product name
        const seenPatterns = new Set<string>();
        const deduppedPool: Product[] = [];
        for (const p of pool) {
            const pattern = p.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').slice(0, 20).trim();
            if (!seenPatterns.has(pattern)) {
                seenPatterns.add(pattern);
                deduppedPool.push(p);
            }
        }

        const level1Tops: Product[] = [];        // Shirts, Tops, T-shirts, Kurtas, Kurtis, Jackets, Blazers, Gowns, Sweaters, Hoodies, Sherwanis
        const level2Bottoms: Product[] = [];     // Jeans, Trousers, Pants, Shorts, Skirts, Dresses, Sarees, Lehengas, Salwars
        const level3Footwear: Product[] = [];    // Footwear, Shoes, Loafers, Heels, Boots, Sandals, Sneakers
        const level4Accessories: Product[] = []; // Jewellery, Accessories, Necklaces, Bracelets, Bangles, Kadas, Rings, Earrings, Watches, Bags, Belts, Scarves

        const TOP_KEYWORDS = ['shirt', 'top', 'tshirt', 't-shirt', 'kurta', 'kurti', 'blouse', 'jacket', 'blazer', 'suit', 'coat', 'sweater', 'hoodie', 'sherwani', 'vest'];
        const BOTTOM_DRESS_KEYWORDS = ['dress', 'saree', 'lehenga', 'salwar', 'gown', 'jeans', 'trouser', 'pant', 'bottom', 'skirt', 'shorts', 'harem', 'leggings', 'track pant'];
        const FOOTWEAR_KEYWORDS = ['footwear', 'shoe', 'sneaker', 'loafer', 'boot', 'sandal', 'heel', 'flat', 'bellies'];
        const ACCESSORY_KEYWORDS = ['jewellery', 'jewelry', 'necklace', 'bracelet', 'bangle', 'kada', 'ring', 'earring', 'watch', 'bag', 'handbag', 'wallet', 'belt', 'scarf', 'pouch', 'accessory', 'accessories'];

        for (const p of deduppedPool) {
            const text = `${p.name} ${p.category || ''}`.toLowerCase();
            const isAccessory = ACCESSORY_KEYWORDS.some((k) => text.includes(k));
            const isFootwear = FOOTWEAR_KEYWORDS.some((k) => text.includes(k));
            const isBottomOrDress = BOTTOM_DRESS_KEYWORDS.some((k) => text.includes(k));
            const isTop = TOP_KEYWORDS.some((k) => text.includes(k));

            if (isAccessory) {
                level4Accessories.push(p);
            } else if (isTop) {
                level1Tops.push(p);
            } else if (isBottomOrDress) {
                level2Bottoms.push(p);
            } else if (isFootwear) {
                level3Footwear.push(p);
            } else {
                level1Tops.push(p);
            }
        }

        const maxAccessories = Math.floor(limit * 0.20);
        const selectedAccessories = level4Accessories.slice(0, maxAccessories);
        const apparelCandidates = [...level1Tops, ...level2Bottoms, ...level3Footwear];
        const neededApparelCount = limit - selectedAccessories.length;

        const result: Product[] = apparelCandidates.slice(0, neededApparelCount);
        result.push(...selectedAccessories);

        if (result.length < limit) {
            const usedIds = new Set(result.map((p) => p.id));
            for (const acc of level4Accessories) {
                if (result.length >= limit) break;
                if (!usedIds.has(acc.id)) {
                    result.push(acc);
                }
            }
        }

        return result.slice(0, limit);
    },

    // Searches by color within fashion categories, prioritizing core apparel (shirts, dresses, footwear) over accessories.
    searchByColor: async (color: string, limit: number = 8): Promise<Product[]> => {
        const target = color.toLowerCase();
        const targets = [target, ...(COLOR_FAMILY_FALLBACK[target] || [])];

        const selectStr = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
        const colorOr = targets.map((t) => `name.ilike.%${t}%`).join(',');

        // 1. Primary pass: Fetch apparel candidates (clothing & footwear)
        const { data: apparelData } = await supabase
            .from('products_new')
            .select(selectStr)
            .or(colorOr)
            .or('categories.path.ilike.%Clothing%,categories.path.ilike.%Footwear%')
            .gt('retail_price', 0)
            .order('rating', { ascending: false })
            .limit(60);

        // 2. Secondary pass: General candidates (including accessories)
        const { data: generalData } = await supabase
            .from('products_new')
            .select(selectStr)
            .or(colorOr)
            .gt('retail_price', 0)
            .order('rating', { ascending: false })
            .limit(40);

        const rawList = [...(apparelData || []), ...(generalData || [])];
        const dedupped = Array.from(new Map(rawList.map((row: any) => [row.product_id || row.uniq_id, row])).values());
        const mapped = dedupped.map((row: any) => mapRawProduct(row)).filter(isFashionProduct);

        return productApi.rankApparelFirst(mapped, limit);
    },
};

export interface TryOnResult {
    success: boolean;
    resultImage?: string;
    fallback?: boolean;
    message?: string;
}

export const tryOnApi = {
    // userPhoto/productImage: base64 (data URL or raw) / image URL respectively.
    // Network failures are folded into the same {success:false} shape as a
    // backend-reported fallback, so callers only need one branch to handle.
    generateTryOn: async (userPhoto: string, productImage: string, productName: string): Promise<TryOnResult> => {
        try {
            const response = await fetch(`${API_BASE_URL}/tryon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPhoto, productImage, productName }),
            });
            if (!response.ok) {
                throw new Error('Try-on request failed');
            }
            return await response.json();
        } catch (error) {
            console.warn('AI try-on failed:', error);
            return { success: false, fallback: true, message: 'AI try-on unavailable right now — using manual positioning.' };
        }
    },
};

export interface VisualSearchDetection {
    category?: string;
    type?: string;
    color?: string;
    keywords?: string[];
}

// Outfit category groups are imported from outfitEngine.ts.


const FASHION_CATEGORY_FRAGMENTS = [
    'clothing', 'apparel', 'footwear', 'shoe', 'saree', 'kurta', 'dress',
    'ethnic', 'kurti', 'salwar', 'lehenga', 'jacket', 'jeans', 'trouser',
    'shirt', 'top', 'blouse', 'skirt', 'western', 'accessories',
    'jewellery', 'jewelry', 'bag', 'handbag', 'watch', 'belt', 'scarf',
    'lingerie', 'innerwear', 'swimwear', 'sportswear', 'sherwani', 'blazer',
    'tshirt', 't-shirt', 'hoodie', 'shorts', 'cargo', 'suit', 'ethnic',
];

function isFashionProduct(product: Product): boolean {
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const isTech = ['computer', 'laptop', 'electronics', 'mobile', 'battery', 'phone', 'automotive', 'kitchen', 'camera', 'charger'].some(
        t => cat.includes(t) || name.includes(t)
    );
    if (isTech) return false;
    return FASHION_CATEGORY_FRAGMENTS.some((f) => cat.includes(f) || name.includes(f));
}

async function fetchFashionProductsForKeyword(keyword: string, gender: string, budget: number, color?: string): Promise<Product[]> {
    const genderFragment = gender === 'women' ? 'women' : 'men';
    let selectStr = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');

    let orParts = [`name.ilike.%${keyword}%`];
    if (color) orParts.push(`name.ilike.%${color}%`);

    let query = supabase
        .from('products_new')
        .select(selectStr)
        .or(orParts.join(','))
        .or(`categories.path.ilike.%${genderFragment}%,categories.path.ilike.%clothing%`)
        .lte('retail_price', budget)
        .gt('retail_price', 0)
        .order('rating', { ascending: false });
    query = applyPresentationSafeFilter(query);
    query = applyFashionOnlyFilter(query);

    const { data, error } = await query.limit(5);

    if (error || !data) return [];
    return data.map((row: any) => mapRawProduct(row)).filter(isFashionProduct);
}

// Exported helper for chatbot occasion queries.
// Searches by name keyword, scoped to fashion categories only.
export async function fetchProductsByOccasion(
    nameKeywords: string[],
    budgetMax?: number,
): Promise<Product[]> {
    const EXCLUDE_CATS = ['baby care', 'stationery', 'home decor', 'books', 'electronics', 'health', 'toys', 'sports', 'medical', 'kitchen'];
    const selectStr = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
    const results: Product[] = [];
    const usedIds = new Set<number>();

    for (const kw of nameKeywords) {
        if (results.length >= 8) break;
        let query = supabase
            .from('products_new')
            .select(selectStr)
            .ilike('name', `%${kw}%`)
            .gt('retail_price', 0)
            .order('rating', { ascending: false });
        if (budgetMax) query = query.lte('retail_price', budgetMax);
        query = applyPresentationSafeFilter(query);
        query = applyFashionOnlyFilter(query);
        const { data } = await query.limit(8);
        if (data) {
            for (const row of data) {
                const p = mapRawProduct(row);
                const catLower = (p.category || '').toLowerCase();
                const isExcluded = EXCLUDE_CATS.some(ex => catLower.includes(ex));
                if (!usedIds.has(p.id) && isFashionProduct(p) && !isExcluded) {
                    results.push(p);
                    usedIds.add(p.id);
                }
            }
        }
    }
    return results;
}

export const visualSearchApi = {
    // Visual search is handled entirely client-side via aiShoppingFeatures.ts.
    // This method provides a lightweight Supabase-backed fallback that queries
    // the real catalog when the caller cannot supply pre-ranked products.
    search: async (
        imageBase64: string,
        analysis?: { dominantColor?: string; category?: string; keywords?: string[] }
    ): Promise<{ detected: VisualSearchDetection | null; products: Product[] }> => {
        const selectStr = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
        let query = supabase
            .from('products_new')
            .select(selectStr)
            .gt('retail_price', 0);

        // If visual analysis yielded color or keywords, scope candidates to matching products
        const terms = Array.from(new Set([
            ...(analysis?.keywords || []),
            analysis?.dominantColor,
            analysis?.category
        ].filter(Boolean))) as string[];

        const validTerms = terms.filter(t => t !== 'neutral' && t !== 'general' && t.length > 2);
        if (validTerms.length > 0) {
            const orFilters = validTerms.slice(0, 3).map(term => `name.ilike.%${term}%,description.ilike.%${term}%`).join(',');
            query = query.or(orFilters);
        }

        query = query.order('rating', { ascending: false });
        query = applyPresentationSafeFilter(query);
        query = applyFashionOnlyFilter(query);

        const { data, error } = await query.limit(40);

        if (error) throw new Error(`Visual search failed: ${error.message}`);

        const isAccessorySearch = analysis?.category === 'accessories' || analysis?.category === 'bag';
        const products = (data || []).map((row: any) => mapRawProduct(row)).filter(p => isAccessorySearch ? isFashionProduct(p) : isAdultFashionApparel(p));
        return { detected: null, products };
    },
};

export interface StylistPick {
    product: Product;
    reason: string;
}

export interface OutfitStylistRequest {
    occasion: string;
    gender: 'men' | 'women';
    budget: number;
    preferredColor?: string;
}

export interface OutfitStylistResult {
    outfit: Product[];
    explanation: string;
    totalPrice: number;
}

export function isAdultFashionApparel(product: Product, targetGender?: 'men' | 'women'): boolean {
    const catLower = (product.category || '').toLowerCase();
    const nameLower = (product.name || '').toLowerCase();

    // Strictly exclude kids / boys / girls / baby / infant
    const isKids = ['kids', "kids'", 'boy', "boys'", 'girl', "girls'", 'baby', 'toddler', 'infant', 'child', 'junior'].some(
        k => catLower.includes(k) || nameLower.includes(k)
    );
    if (isKids) return false;

    // Strictly exclude innerwear / sleepwear / boxers / underwear from main apparel recommendation
    const isInnerwear = ['boxer', 'inner wear', 'innerwear', 'sleep wear', 'sleepwear', 'nightwear', 'brief', 'vest', 'underwear', 'panty', 'lingerie', 'bra', 'bustier', 'camisole', 'thong'].some(
        i => catLower.includes(i) || nameLower.includes(i)
    );
    if (isInnerwear) return false;

    // Strictly exclude non-apparel items (jewellery, accessories, fabric, stationery, showpiece, backpacks, bags, home decor, tools, toys, appliances, gardening)
    const isNonApparel = ['jewellery', 'jewelry', 'brooch', 'accessories', 'bangle', 'pendant', 'necklace', 'ring', 'earring', 'fabric', 'stationery', 'showpiece', 'backpack', 'bag', 'handbag', 'wallet', 'purse', 'home decor', 'kitchen', 'tool', 'hardware', 'lamp', 'appliance', 'toy', 'light', 'seed', 'plant', 'lawn', 'gardening', 'improvement'].some(
        a => catLower.includes(a) || nameLower.includes(a)
    );
    if (isNonApparel) return false;

    // Gender check if targetGender provided
    if (targetGender === 'men') {
        return (catLower.includes('men') || nameLower.includes('men')) && !catLower.includes('women') && !nameLower.includes('women');
    } else if (targetGender === 'women') {
        return catLower.includes('women') || nameLower.includes('women') || catLower.includes('saree') || catLower.includes('kurti') || catLower.includes('lehenga');
    }

    return true;
}

export const stylistApi = {
    completeLook: async (productId: number): Promise<{ product: Product; picks: StylistPick[] }> => {
        // Fetch the anchor product from Supabase
        const anchorProduct = await productApi.getProductById(productId);
        const anchorCategory = (anchorProduct.category || '').toLowerCase();

        // Determine complementary categories based on the anchor
        let complementaryKeywords: string[] = [];
        if (anchorCategory.includes('trouser') || anchorCategory.includes('jeans') || anchorCategory.includes('pant')) {
            complementaryKeywords = ['shirt', 'top', 'blouse', 'kurta', 'tshirt'];
        } else if (anchorCategory.includes('shirt') || anchorCategory.includes('top') || anchorCategory.includes('blouse')) {
            complementaryKeywords = ['jeans', 'trouser', 'skirt', 'lehenga'];
        } else if (anchorCategory.includes('saree') || anchorCategory.includes('lehenga')) {
            complementaryKeywords = ['blouse', 'jewelry', 'accessories', 'footwear'];
        } else if (anchorCategory.includes('kurta') || anchorCategory.includes('kurti')) {
            complementaryKeywords = ['salwar', 'legging', 'palazzo', 'jeans'];
        } else if (anchorCategory.includes('dress') || anchorCategory.includes('gown')) {
            complementaryKeywords = ['accessories', 'footwear', 'jewelry', 'bag'];
        } else {
            complementaryKeywords = ['shirt', 'jeans', 'accessories'];
        }

        const FASHION_SELECT = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
        const picks: StylistPick[] = [];
        const anchorColor = anchorProduct.colors?.[0]?.toLowerCase() || 'black';
        const compatibleColors = COLOR_COMPATIBILITY[anchorColor] || ['black', 'white', 'gray'];

        for (const keyword of complementaryKeywords.slice(0, 3)) {
            const { data } = await supabase
                .from('products_new')
                .select(FASHION_SELECT)
                .ilike('name', `%${keyword}%`)
                .neq('product_id', productId)
                .gt('retail_price', 0)
                .order('rating', { ascending: false })
                .limit(6);

            if (data && data.length > 0) {
                const mappedProducts = data.map((row: any) => mapRawProduct(row)).filter(isFashionProduct);
                let bestPick = mappedProducts.find(p => {
                    const colors = p.colors || [];
                    return colors.some(c => compatibleColors.includes(c.toLowerCase()));
                });

                if (!bestPick) {
                    bestPick = mappedProducts[0];
                }

                if (bestPick) {
                    picks.push({
                        product: bestPick,
                        reason: `Color-coordinated to complement your ${anchorProduct.name}. A complementary ${keyword} that matches beautifully.`,
                    });
                }
            }
        }

        return { product: anchorProduct, picks };
    },

    buildOutfit: async (request: OutfitStylistRequest): Promise<OutfitStylistResult> => {
        const { occasion, gender, budget, preferredColor } = request;
        const normalizedOccasion = occasion.toLowerCase().replace(/[^a-z]/g, '');

        // Occasion → category-path keyword mapping for real DB filtering
        const OCCASION_CATEGORY_MAP: Record<string, string[]> = {
            wedding:  gender === 'men'
                ? ["Clothing >> Men's Clothing >> Ethnic Wear", "Clothing >> Men's Clothing >> Suits & Blazers", "Clothing >> Men's Clothing >> Shirts", "Clothing >> Men's Clothing >> Trousers"]
                : ["Clothing >> Women's Clothing >> Ethnic Wear", 'Saree', 'Lehenga', 'Salwar', 'Gown'],
            birthday: gender === 'men'
                ? ["Men's Clothing >> T-Shirts", "Men's Clothing >> Shirts", "Men's Clothing >> Jeans"]
                : ["Women's Clothing >> Western Wear >> Dresses", "Women's Clothing >> Western Wear >> Tops",
                   "Women's Clothing >> Western Wear >> Shirts"],
            party:    gender === 'men'
                ? ["Men's Clothing >> Shirts", "Men's Clothing >> Trousers"]
                : ["Women's Clothing >> Western Wear >> Dresses", "Women's Clothing >> Party Wear"],
            office:   gender === 'men'
                ? ["Men's Clothing >> Formal", "Men's Clothing >> Shirts", "Men's Clothing >> Trousers"]
                : ["Women's Clothing >> Western Wear >> Shirts", "Women's Clothing >> Trousers"],
            festival: gender === 'men'
                ? ["Men's Clothing >> Ethnic Wear", 'Kurta', 'Sherwani']
                : ["Women's Clothing >> Ethnic Wear", 'Saree', 'Salwar', 'Kurta'],
            college:  gender === 'men'
                ? ["Men's Clothing >> T-Shirts", "Men's Clothing >> Jeans"]
                : ["Women's Clothing >> Western Wear", "Women's Clothing >> T-Shirts"],
            travel:   gender === 'men'
                ? ["Men's Clothing >> Jeans", "Men's Clothing >> T-Shirts", "Men's Clothing >> Jackets"]
                : ["Women's Clothing >> Western Wear", "Women's Clothing >> Jackets"],
            casual:   gender === 'men'
                ? ["Men's Clothing >> T-Shirts", "Men's Clothing >> Jeans", "Men's Clothing >> Shirts"]
                : ["Women's Clothing >> Western Wear >> Tops", "Women's Clothing >> Western Wear >> Dresses",
                   "Women's Clothing >> Jeans"],
        };

        // Name-level keyword fallback from OUTFIT_TEMPLATES
        const genderTemplates = OUTFIT_TEMPLATES[gender] || OUTFIT_TEMPLATES['women'];
        let nameKeywords = genderTemplates[normalizedOccasion] || genderTemplates['casual'];
        if (!genderTemplates[normalizedOccasion]) {
            const key = Object.keys(genderTemplates).find((k) => normalizedOccasion.includes(k) || k.includes(normalizedOccasion));
            if (key) nameKeywords = genderTemplates[key];
        }

        // Category-path fragments for gender enforcement
        const categoryPaths = OCCASION_CATEGORY_MAP[normalizedOccasion] ?? OCCASION_CATEGORY_MAP['casual'];

        const FASHION_SELECT = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
        const outfit: Product[] = [];
        const usedIds = new Set<number>();
        const perItemBudget = Math.max(500, budget / Math.max(nameKeywords.length, 1));

        // Primary pass: filter by category path (gender + occasion aware)
        for (const catPath of categoryPaths) {
            if (outfit.length >= 4) break;

            const queryBuilder = supabase
                .from('products_new')
                .select(FASHION_SELECT)
                .ilike('categories.path', `%${catPath}%`)
                .lte('retail_price', perItemBudget)
                .gt('retail_price', 0)
                .order('rating', { ascending: false })
                .limit(12);

            const { data } = await queryBuilder;

            if (data) {
                for (const row of data) {
                    if (outfit.length >= 4) break;
                    const product = mapRawProduct(row);
                    const totalSoFar = outfit.reduce((s, p) => s + p.price, 0);
                    if (!usedIds.has(product.id) && isAdultFashionApparel(product, gender) && (totalSoFar + product.price) <= budget) {
                        outfit.push(product);
                        usedIds.add(product.id);
                        break;
                    }
                }
            }
        }

        // Secondary pass: name-based keyword search with gender guard if primary didn't fill 4 slots
        if (outfit.length < 4) {
            const genderCat = gender === 'men' ? "Men's" : "Women's";
            for (const keyword of nameKeywords) {
                if (outfit.length >= 4) break;

                const { data } = await supabase
                    .from('products_new')
                    .select(FASHION_SELECT)
                    .ilike('name', `%${keyword}%`)
                    .ilike('categories.path', `%${genderCat}%`)
                    .lte('retail_price', perItemBudget)
                    .gt('retail_price', 0)
                    .order('rating', { ascending: false })
                    .limit(12);

                if (data) {
                    for (const row of data) {
                        if (outfit.length >= 4) break;
                        const product = mapRawProduct(row);
                        const totalSoFar = outfit.reduce((s, p) => s + p.price, 0);
                        if (!usedIds.has(product.id) && isAdultFashionApparel(product, gender) && (totalSoFar + product.price) <= budget) {
                            outfit.push(product);
                            usedIds.add(product.id);
                            break;
                        }
                    }
                }
            }
        }

        // Last-resort: fetch adult main apparel items for target gender
        if (outfit.length < 4) {
            const { data } = await supabase
                .from('products_new')
                .select(FASHION_SELECT)
                .ilike('categories.path', `%${gender === 'men' ? "Men's" : "Women's"}%`)
                .gt('retail_price', 0)
                .order('rating', { ascending: false })
                .limit(20);

            if (data) {
                for (const row of data) {
                    if (outfit.length >= 4) break;
                    const product = mapRawProduct(row);
                    if (!usedIds.has(product.id) && isAdultFashionApparel(product, gender)) {
                        outfit.push(product);
                        usedIds.add(product.id);
                    }
                }
            }
        }

        const totalPrice = outfit.reduce((sum, p) => sum + p.price, 0);
        const explanation = outfit.length > 0
            ? `A curated ${occasion} look for ${gender} from our real catalog. ${preferredColor ? `Focused on ${preferredColor} tones. ` : ''}Total outfit cost: ₹${totalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`
            : `We couldn't find products matching all criteria within ₹${budget.toLocaleString('en-IN')}. Try raising the budget or choosing a different occasion.`;

        return { outfit, explanation, totalPrice };
    },
};

export interface StyleDnaAnswers {
    colorPreference: 'bold' | 'neutral' | 'pastel' | 'monochrome';
    fitPreference: 'relaxed/oversized' | 'fitted/tailored' | 'mixed';
    occasionFocus: 'casual-everyday' | 'office/formal' | 'party/going-out' | 'ethnic/festive';
    styleIcon: string;
    budgetRange: 'budget' | 'mid-range' | 'premium';
    gender: 'men' | 'women';
}

export interface StyleDnaArchetype {
    name: string;
    percentage: number;
}

export interface StyleDnaProfile {
    archetypes: StyleDnaArchetype[];
    profileTitle: string;
    description: string;
    colorPalette: string[];
    keywords: string[];
}

export interface StyleDnaResult {
    profile: StyleDnaProfile;
    moodBoard: Product[];
    topPicks: Product[];
}

export const styleDnaApi = {
    buildProfile: async (answers: StyleDnaAnswers): Promise<StyleDnaResult> => {
        const occasionKeywords: Record<string, string[]> = {
            'casual-everyday': ['jeans', 'tshirt', 'kurta', 'casual shirt'],
            'office/formal': ['formal shirt', 'blazer', 'trouser', 'kurti'],
            'party/going-out': ['dress', 'gown', 'party wear', 'ethnic'],
            'ethnic/festive': ['saree', 'lehenga', 'kurta', 'sherwani'],
        };
        const colorKeywords: Record<string, string[]> = {
            bold:       ['red', 'orange', 'yellow', 'pink', 'purple'],
            neutral:    ['black', 'white', 'beige', 'grey', 'navy'],
            pastel:     ['pink', 'lavender', 'mint', 'powder', 'sky'],
            monochrome: ['black', 'white', 'grey'],
        };
        const budgetMap: Record<string, number> = {
            budget: 1500,
            'mid-range': 5000,
            premium: 20000,
        };

        const keywords = occasionKeywords[answers.occasionFocus] || ['kurta', 'shirt'];
        const colors = colorKeywords[answers.colorPreference] || ['black'];
        const maxBudget = budgetMap[answers.budgetRange] || 5000;
        const genderFragment = answers.gender === 'women' ? 'women' : 'men';

        const FASHION_SELECT = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
        const orParts = [...keywords.map((k) => `name.ilike.%${k}%`), ...colors.map((c) => `name.ilike.%${c}%`)];
        const genderCat = answers.gender === 'women' ? "Women's" : "Men's";

        // 1. Primary pass: Fetch apparel (clothing & footwear) candidates matching gender & style keywords
        const { data: apparelData } = await supabase
            .from('products_new')
            .select(FASHION_SELECT)
            .or(orParts.join(','))
            .ilike('categories.path', `%${genderCat}%`)
            .or('categories.path.ilike.%Clothing%,categories.path.ilike.%Footwear%')
            .lte('retail_price', maxBudget)
            .gt('retail_price', 0)
            .order('rating', { ascending: false })
            .limit(60);

        // 2. Secondary pass: General candidates for gender
        const { data: generalData } = await supabase
            .from('products_new')
            .select(FASHION_SELECT)
            .or(orParts.join(','))
            .ilike('categories.path', `%${genderCat}%`)
            .lte('retail_price', maxBudget)
            .gt('retail_price', 0)
            .order('rating', { ascending: false })
            .limit(40);

        const rawList = [...(apparelData || []), ...(generalData || [])];
        const dedupped = Array.from(new Map(rawList.map((row: any) => [row.product_id || row.uniq_id, row])).values());
        const mapped = dedupped.map((row: any) => mapRawProduct(row)).filter(isFashionProduct);

        const moodBoard = productApi.rankApparelFirst(mapped, 12);
        const topPicks = productApi.rankApparelFirst(mapped.slice(4), 6);

        const archetypeNames: Record<string, string> = {
            'casual-everyday': 'Street Chic',
            'office/formal': 'Corporate Elite',
            'party/going-out': 'Night Bloom',
            'ethnic/festive': 'Heritage Luxe',
        };

        const profile: StyleDnaProfile = {
            archetypes: [
                { name: archetypeNames[answers.occasionFocus] || 'Style Maverick', percentage: 70 },
                { name: answers.colorPreference === 'bold' ? 'Bold Visionary' : 'Minimalist', percentage: 30 },
            ],
            profileTitle: `${archetypeNames[answers.occasionFocus] || 'Style Maven'} — ${answers.colorPreference} palette`,
            description: `Your style is defined by ${answers.occasionFocus.replace(/-/g, ' ')} fashion with ${answers.colorPreference} color preferences. ${answers.fitPreference} fits that work for your lifestyle.`,
            colorPalette: colors,
            keywords,
        };

        return { profile, moodBoard, topPicks };
    },
};

