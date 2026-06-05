export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: 'shirts' | 'pants' | 'shoes' | 'watches' | 'accessories' | 'gadgets';
    brand: string;
    rating: number;
    colors: string[];
    style: 'casual' | 'formal' | 'sport' | 'streetwear' | 'outdoor' | 'luxury';
    description: string;
    inStock: boolean;
    discount?: number;
    tags: string[];
    material?: string;
    fit?: 'slim' | 'regular' | 'loose' | 'athletic';
    occasion?: string[];
    season?: string[];
}

// Realistic product images with proper category mapping
const SHIRT_IMAGES = [
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop', // Black t-shirt
    'https://images.unsplash.com/photo-1521572163474-6814f9a17df7?w=400&h=400&fit=crop', // White shirt
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', // Blue shirt
    'https://images.unsplash.com/photo-1620012236172-2f442a6f1c29?w=400&h=400&fit=crop', // Green shirt
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', // Red shirt
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop', // Gray shirt
    'https://images.unsplash.com/photo-1515886657613-9f3515b79c4f?w=400&h=400&fit=crop', // Denim shirt
    'https://images.unsplash.com/photo-1586790170044-85326b7a04b3?w=400&h=400&fit=crop', // Polo shirt
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', // Formal shirt
    'https://images.unsplash.com/photo-1620012236172-2f442a6f1c29?w=400&h=400&fit=crop', // Casual shirt
];

const PANTS_IMAGES = [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', // Black jeans
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop', // Blue jeans
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', // Chinos
    'https://images.unsplash.com/photo-1598761160984-246f80a43b0c?w=400&h=400&fit=crop', // Cargo pants
    'https://images.unsplash.com/photo-1586790170044-85326b7a04b3?w=400&h=400&fit=crop', // Formal pants
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', // Slim fit
    'https://images.unsplash.com/photo-1598761160984-246f80a43b0c?w=400&h=400&fit=crop', // Joggers
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', // Trousers
];

const SHOES_IMAGES = [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', // White sneakers
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', // Running shoes
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', // Black shoes
    'https://images.unsplash.com/photo-1595950653106-6c919d734de7?w=400&h=400&fit=crop', // Formal shoes
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop', // Boots
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', // Sports shoes
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', // Casual shoes
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop', // Leather shoes
];

const WATCH_IMAGES = [
    'https://images.unsplash.com/photo-1523275335684-378981627f02?w=400&h=400&fit=crop', // Smart watch
    'https://images.unsplash.com/photo-1542496658-e23a507a385d?w=400&h=400&fit=crop', // Analog watch
    'https://images.unsplash.com/photo-1523275335684-378981627f02?w=400&h=400&fit=crop', // Digital watch
    'https://images.unsplash.com/photo-1542496658-e23a507a385d?w=400&h=400&fit=crop', // Luxury watch
    'https://images.unsplash.com/photo-1523275335684-378981627f02?w=400&h=400&fit=crop', // Sport watch
    'https://images.unsplash.com/photo-1542496658-e23a507a385d?w=400&h=400&fit=crop', // Classic watch
];

const ACCESSORIES_IMAGES = [
    'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=400&fit=crop', // Sunglasses
    'https://images.unsplash.com/photo-1528698827599-e855857c4b71?w=400&h=400&fit=crop', // Backpack
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', // Belt
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', // Wallet
    'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=400&fit=crop', // Hat
    'https://images.unsplash.com/photo-1528698827599-e855857c4b71?w=400&h=400&fit=crop', // Bag
];

const GADGET_IMAGES = [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', // Headphones
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // Earbuds
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', // Speaker
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop', // Smart band
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // Charger
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', // Camera
];

