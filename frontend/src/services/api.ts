import { mockApi } from './mockApi';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || false;

// Amazon-sourced prices in the database are stored in USD; Myntra prices are
// already in INR. There's no reliable per-row way to tell them apart, so we
// apply this as a blanket approximation to make prices read correctly for
// Indian users (Myntra items will look inflated as a known tradeoff).
export const USD_TO_INR_RATE = 83;

// The seeded catalog's `colors` field only ever holds a handful of basic
// values (Black, Blue, Green, Red, White), but skin-tone recommendations use
// fashion names (Coral, Gold, Mustard, Emerald, ...) that never appear
// verbatim. Without this fallback, most recommended colors would match zero
// products, so each fashion name maps to its nearest basic catalog color.
const COLOR_FAMILY_FALLBACK: Record<string, string[]> = {
    coral: ['red'],
    peach: ['white', 'red'],
    mustard: ['green'],
    gold: ['white'],
    lavender: ['blue'],
    teal: ['blue', 'green'],
    plum: ['red', 'black'],
    'hot pink': ['red'],
    emerald: ['green'],
    'forest green': ['green'],
    'olive green': ['green'],
    'royal blue': ['blue'],
    'navy blue': ['blue'],
};

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

// Shared shape mapper for the raw entity JSON returned by /products, /products/{id},
// /products/search and /products/bestsellers - keeps the USD->INR conversion and
// field selection in one place instead of repeating it at every call site.
const mapRawProduct = (p: any): Product => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    description: p.description,
    price: p.price * USD_TO_INR_RATE,
    rating: p.rating,
    image: p.images?.[0] || 'https://picsum.photos/300',
    category: p.category,
    images: p.images,
    discount: p.discount,
    originalPrice: p.originalPrice != null ? p.originalPrice * USD_TO_INR_RATE : undefined,
    stock: p.stock,
    colors: p.colors,
    sizes: p.sizes,
    specifications: p.specifications,
});

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
    getProducts: async (page: number = 0, size: number = 20, filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
        if (USE_MOCK_API) {
            return mockApi.getProducts(page, size, filters);
        }

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        if (filters) {
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.brand) params.append('brand', filters.brand);
            if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
            if (filters.minRating) params.append('minRating', filters.minRating.toString());
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.sortDir) params.append('sortDir', filters.sortDir);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();

            return {
                ...data,
                content: (data.content || []).map(mapRawProduct)
            };
        } catch (error) {
            console.warn('Backend API unavailable, using mock data:', error);
            return mockApi.getProducts(page, size, filters);
        }
    },

    getAllProducts: async (): Promise<Product[]> => {
        if (USE_MOCK_API) {
            return mockApi.getAllProducts();
        }
        
        try {
            const data = await productApi.getProducts(0, 100);
            return data.content;
        } catch (error) {
            console.warn('Backend API unavailable, using mock data:', error);
            return mockApi.getAllProducts();
        }
    },

    getProductById: async (id: number): Promise<Product> => {
        if (USE_MOCK_API) {
            return mockApi.getProductById(id);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch product');
            }
            const p = await response.json();
            return mapRawProduct(p);
        } catch (error) {
            console.warn('Backend API unavailable, using mock data:', error);
            return mockApi.getProductById(id);
        }
    },

    searchProducts: async (query: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<Product>> => {
        if (USE_MOCK_API) {
            return mockApi.searchProducts(query, page, size);
        }

        const params = new URLSearchParams({
            q: query,
            page: page.toString(),
            size: size.toString(),
        });

        try {
            const response = await fetch(`${API_BASE_URL}/products/search?${params}`);
            if (!response.ok) {
                throw new Error('Failed to search products');
            }
            const data = await response.json();

            return {
                ...data,
                content: (data.content || []).map(mapRawProduct)
            };
        } catch (error) {
            console.warn('Backend API unavailable, using mock data:', error);
            return mockApi.searchProducts(query, page, size);
        }
    },

    getCategories: async (): Promise<string[]> => {
        if (USE_MOCK_API) {
            return mockApi.getCategories();
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/categories`);
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        } catch (error) {
            console.warn('Backend API unavailable, using mock data:', error);
            return mockApi.getCategories();
        }
    },

    getBrands: async (): Promise<string[]> => {
        if (USE_MOCK_API) {
            return [];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/brands`);
            if (!response.ok) {
                throw new Error('Failed to fetch brands');
            }
            return response.json();
        } catch (error) {
            console.warn('Failed to fetch brands:', error);
            return [];
        }
    },

    getBestsellers: async (): Promise<Product[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/bestsellers`);
            if (!response.ok) {
                throw new Error('Failed to fetch bestsellers');
            }
            const data = await response.json();
            return (data || []).map(mapRawProduct);
        } catch (error) {
            console.warn('Failed to fetch bestsellers:', error);
            return [];
        }
    },

    getDeals: async (): Promise<Product[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/deals`);
            if (!response.ok) {
                throw new Error('Failed to fetch deals');
            }
            const data = await response.json();
            return (data || []).map(mapRawProduct);
        } catch (error) {
            console.warn('Failed to fetch deals:', error);
            return [];
        }
    },

    // The backend's /products/search endpoint only matches name/description/brand,
    // not the colors field, so this pulls real products from clothing categories and
    // filters client-side by their `colors` array instead of relying on that endpoint.
    // getAllProducts() alone only returns the first 100 products by id, which skews
    // toward non-fashion categories, so this queries clothing categories directly.
    searchByColor: async (color: string, limit: number = 6): Promise<Product[]> => {
        const target = color.toLowerCase();
        const targets = [target, ...(COLOR_FAMILY_FALLBACK[target] || [])];
        const matchesColor = (p: Product) =>
            (p.colors || []).some(c => {
                const cl = c.toLowerCase();
                return targets.some(t => cl.includes(t) || t.includes(cl));
            });

        const CLOTHING_CATEGORIES = ["Men's Clothing", "Women's Clothing", "Men's Footwear", "Accessories"];
        const pages = await Promise.all(
            CLOTHING_CATEGORIES.map(category =>
                productApi.getProducts(0, 100, { category }).catch(() => ({ content: [] as Product[] }))
            )
        );
        const matches = pages.flatMap(pg => pg.content).filter(matchesColor);
        return matches.slice(0, limit);
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

export const visualSearchApi = {
    search: async (imageBase64: string): Promise<{ detected: VisualSearchDetection | null; products: Product[] }> => {
        const response = await fetch(`${API_BASE_URL}/visual-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64 }),
        });
        if (!response.ok) {
            throw new Error('Visual search failed');
        }
        const data = await response.json();
        return {
            detected: data.detected || null,
            products: (data.products || []).map(mapRawProduct),
        };
    },
};

export interface StylistPick {
    product: Product;
    reason: string;
}

export const stylistApi = {
    completeLook: async (productId: number): Promise<{ product: Product; picks: StylistPick[] }> => {
        const response = await fetch(`${API_BASE_URL}/stylist/complete-look`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
        });
        if (!response.ok) {
            throw new Error('Complete the Look failed');
        }
        const data = await response.json();
        return {
            product: mapRawProduct(data.product),
            picks: (data.picks || []).map((p: any) => ({
                product: mapRawProduct(p.product),
                reason: p.reason,
            })),
        };
    },
};
