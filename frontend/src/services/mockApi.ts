import type { Product, PaginatedResponse, ProductFilters } from './api';

// Mock product data for testing
const mockProducts: Product[] = [
    {
        id: 1,
        name: "Urban Street Hoodie",
        brand: "Urban Style",
        description: "Comfortable oversized hoodie with streetwear aesthetic",
        price: 1499,
        rating: 4.5,
        image: "https://picsum.photos/seed/hoodie1/400/400.jpg",
        category: "hoodie",
        colors: ["black", "gray", "navy"],
        sizes: ["S", "M", "L", "XL"],
        style: "streetwear",
        specifications: "100% Cotton, Oversized Fit",
        stock: 50,
        discount: 0,
        images: ["https://picsum.photos/seed/hoodie1/400/400.jpg", "https://picsum.photos/seed/hoodie2/400/400.jpg"]
    },
    {
        id: 2,
        name: "Classic Denim Jacket",
        brand: "Denim Co",
        description: "Timeless denim jacket perfect for casual outings",
        price: 2299,
        rating: 4.7,
        image: "https://picsum.photos/seed/jacket1/400/400.jpg",
        category: "jacket",
        colors: ["blue", "black"],
        sizes: ["S", "M", "L", "XL"],
        style: "casual",
        specifications: "Denim, Regular Fit",
        stock: 30,
        discount: 10,
        images: ["https://picsum.photos/seed/jacket1/400/400.jpg", "https://picsum.photos/seed/jacket2/400/400.jpg"]
    },
    {
        id: 3,
        name: "Slim Fit Chinos",
        brand: "Formal Wear",
        description: "Professional slim fit chinos for business casual",
        price: 1799,
        rating: 4.3,
        image: "https://picsum.photos/seed/chinos1/400/400.jpg",
        category: "pants",
        colors: ["beige", "navy", "black", "olive"],
        sizes: ["28", "30", "32", "34", "36"],
        style: "formal",
        specifications: "Cotton Blend, Slim Fit",
        stock: 40,
        discount: 0,
        images: ["https://picsum.photos/seed/chinos1/400/400.jpg", "https://picsum.photos/seed/chinos2/400/400.jpg"]
    },
    {
        id: 4,
        name: "Premium White Sneakers",
        brand: "SportMax",
        description: "Comfortable white sneakers for everyday wear",
        price: 2999,
        rating: 4.6,
        image: "https://picsum.photos/seed/sneakers1/400/400.jpg",
        category: "shoes",
        colors: ["white"],
        sizes: ["7", "8", "9", "10", "11"],
        style: "casual",
        specifications: "Rubber Sole, Mesh Upper",
        stock: 25,
        discount: 15,
        images: ["https://picsum.photos/seed/sneakers1/400/400.jpg", "https://picsum.photos/seed/sneakers2/400/400.jpg"]
    },
    {
        id: 5,
        name: "Elegant Silver Watch",
        brand: "TimePiece",
        description: "Sophisticated silver watch with leather strap",
        price: 3499,
        rating: 4.8,
        image: "https://picsum.photos/seed/watch1/400/400.jpg",
        category: "accessories",
        colors: ["silver", "black"],
        sizes: ["One Size"],
        style: "formal",
        specifications: "Stainless Steel, Leather Strap",
        stock: 15,
        discount: 0,
        images: ["https://picsum.photos/seed/watch1/400/400.jpg", "https://picsum.photos/seed/watch2/400/400.jpg"]
    },
    {
        id: 6,
        name: "Graphic Print T-Shirt",
        brand: "Trendy Tees",
        description: "Stylish graphic t-shirt with modern design",
        price: 799,
        rating: 4.2,
        image: "https://picsum.photos/seed/tshirt1/400/400.jpg",
        category: "shirt",
        colors: ["white", "black", "gray", "navy"],
        sizes: ["S", "M", "L", "XL"],
        style: "casual",
        specifications: "100% Cotton, Regular Fit",
        stock: 60,
        discount: 20,
        images: ["https://picsum.photos/seed/tshirt1/400/400.jpg", "https://picsum.photos/seed/tshirt2/400/400.jpg"]
    },
    {
        id: 7,
        name: "Leather Messenger Bag",
        brand: "BagCo",
        description: "Premium leather messenger bag for work and travel",
        price: 4999,
        rating: 4.7,
        image: "https://picsum.photos/seed/bag1/400/400.jpg",
        category: "accessories",
        colors: ["brown", "black"],
        sizes: ["One Size"],
        style: "formal",
        specifications: "Genuine Leather, Multiple Compartments",
        stock: 20,
        discount: 0,
        images: ["https://picsum.photos/seed/bag1/400/400.jpg", "https://picsum.photos/seed/bag2/400/400.jpg"]
    },
    {
        id: 8,
        name: "Athletic Running Shoes",
        brand: "SportMax",
        description: "High-performance running shoes for athletes",
        price: 3999,
        rating: 4.5,
        image: "https://picsum.photos/seed/running1/400/400.jpg",
        category: "shoes",
        colors: ["black", "blue", "red"],
        sizes: ["7", "8", "9", "10", "11"],
        style: "sport",
        specifications: "Synthetic, Rubber Sole",
        stock: 35,
        discount: 10,
        images: ["https://picsum.photos/seed/running1/400/400.jpg", "https://picsum.photos/seed/running2/400/400.jpg"]
    }
];

