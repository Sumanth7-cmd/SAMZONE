import { supabase } from './supabaseClient';
import { normalizeImageUrl } from '../utils/productImage';
import { filterPresentationSafe } from './filters/presentationSafe';

export interface CatalogProduct {
    id: number;
    uniq_id: string;
    pid?: string;
    name: string;
    image_url: string;
    rating: number;
    price: number;
    list_price: number;
    brand: string;
    category_path: string;
    discount_percentage?: number;
    description?: string;
    created_at: string;
}

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'rating_desc' | 'bought_last_month_desc';

export interface ProductSearchParams {
    q?: string;
    category?: string;
    gender?: string; // Kept for compatibility but ignored/no-op in new schema
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    isBestSeller?: boolean;
    sort?: ProductSort;
    page?: number;
    pageSize?: number;
}

export interface ProductSearchResponse {
    products: CatalogProduct[];
    totalCount: number;
    page: number;
    totalPages: number;
}

export const CATEGORY_OPTIONS: string[] = [];
export const GENDER_OPTIONS = ['Men', 'Women', 'Unisex', 'Boys', 'Girls'];

const DEFAULT_PAGE_SIZE = 24;
const PRODUCT_SELECT = 'product_id, uniq_id, pid, name, brand_id, category_id, brands!fk_brand(name), categories!fk_category(path), retail_price, discounted_price, description, rating, image, specifications, created_at';

/**
 * Recursively unwrap a raw database `image` value (string, array, or deeply
 * nested JSON string) into normalized Flipkart CDN URLs.  Rejects any URL
 * that normalizeImageUrl flags as invalid (placeholder services, bare paths…).
 */
function extractNormalizedImages(value: unknown, depth = 0): string[] {
    if (depth > 4) return []; // guard against infinite recursion on malformed data
    if (Array.isArray(value)) {
        return value.flatMap((item) => extractNormalizedImages(item, depth + 1));
    }
    if (typeof value !== 'string' || !value.trim()) return [];
    const trimmed = value.trim();
    // Try JSON parse when it looks like an encoded array or string
    if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
        try {
            const parsed = JSON.parse(trimmed);
            // The DB sometimes double-encodes: '["[\"url\"]"]'
            if (parsed !== trimmed) {
                return extractNormalizedImages(parsed, depth + 1);
            }
        } catch { /* not JSON – fall through */ }
    }
    // Pipe-separated list
    if (trimmed.includes('|')) {
        return trimmed.split('|').flatMap((part) => extractNormalizedImages(part.trim(), depth + 1));
    }
    const normalized = normalizeImageUrl(trimmed);
    return normalized ? [normalized] : [];
}

function firstImage(image: unknown): string {
    const results = extractNormalizedImages(image);
    return results[0] || '';
}

interface ProductRow {
    product_id: number;
    uniq_id?: string;
    pid?: string;
    name?: string;
    brand_id?: number;
    category_id?: number;
    retail_price?: number | string | null;
    discounted_price?: number | string | null;
    description?: string;
    rating?: number | null;
    image?: string | string[];
    specifications?: string | null;
    created_at?: string;
    brands?: { name: string } | null;
    categories?: { path: string } | null;
}

function mapProduct(p: any): CatalogProduct {
    const retailPrice = Number(p.retail_price) || 0;
    const discountedPrice = Number(p.discounted_price) || 0;
    const price = (discountedPrice > 0 && discountedPrice < retailPrice) ? discountedPrice : retailPrice;
    const listPrice = retailPrice > 0 ? retailPrice : price;
    const discountPct =
        listPrice > 0 && price < listPrice
            ? Math.round(((listPrice - price) / listPrice) * 100)
            : undefined;
    const brandName = p.brands?.name ?? '';
    const categoryPath = p.categories?.path ?? '';
    const imageUrl = firstImage(p.image);
    return {
        id: p.product_id ?? 0,
        uniq_id: p.uniq_id ?? '',
        pid: p.pid,
        name: p.name ?? '',
        image_url: imageUrl,
        rating: typeof p.rating === 'number' ? p.rating : 0,
        price,
        list_price: listPrice,
        brand: brandName,
        category_path: categoryPath,
        discount_percentage: discountPct,
        description: p.description ?? '',
        created_at: p.created_at || new Date().toISOString(),
    };
}

