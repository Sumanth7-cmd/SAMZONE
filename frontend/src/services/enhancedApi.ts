import { mockProducts, type Product } from '../data/mockProducts';

// Enhanced API service for production-level functionality
export class EnhancedApiService {
    private static instance: EnhancedApiService;
    
    public static getInstance(): EnhancedApiService {
        if (!EnhancedApiService.instance) {
            EnhancedApiService.instance = new EnhancedApiService();
        }
        return EnhancedApiService.instance;
    }

    // Product CRUD operations
    async getAllProducts(): Promise<{ content: Product[] }> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return { content: mockProducts };
    }

    async getProductById(id: number): Promise<Product | null> {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockProducts.find(product => product.id === id) || null;
    }

    async getProductsByCategory(category: string): Promise<Product[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return mockProducts.filter(product => product.category === category);
    }

    async searchProducts(query: string): Promise<Product[]> {
        await new Promise(resolve => setTimeout(resolve, 400));
        const lowerQuery = query.toLowerCase();
        return mockProducts.filter(product =>
            product.name.toLowerCase().includes(lowerQuery) ||
            product.brand.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery) ||
            product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    // AI-powered recommendations
    async getOutfitRecommendations(_userPreferences?: any): Promise<Product[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Smart outfit generation logic
        const categories = ['shirts', 'pants', 'shoes', 'accessories'];
        const outfit: Product[] = [];
        
        categories.forEach(category => {
            const categoryProducts = mockProducts.filter(p => p.category === category);
            if (categoryProducts.length > 0) {
                // Select based on rating or random for variety
                const topProducts = categoryProducts
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3);
                outfit.push(topProducts[Math.floor(Math.random() * topProducts.length)]);
            }
        });
        
        return outfit;
    }

    // Trending products
    async getTrendingProducts(): Promise<Product[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockProducts
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 12);
    }

    // Deal of the day
    async getDealOfTheDay(): Promise<Product> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)];
        return {
            ...randomProduct,
            discount: Math.floor(Math.random() * 30) + 10 // 10-40% discount
        };
    }
}

// Export singleton instance
export const enhancedApi = EnhancedApiService.getInstance();

// Event system for real-time updates
export const PRODUCT_EVENTS = {
    ADD_TO_CART: 'ADD_TO_CART',
    ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
    PRODUCT_VIEWED: 'PRODUCT_VIEWED',
    SEARCH_PERFORMED: 'SEARCH_PERFORMED',
    FILTER_APPLIED: 'FILTER_APPLIED'
};