// Brand data
const BRANDS = {
    shirts: ['Nike', 'Adidas', 'Puma', 'Levi\'s', 'Tommy Hilfiger', 'Calvin Klein', 'H&M', 'Zara', 'Gap', 'Uniqlo'],
    pants: ['Levi\'s', 'Wrangler', 'Diesel', 'Tommy Hilfiger', 'Calvin Klein', 'H&M', 'Zara', 'Gap', 'Uniqlo', 'Lee'],
    shoes: ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans', 'Skechers', 'Timberland', 'Clarks'],
    watches: ['Rolex', 'Omega', 'Tag Heuer', 'Seiko', 'Citizen', 'Casio', 'Fossil', 'Michael Kors', 'Apple', 'Samsung'],
    accessories: ['Ray-Ban', 'Oakley', 'Gucci', 'Louis Vuitton', 'Coach', 'Michael Kors', 'Kate Spade', 'Tumi', 'Samsonite', 'North Face'],
    gadgets: ['Apple', 'Samsung', 'Sony', 'Bose', 'JBL', 'Beats', 'Sennheiser', 'Anker', 'Belkin', 'Logitech']
};

// Generate realistic products
const generateProducts = (): Product[] => {
    const products: Product[] = [];
    let id = 1;

    // Generate shirts
    const shirtNames = [
        'Classic Cotton T-Shirt', 'Premium Polo Shirt', 'Casual Button-Down', 'Formal Dress Shirt',
        'Denim Jacket', 'Hoodie Sweatshirt', 'Tank Top', 'Long Sleeve Tee', 'Flannel Shirt',
        'Linen Shirt', 'Oxford Shirt', 'Henley Shirt', 'V-Neck Tee', 'Crew Neck Sweatshirt',
        'Athletic Performance Tee', 'Graphic Print Tee', 'Striped Shirt', 'Plaid Shirt',
        'Chambray Shirt', 'Polo Performance Shirt'
    ];

    shirtNames.forEach((name, index) => {
        const colors = ['black', 'white', 'navy', 'gray', 'blue', 'red', 'green', 'brown', 'beige', 'olive'];
        const styles: Product['style'][] = ['casual', 'formal', 'sport', 'streetwear', 'outdoor'];
        
        products.push({
            id: id++,
            name: `${colors[index % colors.length]} ${name}`,
            price: Math.floor(Math.random() * 2000) + 500,
            image: SHIRT_IMAGES[index % SHIRT_IMAGES.length],
            category: 'shirts',
            brand: BRANDS.shirts[index % BRANDS.shirts.length],
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            colors: [colors[index % colors.length], colors[(index + 1) % colors.length], colors[(index + 2) % colors.length]],
            style: styles[index % styles.length],
            description: `Premium quality ${name.toLowerCase()} made from comfortable materials. Perfect for everyday wear.`,
            inStock: Math.random() > 0.1,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
            tags: ['comfortable', 'stylish', 'versatile', 'quality'],
            material: 'Cotton',
            fit: ['slim', 'regular', 'loose'][index % 3] as Product['fit'],
            occasion: [['casual'], ['formal'], ['sport']][index % 3],
            season: [['all-season'], ['summer'], ['winter']][index % 3]
        });
    });

    // Generate pants
    const pantsNames = [
        'Slim Fit Jeans', 'Regular Fit Jeans', 'Cargo Pants', 'Chinos', 'Dress Pants',
        'Joggers', 'Shorts', 'Khakis', 'Corduroys', 'Track Pants',
        'Bootcut Jeans', 'Straight Leg Jeans', 'Relaxed Fit Jeans', 'Skinny Jeans',
        'Wide Leg Pants', 'Pleated Pants', 'Flat Front Pants', 'Stretch Pants',
        'Denim Shorts', 'Cargo Shorts'
    ];

    pantsNames.forEach((name, index) => {
        const colors = ['black', 'blue', 'gray', 'brown', 'beige', 'navy', 'olive', 'khaki'];
        const styles: Product['style'][] = ['casual', 'formal', 'sport', 'streetwear', 'outdoor'];
        
        products.push({
            id: id++,
            name: `${colors[index % colors.length]} ${name}`,
            price: Math.floor(Math.random() * 3000) + 1000,
            image: PANTS_IMAGES[index % PANTS_IMAGES.length],
            category: 'pants',
            brand: BRANDS.pants[index % BRANDS.pants.length],
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            colors: [colors[index % colors.length], colors[(index + 1) % colors.length]],
            style: styles[index % styles.length],
            description: `Comfortable and stylish ${name.toLowerCase()} perfect for any occasion.`,
            inStock: Math.random() > 0.1,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
            tags: ['comfortable', 'durable', 'stylish', 'versatile'],
            material: index % 2 === 0 ? 'Denim' : 'Cotton',
            fit: ['slim', 'regular', 'loose'][index % 3] as Product['fit'],
            occasion: [['casual'], ['formal'], ['sport']][index % 3],
            season: [['all-season'], ['summer'], ['winter']][index % 3]
        });
    });

    // Generate shoes
    const shoesNames = [
        'Running Shoes', 'Basketball Shoes', 'Walking Shoes', 'Formal Shoes', 'Boots',
        'Sneakers', 'Loafers', 'Oxford Shoes', 'Sandals', 'Slippers',
        'Training Shoes', 'CrossFit Shoes', 'Tennis Shoes', 'Hiking Boots', 'Work Boots',
        'Dress Boots', 'Chelsea Boots', 'High Top Sneakers', 'Low Top Sneakers', 'Athletic Shoes'
    ];

    shoesNames.forEach((name, index) => {
        const colors = ['black', 'white', 'gray', 'brown', 'navy', 'red', 'blue', 'green'];
        const styles: Product['style'][] = ['casual', 'formal', 'sport', 'streetwear', 'outdoor'];
        
        products.push({
            id: id++,
            name: `${colors[index % colors.length]} ${name}`,
            price: Math.floor(Math.random() * 5000) + 1500,
            image: SHOES_IMAGES[index % SHOES_IMAGES.length],
            category: 'shoes',
            brand: BRANDS.shoes[index % BRANDS.shoes.length],
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            colors: [colors[index % colors.length], colors[(index + 1) % colors.length]],
            style: styles[index % styles.length],
            description: `High-performance ${name.toLowerCase()} designed for comfort and style.`,
            inStock: Math.random() > 0.1,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
            tags: ['comfortable', 'durable', 'performance', 'stylish'],
            material: index % 2 === 0 ? 'Leather' : 'Synthetic',
            fit: ['slim', 'regular', 'loose'][index % 3] as Product['fit'],
            occasion: [['casual'], ['formal'], ['sport']][index % 3],
            season: [['all-season'], ['summer'], ['winter']][index % 3]
        });
    });

    // Generate watches
    const watchesNames = [
        'Smart Watch', 'Analog Watch', 'Digital Watch', 'Sport Watch', 'Dress Watch',
        'Chronograph Watch', 'Diving Watch', 'Pilot Watch', 'Field Watch', 'Fashion Watch',
        'Luxury Watch', 'Automatic Watch', 'Quartz Watch', 'Fitness Watch', 'Hybrid Watch',
        'Classic Watch', 'Modern Watch', 'Vintage Watch', 'Minimalist Watch', 'Statement Watch'
    ];

    watchesNames.forEach((name, index) => {
        const colors = ['black', 'silver', 'gold', 'rose gold', 'blue', 'brown', 'gray', 'white'];
        const styles: Product['style'][] = ['casual', 'formal', 'sport', 'streetwear', 'luxury'];
        
        products.push({
            id: id++,
            name: `${colors[index % colors.length]} ${name}`,
            price: Math.floor(Math.random() * 10000) + 2000,
            image: WATCH_IMAGES[index % WATCH_IMAGES.length],
            category: 'watches',
            brand: BRANDS.watches[index % BRANDS.watches.length],
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            colors: [colors[index % colors.length]],
            style: styles[index % styles.length],
            description: `Elegant ${name.toLowerCase()} combining style and functionality.`,
            inStock: Math.random() > 0.1,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
            tags: ['elegant', 'precise', 'durable', 'stylish'],
            material: index % 2 === 0 ? 'Stainless Steel' : 'Titanium',
            occasion: [['casual'], ['formal'], ['sport']][index % 3],
            season: [['all-season']][0]
        });
    });

    // Generate accessories
    const accessoriesNames = [
        'Sunglasses', 'Backpack', 'Wallet', 'Belt', 'Hat', 'Scarf', 'Gloves', 'Watch Band',
        'Phone Case', 'Laptop Bag', 'Travel Bag', 'Gym Bag', 'Messenger Bag', 'Tote Bag',
        'Crossbody Bag', 'Clutch', 'Card Holder', 'Keychain', 'Luggage Tag', 'Passport Holder'
    ];

    accessoriesNames.forEach((name, index) => {
        const colors = ['black', 'brown', 'blue', 'red', 'gray', 'navy', 'green', 'beige'];
        const styles: Product['style'][] = ['casual', 'formal', 'sport', 'streetwear', 'luxury'];
        
        products.push({
            id: id++,
            name: `${colors[index % colors.length]} ${name}`,
            price: Math.floor(Math.random() * 3000) + 500,
            image: ACCESSORIES_IMAGES[index % ACCESSORIES_IMAGES.length],
            category: 'accessories',
            brand: BRANDS.accessories[index % BRANDS.accessories.length],
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            colors: [colors[index % colors.length], colors[(index + 1) % colors.length]],
            style: styles[index % styles.length],
            description: `Premium ${name.toLowerCase()} designed for style and convenience.`,
            inStock: Math.random() > 0.1,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
            tags: ['stylish', 'practical', 'durable', 'versatile'],
            material: index % 2 === 0 ? 'Leather' : 'Canvas',
            occasion: [['casual'], ['formal'], ['sport']][index % 3],
            season: [['all-season']][0]
        });
    });

    // Generate gadgets
    const gadgetsNames = [
        'Wireless Headphones', 'Earbuds', 'Smart Speaker', 'Fitness Tracker', 'Power Bank',
        'Wireless Charger', 'Smart Ring', 'Tablet Stand', 'Cable Organizer', 'Phone Holder',
        'Bluetooth Speaker', 'Gaming Headset', 'USB Hub', 'Webcam', 'Microphone',
        'Smart Light', 'Air Purifier', 'Smart Plug', 'Wireless Mouse', 'Keyboard'
    ];

    gadgetsNames.forEach((name, index) => {
        const colors = ['black', 'white', 'blue', 'red', 'gray', 'silver', 'green', 'pink'];
        const styles: Product['style'][] = ['casual', 'sport', 'luxury'];
        
        products.push({
            id: id++,
            name: `${colors[index % colors.length]} ${name}`,
            price: Math.floor(Math.random() * 8000) + 1000,
            image: GADGET_IMAGES[index % GADGET_IMAGES.length],
            category: 'gadgets',
            brand: BRANDS.gadgets[index % BRANDS.gadgets.length],
            rating: Number((Math.random() * 2 + 3).toFixed(1)),
            colors: [colors[index % colors.length], colors[(index + 1) % colors.length]],
            style: styles[index % styles.length],
            description: `Advanced ${name.toLowerCase()} with cutting-edge technology.`,
            inStock: Math.random() > 0.1,
            discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
            tags: ['innovative', 'high-tech', 'reliable', 'user-friendly'],
            material: 'Plastic/Metal',
            occasion: [['casual'], ['sport']][index % 2],
            season: [['all-season']][0]
        });
    });

    return products;
};