// --- Near-duplicate suppression -------------------------------------------
//
// The source catalog genuinely repeats the same product_name across distinct
// rows (different external_id/image) up to ~10x (e.g. "Rocia Women Black
// Flats"). Left alone, a narrow search/filter can put several of those on
// one page and read as broken/duplicated results. This caps how many
// same-or-near-same-named products can appear together on a single fetched
// page. It only reorders what was already fetched - no extra query, so at a
// page size of a few dozen rows the O(n * groups) cost is negligible.
const MAX_PER_EXACT_NAME = 1;
const MAX_PER_PATTERN_GROUP = 2;
const MAX_PER_CATEGORY_PATH = 4;

function tokenize(name: string): string[] {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function lastToken(tokens: string[]): string {
    const last = tokens[tokens.length - 1] ?? '';
    return last.endsWith('s') ? last.slice(0, -1) : last;
}

// Extract core pattern (e.g., "a line dress", "jeans", "formal shirt", "t shirt", "boxer", "bra", "sneakers")
function extractCorePattern(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('a-line dress') || lower.includes('a line dress')) return 'a-line dress';
    if (lower.includes('maxi dress')) return 'maxi dress';
    if (lower.includes('dress')) return 'dress';
    if (lower.includes('jeans')) return 'jeans';
    if (lower.includes('t-shirt') || lower.includes('tshirt')) return 't-shirt';
    if (lower.includes('casual shirt')) return 'casual shirt';
    if (lower.includes('formal shirt')) return 'formal shirt';
    if (lower.includes('shirt')) return 'shirt';
    if (lower.includes('trouser') || lower.includes('pants')) return 'trousers';
    if (lower.includes('boxer')) return 'boxer';
    if (lower.includes('bra')) return 'bra';
    if (lower.includes('saree') || lower.includes('sari')) return 'saree';
    if (lower.includes('kurta')) return 'kurta';
    if (lower.includes('kurti')) return 'kurti';
    if (lower.includes('lehenga')) return 'lehenga';
    if (lower.includes('suit')) return 'suit';
    if (lower.includes('blazer')) return 'blazer';
    if (lower.includes('sneaker')) return 'sneakers';
    if (lower.includes('sandal')) return 'sandals';
    if (lower.includes('flats')) return 'flats';
    if (lower.includes('heel')) return 'heels';
    
    const tokens = tokenize(name);
    return lastToken(tokens) || lower;
}

function isNearDuplicateName(a: string, b: string): boolean {
    if (a === b) return true;
    const tokenListA = tokenize(a);
    const tokenListB = tokenize(b);
    if (lastToken(tokenListA) !== lastToken(tokenListB)) return false;

    const tokensA = new Set(tokenListA);
    const tokensB = new Set(tokenListB);
    let shared = 0;
    for (const t of tokensA) {
        if (tokensB.has(t)) shared++;
    }
    const union = tokensA.size + tokensB.size - shared;
    const diff = union - shared;
    return shared > 0 && diff <= 2;
}

function suppressNearDuplicates(products: CatalogProduct[], targetSize: number = 24): CatalogProduct[] {
    const exactNameCount = new Map<string, number>();
    const patternBrandCount = new Map<string, number>();
    const subCatCount = new Map<string, number>();
    const kept: CatalogProduct[] = [];
    const deferred: CatalogProduct[] = [];

    // Pass 1: Strict Diversity Pass
    for (const product of products) {
        const normName = product.name.trim().toLowerCase();
        const currentExact = exactNameCount.get(normName) || 0;
        if (currentExact >= 1) {
            continue; // Deduplicate exact identical product names
        }

        const brand = (product.brand || 'generic').trim().toLowerCase();
        const pattern = extractCorePattern(product.name);
        const patternKey = `${brand}:${pattern}`;
        const currentPatternCount = patternBrandCount.get(patternKey) || 0;

        const parts = product.category_path.split('>>').map((s) => s.trim().toLowerCase());
        const subCat = parts.slice(0, 3).join(' >> ') || 'general';
        const currentCatCount = subCatCount.get(subCat) || 0;

        if (currentPatternCount >= 2 || currentCatCount >= 8) {
            deferred.push(product);
            continue;
        }

        exactNameCount.set(normName, currentExact + 1);
        patternBrandCount.set(patternKey, currentPatternCount + 1);
        subCatCount.set(subCat, currentCatCount + 1);
        kept.push(product);

        if (kept.length >= targetSize) break;
    }

    // Pass 2: Backfill Pass if page is below targetSize
    if (kept.length < targetSize) {
        for (const product of deferred) {
            const normName = product.name.trim().toLowerCase();
            const currentExact = exactNameCount.get(normName) || 0;
            if (currentExact >= 1) continue; // Still prevent exact duplicates

            exactNameCount.set(normName, currentExact + 1);
            kept.push(product);
            if (kept.length >= targetSize) break;
        }
    }

    return kept;
}