// Generate more mock products
const generateMoreProducts = (): Product[] => {
    const categories = ["hoodie", "jacket", "pants", "shirt", "shoes", "accessories"];
    const brands = ["Urban Style", "Denim Co", "Formal Wear", "SportMax", "TimePiece", "Trendy Tees", "BagCo"];
    const styles = ["streetwear", "casual", "formal", "sport"];
    const colors = ["black", "white", "gray", "navy", "blue", "red", "green", "brown", "beige", "olive"];
    
    const additionalProducts: Product[] = [];
    
    for (let i = 9; i <= 50; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const style = styles[Math.floor(Math.random() * styles.length)];
        const productColors = [colors[Math.floor(Math.random() * colors.length)], colors[Math.floor(Math.random() * colors.length)]];
        
        additionalProducts.push({
            id: i,
            name: `Product ${i} - ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            brand,
            description: `High-quality ${category} from ${brand} with ${style} styling`,
            price: Math.floor(Math.random() * 4000) + 500,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
            image: `https://picsum.photos/seed/product${i}/400/400.jpg`,
            category,
            colors: productColors,
            sizes: category === "shoes" ? ["7", "8", "9", "10", "11"] : 
                   category === "accessories" ? ["One Size"] : 
                   ["S", "M", "L", "XL"],
            style,
            specifications: "Premium materials, Quality construction",
            stock: Math.floor(Math.random() * 100) + 10,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0,
            images: [`https://picsum.photos/seed/product${i}/400/400.jpg`]
        });
    }
    
    return additionalProducts;
};

const allMockProducts = [...mockProducts, ...generateMoreProducts()];

// Mock API functions
export const mockApi = {
    getProducts: async (page: number = 0, size: number = 20, filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        
        let filteredProducts = [...allMockProducts];
        
        // Apply filters
        if (filters) {
            if (filters.category) {
                filteredProducts = filteredProducts.filter(p => p.category === filters.category);
            }
            if (filters.minPrice) {
                filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
            }
            if (filters.maxPrice) {
                filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
            }
            if (filters.minRating) {
                filteredProducts = filteredProducts.filter(p => p.rating >= filters.minRating!);
            }
        }
        
        // Sort
        if (filters?.sortBy) {
            filteredProducts.sort((a, b) => {
                const aValue = a[filters.sortBy as keyof Product];
                const bValue = b[filters.sortBy as keyof Product];
                
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return filters.sortDir === 'desc' ? 
                        bValue.localeCompare(aValue) : 
                        aValue.localeCompare(bValue);
                }
                
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return filters.sortDir === 'desc' ? bValue - aValue : aValue - bValue;
                }
                
                return 0;
            });
        }
        
        // Paginate
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const content = filteredProducts.slice(startIndex, endIndex);
        
        return {
            content,
            totalElements: filteredProducts.length,
            totalPages: Math.ceil(filteredProducts.length / size),
            size,
            number: page,
            first: page === 0,
            last: endIndex >= filteredProducts.length
        };
    },

    getAllProducts: async (): Promise<Product[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return allMockProducts;
    },

    getProductById: async (id: number): Promise<Product> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const product = allMockProducts.find(p => p.id === id);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    },

    searchProducts: async (query: string, page: number = 0, size: number = 20): Promise<PaginatedResponse<Product>> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const searchResults = allMockProducts.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase()) ||
            p.brand.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );
        
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const content = searchResults.slice(startIndex, endIndex);
        
        return {
            content,
            totalElements: searchResults.length,
            totalPages: Math.ceil(searchResults.length / size),
            size,
            number: page,
            first: page === 0,
            last: endIndex >= searchResults.length
        };
    },

    getCategories: async (): Promise<string[]> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return [...new Set(allMockProducts.map(p => p.category))];
    }
};