export const realisticProducts = generateProducts();

// Helper functions
export const getProductsByCategory = (category: Product['category']): Product[] => {
    return realisticProducts.filter(product => product.category === category);
};

export const getProductsByBrand = (brand: string): Product[] => {
    return realisticProducts.filter(product => product.brand === brand);
};

export const getProductsByStyle = (style: Product['style']): Product[] => {
    return realisticProducts.filter(product => product.style === style);
};

export const getProductsByColor = (color: string): Product[] => {
    return realisticProducts.filter(product => 
        product.colors.some(c => c.toLowerCase() === color.toLowerCase())
    );
};

export const getProductsByPriceRange = (min: number, max: number): Product[] => {
    return realisticProducts.filter(product => 
        product.price >= min && product.price <= max
    );
};

export const searchProducts = (query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    return realisticProducts.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.brand.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
};

export const getFeaturedProducts = (): Product[] => {
    return realisticProducts
        .filter(product => product.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 12);
};

export const getDealsOfTheDay = (): Product[] => {
    return realisticProducts
        .filter(product => product.discount && product.discount > 0)
        .sort((a, b) => (b.discount || 0) - (a.discount || 0))
        .slice(0, 8);
};

export const getTrendingProducts = (): Product[] => {
    return realisticProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, 16);
};