// --- Randomized default browse order --------------------------------------
//
// PostgREST's `order=` parameter only accepts column references - it rejects
// `random()` outright (PGRST100 parse error, verified directly against this
// project), and there's no RPC/DB-function access available to work around
// that. Even with one, naive `ORDER BY random() LIMIT/OFFSET` re-shuffles the
// whole table on every request, so page 2 wouldn't be a stable continuation
// of page 1 (rows would repeat or vanish across pages) - the same class of
// bug already ruled out for id-ordering. Instead: pick a random starting
// offset once per browser session, cached in sessionStorage, and browse the
// existing id-ordered sequence from there. Pagination within the session is
// then just a plain indexed range query (cheap, same fast path as before) -
// only the starting point varies between visits.
const SESSION_SEED_KEY = 'shop_browse_seed_v1';

interface BrowseSeedState {
    seed: number;
    totalAtSeedTime: number;
}

function loadBrowseSeed(): BrowseSeedState | null {
    try {
        const raw = sessionStorage.getItem(SESSION_SEED_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.seed === 'number' && typeof parsed?.totalAtSeedTime === 'number') {
            return parsed;
        }
    } catch {
        // sessionStorage unavailable or corrupted value - fall through to regenerate.
    }
    return null;
}

function saveBrowseSeed(state: BrowseSeedState): void {
    try {
        sessionStorage.setItem(SESSION_SEED_KEY, JSON.stringify(state));
    } catch {
        // sessionStorage unavailable (e.g. private browsing) - randomization
        // just won't persist across requests in that case, which is harmless.
    }
}

function isDefaultBrowse(params: ProductSearchParams): boolean {
    return (
        !params.q &&
        !params.category &&
        !params.gender &&
        params.minPrice == null &&
        params.maxPrice == null &&
        params.minRating == null &&
        params.isBestSeller == null &&
        !params.sort
    );
}

// Generating a fresh seed requires an async count query, which leaves a gap
// between "check sessionStorage" and "write sessionStorage" - two calls
// landing in that gap (e.g. React 18 StrictMode's double effect-invocation in
// dev) would each mint their own seed and race to persist it, so the
// requester earlier in the race could display different rows than the seed
// that ends up saved (confirmed while testing: a same-tab refresh showed a
// different product set than the initial load). Memoizing the in-flight
// promise means every concurrent caller within a session shares the same
// resolved seed instead of racing to create one.
let seedPromise: Promise<BrowseSeedState> | null = null;

function getBrowseSeedState(pageSize: number): Promise<BrowseSeedState> {
    const cached = loadBrowseSeed();
    if (cached) return Promise.resolve(cached);

    if (!seedPromise) {
        seedPromise = (async () => {
            const { count, error: countError } = await supabase
                .from('products_new')
                .select('product_id', { count: 'exact', head: true });

            if (countError) {
                seedPromise = null; // allow a retry on the next call
                throw new Error(`Product count failed: ${countError.message}`);
            }

            const total = count ?? 0;
            const maxOffset = Math.max(0, total - pageSize);
            const state: BrowseSeedState = {
                seed: Math.floor(Math.random() * (maxOffset + 1)),
                totalAtSeedTime: total,
            };
            saveBrowseSeed(state);
            return state;
        })();
    }

    return seedPromise;
}

