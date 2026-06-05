export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    brand: string;
    rating: number;
    colors: string[];
    style: string;
    description: string;
    inStock: boolean;
    discount?: number;
    tags: string[];
}

export const mockProducts: Product[] = [
    // SHIRTS
    {
        id: 1,
        name: "Urban Black Oversized T-Shirt",
        price: 899,
        image: "https://picsum.photos/seed/shirt1/400/400",
        category: "shirts",
        brand: "Urban Street",
        rating: 4.5,
        colors: ["black", "gray", "white"],
        style: "casual",
        description: "Premium cotton oversized t-shirt perfect for streetwear",
        inStock: true,
        discount: 10,
        tags: ["oversized", "cotton", "streetwear", "casual"]
    },
    {
        id: 2,
        name: "Classic White Formal Shirt",
        price: 1299,
        image: "https://picsum.photos/seed/shirt2/400/400",
        category: "shirts",
        brand: "Premium Fashion",
        rating: 4.7,
        colors: ["white", "blue", "pink"],
        style: "formal",
        description: "Classic formal shirt perfect for office wear",
        inStock: true,
        tags: ["formal", "office", "cotton", "classic"]
    },
    {
        id: 3,
        name: "Navy Blue Polo Shirt",
        price: 1099,
        image: "https://picsum.photos/seed/shirt3/400/400",
        category: "shirts",
        brand: "Sport Elite",
        rating: 4.3,
        colors: ["navy", "white", "red"],
        style: "sport",
        description: "Performance polo shirt for active lifestyle",
        inStock: true,
        tags: ["polo", "sport", "performance", "active"]
    },
    {
        id: 4,
        name: "Olive Green Utility Shirt",
        price: 1499,
        image: "https://picsum.photos/seed/shirt4/400/400",
        category: "shirts",
        brand: "Adventure Gear",
        rating: 4.6,
        colors: ["olive", "khaki", "black"],
        style: "outdoor",
        description: "Durable utility shirt for outdoor adventures",
        inStock: true,
        tags: ["utility", "outdoor", "durable", "adventure"]
    },
    {
        id: 5,
        name: "Graphic Print Street Tee",
        price: 799,
        image: "https://picsum.photos/seed/shirt5/400/400",
        category: "shirts",
        brand: "Artistic Wear",
        rating: 4.4,
        colors: ["black", "white", "gray"],
        style: "streetwear",
        description: "Unique graphic print t-shirt for self-expression",
        inStock: true,
        discount: 15,
        tags: ["graphic", "streetwear", "artistic", "unique"]
    },

    // PANTS
    {
        id: 6,
        name: "Beige Cargo Pants",
        price: 1299,
        image: "https://picsum.photos/seed/pants1/400/400",
        category: "pants",
        brand: "Urban Street",
        rating: 4.5,
        colors: ["beige", "olive", "black"],
        style: "casual",
        description: "Functional cargo pants with multiple pockets",
        inStock: true,
        tags: ["cargo", "casual", "functional", "streetwear"]
    },
    {
        id: 7,
        name: "Slim Fit Black Jeans",
        price: 1899,
        image: "https://picsum.photos/seed/pants2/400/400",
        category: "pants",
        brand: "Denim Co",
        rating: 4.6,
        colors: ["black", "blue", "gray"],
        style: "casual",
        description: "Modern slim fit jeans for contemporary style",
        inStock: true,
        tags: ["jeans", "slim", "denim", "modern"]
    },
    {
        id: 8,
        name: "Gray Formal Trousers",
        price: 1599,
        image: "https://picsum.photos/seed/pants3/400/400",
        category: "pants",
        brand: "Executive Wear",
        rating: 4.7,
        colors: ["gray", "navy", "black"],
        style: "formal",
        description: "Professional formal trousers for business meetings",
        inStock: true,
        tags: ["formal", "business", "executive", "professional"]
    },
    {
        id: 9,
        name: "Navy Blue Chinos",
        price: 1399,
        image: "https://picsum.photos/seed/pants4/400/400",
        category: "pants",
        brand: "Classic Style",
        rating: 4.4,
        colors: ["navy", "khaki", "beige"],
        style: "casual",
        description: "Versatile chinos perfect for smart casual",
        inStock: true,
        tags: ["chinos", "versatile", "smart", "casual"]
    },
    {
        id: 10,
        name: "Olive Green Joggers",
        price: 999,
        image: "https://picsum.photos/seed/pants5/400/400",
        category: "pants",
        brand: "Comfort Plus",
        rating: 4.3,
        colors: ["olive", "gray", "black"],
        style: "sport",
        description: "Comfortable joggers for active lifestyle",
        inStock: true,
        discount: 20,
        tags: ["joggers", "comfort", "sport", "active"]
    },

    // SHOES
    {
        id: 11,
        name: "White Classic Sneakers",
        price: 1999,
        image: "https://picsum.photos/seed/shoes1/400/400",
        category: "shoes",
        brand: "Urban Steps",
        rating: 4.6,
        colors: ["white", "black", "red"],
        style: "casual",
        description: "Classic white sneakers for everyday wear",
        inStock: true,
        tags: ["sneakers", "classic", "white", "versatile"]
    },
    {
        id: 12,
        name: "Black Running Shoes",
        price: 2499,
        image: "https://picsum.photos/seed/shoes2/400/400",
        category: "shoes",
        brand: "Speed Pro",
        rating: 4.7,
        colors: ["black", "blue", "orange"],
        style: "sport",
        description: "High-performance running shoes for athletes",
        inStock: true,
        tags: ["running", "performance", "sport", "athletic"]
    },
    {
        id: 13,
        name: "Brown Leather Formal Shoes",
        price: 3299,
        image: "https://picsum.photos/seed/shoes3/400/400",
        category: "shoes",
        brand: "Premium Leather",
        rating: 4.8,
        colors: ["brown", "black", "tan"],
        style: "formal",
        description: "Genuine leather formal shoes for special occasions",
        inStock: true,
        tags: ["leather", "formal", "premium", "classic"]
    },
    {
        id: 14,
        name: "Gray Canvas Shoes",
        price: 1599,
        image: "https://picsum.photos/seed/shoes4/400/400",
        category: "shoes",
        brand: "Casual Comfort",
        rating: 4.3,
        colors: ["gray", "white", "navy"],
        style: "casual",
        description: "Comfortable canvas shoes for daily wear",
        inStock: true,
        discount: 25,
        tags: ["canvas", "comfort", "casual", "everyday"]
    },
    {
        id: 15,
        name: "Red Basketball Shoes",
        price: 2799,
        image: "https://picsum.photos/seed/shoes5/400/400",
        category: "shoes",
        brand: "Court Master",
        rating: 4.5,
        colors: ["red", "black", "white"],
        style: "sport",
        description: "Professional basketball shoes for court performance",
        inStock: true,
        tags: ["basketball", "court", "sport", "performance"]
    },

    // ACCESSORIES
    {
        id: 16,
        name: "Silver Smart Watch",
        price: 799,
        image: "https://picsum.photos/seed/watch1/400/400",
        category: "accessories",
        brand: "Tech Time",
        rating: 4.6,
        colors: ["silver", "black", "rose gold"],
        style: "tech",
        description: "Smart watch with fitness tracking and notifications",
        inStock: true,
        tags: ["smart", "watch", "tech", "fitness"]
    },
    {
        id: 17,
        name: "Black Leather Belt",
        price: 599,
        image: "https://picsum.photos/seed/belt1/400/400",
        category: "accessories",
        brand: "Classic Accessories",
        rating: 4.4,
        colors: ["black", "brown", "tan"],
        style: "formal",
        description: "Genuine leather belt for formal wear",
        inStock: true,
        tags: ["leather", "belt", "formal", "classic"]
    },
    {
        id: 18,
        name: "Trendy Sunglasses",
        price: 899,
        image: "https://picsum.photos/seed/sunglasses1/400/400",
        category: "accessories",
        brand: "Shade Pro",
        rating: 4.3,
        colors: ["black", "tortoise", "gold"],
        style: "casual",
        description: "UV protection sunglasses with modern style",
        inStock: true,
        discount: 10,
        tags: ["sunglasses", "uv", "style", "protection"]
    },
    {
        id: 19,
        name: "Minimalist Wallet",
        price: 499,
        image: "https://picsum.photos/seed/wallet1/400/400",
        category: "accessories",
        brand: "Slim Carry",
        rating: 4.5,
        colors: ["black", "brown", "tan"],
        style: "minimalist",
        description: "Slim minimalist wallet for essential cards",
        inStock: true,
        tags: ["wallet", "minimalist", "slim", "essential"]
    },
    {
        id: 20,
        name: "Canvas Backpack",
        price: 1199,
        image: "https://picsum.photos/seed/backpack1/400/400",
        category: "accessories",
        brand: "Urban Carry",
        rating: 4.6,
        colors: ["black", "gray", "navy"],
        style: "casual",
        description: "Spacious canvas backpack for daily commute",
        inStock: true,
        tags: ["backpack", "canvas", "spacious", "commute"]
    },

    // JACKETS & OUTERWEAR
    {
        id: 21,
        name: "Black Bomber Jacket",
        price: 2299,
        image: "https://picsum.photos/seed/jacket1/400/400",
        category: "jackets",
        brand: "Urban Street",
        rating: 4.7,
        colors: ["black", "green", "navy"],
        style: "casual",
        description: "Modern bomber jacket for street style",
        inStock: true,
        tags: ["bomber", "jacket", "streetwear", "modern"]
    },
    {
        id: 22,
        name: "Denim Classic Jacket",
        price: 2599,
        image: "https://picsum.photos/seed/jacket2/400/400",
        category: "jackets",
        brand: "Denim Co",
        rating: 4.5,
        colors: ["blue", "black", "gray"],
        style: "casual",
        description: "Classic denim jacket for timeless style",
        inStock: true,
        tags: ["denim", "jacket", "classic", "timeless"]
    },
    {
        id: 23,
        name: "Technical Waterproof Jacket",
        price: 3299,
        image: "https://picsum.photos/seed/jacket3/400/400",
        category: "jackets",
        brand: "Adventure Gear",
        rating: 4.8,
        colors: ["red", "black", "blue"],
        style: "outdoor",
        description: "Waterproof technical jacket for all weather",
        inStock: true,
        tags: ["waterproof", "technical", "outdoor", "weather"]
    },
    {
        id: 24,
        name: "Lightweight Windbreaker",
        price: 1799,
        image: "https://picsum.photos/seed/jacket4/400/400",
        category: "jackets",
        brand: "Wind Pro",
        rating: 4.4,
        colors: ["yellow", "black", "orange"],
        style: "sport",
        description: "Lightweight windbreaker for active sports",
        inStock: true,
        discount: 15,
        tags: ["windbreaker", "lightweight", "sport", "active"]
    }
];

export const getProductsByCategory = (category: string): Product[] => {
    return mockProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
    );
};

export const getProductsByStyle = (style: string): Product[] => {
    return mockProducts.filter(product => 
        product.style.toLowerCase() === style.toLowerCase()
    );
};

export const getProductsByColor = (color: string): Product[] => {
    return mockProducts.filter(product => 
        product.colors.some(c => c.toLowerCase() === color.toLowerCase())
    );
};

export const getProductsByPriceRange = (min: number, max: number): Product[] => {
    return mockProducts.filter(product => 
        product.price >= min && product.price <= max
    );
};

export const searchProducts = (query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    return mockProducts.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.brand.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
};