async function fetchRandomizedBrowsePage(page: number, pageSize: number): Promise<ProductSearchResponse> {
    const seedState = await getBrowseSeedState(pageSize);
    const totalPages = Math.max(1, Math.ceil(seedState.totalAtSeedTime / pageSize));
    const FASHION_SELECT = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');

    const BUCKETS = [
        { name: "Men's Clothing", filter: (q: any) => q.ilike('categories.path', '%Clothing >> Men%') },
        { name: "Women's Clothing", filter: (q: any) => q.ilike('categories.path', '%Clothing >> Women%') },
        { name: "Footwear", filter: (q: any) => q.ilike('categories.path', '%Footwear%') },
        { name: "Accessories", filter: (q: any) => q.or('path.ilike.%Accessories%,path.ilike.%Jewellery%,path.ilike.%Bags%,path.ilike.%Watches%', { foreignTable: 'categories' }) },
        { name: "Electronics", filter: (q: any) => q.or('path.ilike.%Electronics%,path.ilike.%Mobiles%,path.ilike.%Computers%', { foreignTable: 'categories' }) },
        { name: "Home & Decor", filter: (q: any) => q.or('path.ilike.%Home Decor%,path.ilike.%Kitchen%,path.ilike.%Stationery%', { foreignTable: 'categories' }) },
    ];

    const itemsPerBucket = Math.ceil(pageSize / BUCKETS.length);
    const bucketOffset = ((page - 1) * itemsPerBucket + seedState.seed) % 300;

    const bucketPromises = BUCKETS.map(async (b) => {
        let q = supabase.from('products_new').select(FASHION_SELECT).gt('retail_price', 0);
        q = b.filter(q);
        const { data } = await q.range(bucketOffset, bucketOffset + 12);
        return (data || []).map((row) => mapProduct(row as unknown as ProductRow));
    });

    const bucketResults = await Promise.all(bucketPromises);

    const interleaved: CatalogProduct[] = [];
    let idx = 0;
    while (interleaved.length < pageSize * 2 && idx < 12) {
        for (let b = 0; b < BUCKETS.length; b++) {
            const item = bucketResults[b][idx];
            if (item) {
                interleaved.push(item);
            }
        }
        idx++;
    }

    const safeProducts = filterPresentationSafe(interleaved);
    const dedupedProducts = suppressNearDuplicates(safeProducts, pageSize * 2);

    // Enforce strict category caps: Hard-cap Accessories to MAX 4 items per page of 24 (<= 16.6% target)
    const finalProducts: CatalogProduct[] = [];
    let accCount = 0;
    const MAX_ACCESSORIES = Math.floor(pageSize * 0.20); // Hard cap: 4 per 24 (16.6%)

    for (const p of dedupedProducts) {
        if (finalProducts.length >= pageSize) break;
        const c = (p.category_path || '').toLowerCase();
        const isAcc = c.includes('accessories') || c.includes('jewellery') || c.includes('jewelry') || c.includes('bags') || c.includes('watches') || c.includes('mobiles');
        if (isAcc) {
            if (accCount < MAX_ACCESSORIES) {
                finalProducts.push(p);
                accCount++;
            }
        } else {
            finalProducts.push(p);
        }
    }

    return {
        products: finalProducts,
        totalCount: seedState.totalAtSeedTime,
        page,
        totalPages,
    };
}

const SYNONYMS: Record<string, string[]> = {
    'sneaker': ['shoe', 'footwear', 'athletic'],
    'sneakers': ['shoes', 'footwear', 'athletic'],
    'tshirt': ['shirt', 'tee', 't-shirt', 'top'],
    't-shirt': ['shirt', 'tee', 'tshirt', 'top'],
    'tee': ['shirt', 'tshirt', 't-shirt', 'top'],
    'jeans': ['pants', 'denim', 'trouser'],
    'jean': ['pants', 'denim', 'trouser'],
    'pant': ['trouser', 'jeans', 'chinos'],
    'pants': ['trousers', 'jeans', 'chinos'],
    'trousers': ['pants', 'jeans'],
    'trouser': ['pants', 'jeans'],
    'saree': ['sari', 'ethnic', 'clothing'],
    'kurta': ['kurti', 'ethnic', 'sherwani'],
    'kurti': ['kurta', 'ethnic'],
    'dress': ['gown', 'frock', 'clothing'],
    'suit': ['blazer', 'formal', 'tuxedo'],
    'blazer': ['suit', 'jacket', 'formal'],
    'heels': ['shoes', 'sandals', 'footwear'],
    'flats': ['shoes', 'sandals', 'footwear'],
    'sandals': ['shoes', 'footwear', 'flats'],
    'sandal': ['shoe', 'footwear', 'flats'],
};

const KNOWN_BRANDS = ['alisha', 'aw', 'dressberry', 'adidas', 'calvin klein', 'riot jeans', 's9 women', 'brandtrendz', 'niremo', 'schtaron', 'adorn', 'catwalk', 'fabindia', 'bata', 'woodland', 'crocs', 'roadster', 'hrx', 'zara', 'h&m'];
const KNOWN_CATEGORIES = ['clothing', 'footwear', 'shoes', 'accessories', 'jewellery', 'jewelry', 'bag', 'handbag', 'watch', 'belt', 'scarf', 'apparel', 'top', 'shirt', 'pants', 'trousers', 'jeans', 'dress', 'saree', 'kurta', 'kurti', 'lehenga'];

const BRAND_TYPOS: Record<string, string> = {
    'nikee': 'nike',
    'niky': 'nike',
    'adidas': 'adidas',
    'adidass': 'adidas',
    'addidas': 'adidas',
    'pumaa': 'puma',
    'pumas': 'puma',
    'zarra': 'zara',
    'levis': 'levi',
    'h&m': 'h&m',
    'handm': 'h&m',
};

const KNOWN_GENDERS = ['men', 'women', 'unisex', 'boys', 'girls'];
const KNOWN_OCCASIONS = ['wedding', 'party', 'office', 'college', 'festival', 'travel'];
const KNOWN_COLORS = ['red', 'blue', 'green', 'black', 'white', 'pink', 'purple', 'orange', 'brown', 'grey', 'navy', 'beige', 'silver', 'gold', 'maroon', 'teal', 'olive', 'cream', 'rust', 'mustard'];

interface ParsedQuery {
    brands: string[];
    categories: string[];
    genders: string[];
    occasions: string[];
    colors: string[];
    terms: string[];
}

function parseQuery(q: string): ParsedQuery {
    const lowerQ = q.toLowerCase();
    const brands: string[] = [];
    const categories: string[] = [];
    const genders: string[] = [];
    const occasions: string[] = [];
    const colors: string[] = [];

    // Apply Brand typo tolerance
    const words = lowerQ.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
    for (const word of words) {
        if (BRAND_TYPOS[word]) {
            brands.push(BRAND_TYPOS[word]);
        }
    }

    for (const brand of KNOWN_BRANDS) {
        if (lowerQ.includes(brand) && !brands.includes(brand)) {
            brands.push(brand);
        }
    }

    for (const category of KNOWN_CATEGORIES) {
        if (lowerQ.includes(category)) {
            categories.push(category);
        }
    }

    for (const g of KNOWN_GENDERS) {
        if (new RegExp(`\\b${g}\\b`, 'i').test(lowerQ)) {
            genders.push(g);
        }
    }

    for (const o of KNOWN_OCCASIONS) {
        if (lowerQ.includes(o)) {
            occasions.push(o);
        }
    }

    for (const col of KNOWN_COLORS) {
        if (new RegExp(`\\b${col}\\b`, 'i').test(lowerQ)) {
            colors.push(col);
        }
    }

    const searchTerms: string[] = [];
    for (const token of words) {
        const isBrandToken = brands.some(b => b.includes(token));
        const isCategoryToken = categories.some(c => c.includes(token));
        const isGenderToken = genders.includes(token);
        const isOccasionToken = occasions.includes(token);
        const isColorToken = colors.includes(token);

        if (!isBrandToken && !isCategoryToken && !isGenderToken && !isOccasionToken && !isColorToken) {
            searchTerms.push(token);
        } else if (isCategoryToken) {
            searchTerms.push(token);
        }
    }

    const expandedTerms = new Set<string>();
    for (const term of searchTerms) {
        expandedTerms.add(term);
        const singular = term.endsWith('s') ? term.slice(0, -1) : term;
        if (singular && singular !== term) {
            expandedTerms.add(singular);
        }
        const synonyms = SYNONYMS[term] || SYNONYMS[singular] || [];
        for (const syn of synonyms) {
            expandedTerms.add(syn);
        }
    }

    return {
        brands,
        categories,
        genders,
        occasions,
        colors,
        terms: Array.from(expandedTerms),
    };
}

export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
    const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? Math.floor(params.pageSize) : DEFAULT_PAGE_SIZE;

    if (isDefaultBrowse(params)) {
        return fetchRandomizedBrowsePage(page, pageSize);
    }

    let parsed: ParsedQuery | null = null;
    if (params.q) {
        parsed = parseQuery(params.q);
    }

    let selectStr = PRODUCT_SELECT;
    if (params.category || params.gender || (parsed && (parsed.categories.length > 0 || parsed.genders.length > 0))) {
        selectStr = selectStr.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
    }
    if (parsed && parsed.brands.length > 0) {
        selectStr = selectStr.replace('brands!fk_brand(name)', 'brands!fk_brand!inner(name)');
    }
    
    let query = supabase.from('products_new').select(selectStr, { count: 'exact' });

    if (parsed && parsed.brands.length > 0) {
        parsed.brands.forEach(b => {
            query = query.ilike('brands.name', `%${b}%`);
        });
    }

    if (parsed && parsed.categories.length > 0) {
        parsed.categories.forEach(c => {
            query = query.ilike('categories.path', `%${c}%`);
        });
    }

    if (parsed && parsed.genders.length > 0) {
        parsed.genders.forEach(g => {
            query = query.ilike('categories.path', `%${g}%`);
        });
    }

    if (parsed && parsed.colors.length > 0) {
        parsed.colors.forEach(col => {
            query = query.or(`name.ilike.%${col}%,description.ilike.%${col}%`);
        });
    }

    if (parsed && parsed.occasions.length > 0) {
        parsed.occasions.forEach(o => {
            query = query.or(`name.ilike.%${o}%,description.ilike.%${o}%`);
        });
    }

    if (params.q && parsed) {
        const orParts: string[] = [];
        
        parsed.terms.forEach(term => {
            orParts.push(`name.ilike.%${term}%`);
            orParts.push(`description.ilike.%${term}%`);
        });

        if (orParts.length > 0) {
            const limitedParts = orParts.slice(0, 16);
            query = query.or(limitedParts.join(','));
        }
    }

    const catFilter = params.category?.trim().toLowerCase();
    const genFilter = params.gender?.trim().toLowerCase();

    if (catFilter === 'men' || genFilter === 'men') {
        query = query
            .or("path.ilike.%Men's Clothing%,path.ilike.%Men's Footwear%,path.ilike.%Men's Accessories%,path.ilike.%Men's Wear%", { foreignTable: 'categories' })
            .not('categories.path', 'ilike', "%Women's%");
    } else if (catFilter === 'women' || genFilter === 'women') {
        query = query
            .or("path.ilike.%Women's Clothing%,path.ilike.%Women's Footwear%,path.ilike.%Women's Accessories%,path.ilike.%Women's Wear%,path.ilike.%Women's%", { foreignTable: 'categories' });
    } else {
        if (params.category) {
            query = query.ilike('categories.path', `%${params.category}%`);
        }
        if (params.gender) {
            query = query.ilike('categories.path', `%${params.gender}%`);
        }
    }

    if (params.minPrice != null) {
        query = query.gte('retail_price', params.minPrice);
    }

    if (params.maxPrice != null) {
        query = query.lte('retail_price', params.maxPrice);
    }

    switch (params.sort) {
        case 'price_asc':
            query = query.order('retail_price', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('retail_price', { ascending: false });
            break;
        case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
        case 'rating_desc':
            query = query.order('rating', { ascending: false });
            break;
        default:
            break;
    }

    query = query.order('product_id', { ascending: true });

    let dedupedAcc: CatalogProduct[] = [];
    let candidateOffset = (page - 1) * pageSize;
    const batchSize = 120;
    let attempts = 0;
    let totalCount = 0;

    while (dedupedAcc.length < pageSize && attempts < 5) {
        attempts++;
        const { data, count, error } = await query.range(candidateOffset, candidateOffset + batchSize - 1);
        if (error) {
            throw new Error(`Product search failed: ${error.message}`);
        }
        if (attempts === 1) {
            totalCount = count ?? 0;
        }
        if (!data || data.length === 0) break;

        const productsMapped = data.map((row) => mapProduct(row as unknown as ProductRow));
        const safeProducts = filterPresentationSafe(productsMapped);
        dedupedAcc = suppressNearDuplicates([...dedupedAcc, ...safeProducts]);

        if (data.length < batchSize) break;
        candidateOffset += batchSize;
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
        products: dedupedAcc.slice(0, pageSize),
        totalCount,
        page,
        totalPages,
    };
}