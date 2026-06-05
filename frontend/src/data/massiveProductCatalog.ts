import { getProductImage } from './productImageMapping';

export interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: 'mens-clothing' | 'womens-clothing' | 'footwear' | 'electronics' | 'home' | 'accessories' | 'luggage';
    subcategory: string;
    brand: string;
    rating: number;
    colors: string[];
    sizes?: string[];
    material?: string;
    description: string;
    inStock: boolean;
    discount?: number;
    tags: string[];
    gender?: 'men' | 'women' | 'unisex';
    occasion?: string[];
    season?: string[];
}

// Category-specific image URLs for accurate mapping
const PRODUCT_IMAGES = {
    'mens-clothing': {
        shirts: [
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1521572163474-6814f9a17df7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1620012236172-2f442a6f1c29?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b79c4f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1586790170044-85326b7a04b3?w=400&h=400&fit=crop'
        ],
        tshirts: [
            'https://images.unsplash.com/photo-1521572163474-6814f9a17df7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1527769459649-0f5d4b5d0151?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop'
        ],
        hoodies: [
            'https://images.unsplash.com/photo-1556821840-3aeb4018cc96?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551488832-009b5ff534d0?w=400&h=400&fit=crop'
        ],
        jackets: [
            'https://images.unsplash.com/photo-1551488831-008cb1628e48?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop'
        ],
        pants: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop'
        ],
        cargos: [
            'https://images.unsplash.com/photo-1598761160984-246f80a43b0c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'
        ],
        jeans: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop'
        ]
    },
    'womens-clothing': {
        dresses: [
            'https://images.unsplash.com/photo-1515372039744-b8e02a3ae846?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=400&fit=crop'
        ],
        tops: [
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515372039744-b8f2a3b434d6?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop'
        ],
        sarees: [
            'https://images.unsplash.com/photo-1610035488353-5e1b1b5d5b5c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop'
        ],
        kurtis: [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1515372039744-b8e02a3ae846?w=400&h=400&fit=crop'
        ],
        skirts: [
            'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop'
        ]
    },
    'footwear': {
        shoes: [
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1595950653106-6c919d734de7?w=400&h=400&fit=crop'
        ],
        sneakers: [
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop'
        ],
        sandals: [
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop'
        ]
    },
    'electronics': {
        mobiles: [
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop'
        ],
        laptops: [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'
        ],
        headphones: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'
        ],
        chargers: [
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'
        ]
    },
    'home': {
        beds: [
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace2?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'
        ],
        blankets: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace2?w=400&h=400&fit=crop'
        ],
        buckets: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace2?w=400&h=400&fit=crop'
        ],
        kitchen: [
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop'
        ]
    },
    'accessories': {
        watches: [
            'https://images.unsplash.com/photo-1523275335684-378981627f02?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1542496658-e23a507a385d?w=400&h=400&fit=crop'
        ],
        bags: [
            'https://images.unsplash.com/photo-1528698827599-e855857c4b71?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
        ],
        belts: [
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
        ],
        caps: [
            'https://images.unsplash.com/photo-1576871337622-98d48d1cb5a9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1586990962369-2b3c5e0a5fca?w=400&h=400&fit=crop'
        ]
    },
    'luggage': {
        travelbags: [
            'https://images.unsplash.com/photo-1528698827599-e855857c4b71?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
        ],
        suitcases: [
            'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=400&fit=crop'
        ]
    }
};

// Brand data for each category
const BRANDS = {
    'mens-clothing': ['Nike', 'Adidas', 'Puma', 'Levi\'s', 'Tommy Hilfiger', 'Calvin Klein', 'H&M', 'Zara', 'Gap', 'Uniqlo', 'U.S. Polo', 'Flying Machine', 'Peter England'],
    'womens-clothing': ['Zara', 'H&M', 'Mango', 'Forever 21', 'Biba', 'FabIndia', 'W', 'Global Desi', 'And', 'Ritu Kumar', 'Sabyasachi'],
    'footwear': ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans', 'Skechers', 'Timberland', 'Clarks', 'Bata', 'Woodland'],
    'electronics': ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Sony', 'Boat', 'JBL', 'HP', 'Dell', 'Lenovo', 'Asus'],
    'home': ['IKEA', 'Godrej', 'Nilkamal', 'Urban Ladder', 'Pepperfry', 'HomeTown', 'Durian', 'Wakefit', 'SleepyCat', 'AmazonBasics'],
    'accessories': ['Titan', 'Fastrack', 'Casio', 'Fossil', 'Michael Kors', 'Coach', 'Louis Vuitton', 'Gucci', 'Ray-Ban', 'Oakley'],
    'luggage': ['Samsonite', 'American Tourister', 'VIP', 'Safari', 'Wildcraft', 'Tumi', 'Delsey', 'Briggs & Riley']
};

// Generate massive product catalog
const generateMassiveProductCatalog = (): Product[] => {
    const products: Product[] = [];
    let id = 1;

    // Men's Clothing
    const mensSubcategories = Object.keys(PRODUCT_IMAGES['mens-clothing']);
    mensSubcategories.forEach(subcategory => {
        const colors = ['black', 'white', 'navy', 'gray', 'blue', 'red', 'green', 'brown', 'beige', 'olive'];
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        const materials = ['Cotton', 'Polyester', 'Denim', 'Linen', 'Wool', 'Blend'];
        
        for (let i = 0; i < 40; i++) { // 40 products per subcategory for men
            const brand = BRANDS['mens-clothing'][i % BRANDS['mens-clothing'].length];
            const color = colors[i % colors.length];
            const size = sizes[i % sizes.length];
            const material = materials[i % materials.length];
            
            products.push({
                id: id++,
                name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} - ${brand}`,
                price: Math.floor(Math.random() * 3000) + 500,
                image: getProductImage('mens-clothing', subcategory, i),
                category: 'mens-clothing',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color, colors[(i + 1) % colors.length]],
                sizes: [size, sizes[(i + 1) % sizes.length]],
                material,
                description: `Premium quality ${subcategory} for men made from ${material}. Perfect for casual and formal occasions.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
                tags: ['comfortable', 'stylish', 'durable', 'trendy'],
                gender: 'men',
                occasion: [['casual'], ['formal'], ['party']][i % 3],
                season: [['summer'], ['winter'], ['all-season']][i % 3]
            });
        }
    });

    // Women's Clothing
    const womensSubcategories = Object.keys(PRODUCT_IMAGES['womens-clothing']);
    womensSubcategories.forEach(subcategory => {
        const colors = ['pink', 'white', 'black', 'red', 'blue', 'purple', 'yellow', 'green', 'gray', 'beige'];
        const sizes = ['XS', 'S', 'M', 'L', 'XL'];
        const materials = ['Silk', 'Cotton', 'Chiffon', 'Georgette', 'Linen', 'Blend'];
        
        for (let i = 0; i < 40; i++) { // 40 products per subcategory for women
            const brand = BRANDS['womens-clothing'][i % BRANDS['womens-clothing'].length];
            const color = colors[i % colors.length];
            const size = sizes[i % sizes.length];
            const material = materials[i % materials.length];
            
            products.push({
                id: id++,
                name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} - ${brand}`,
                price: Math.floor(Math.random() * 4000) + 800,
                image: getProductImage('womens-clothing', subcategory, i),
                category: 'womens-clothing',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color, colors[(i + 1) % colors.length]],
                sizes: [size, sizes[(i + 1) % sizes.length]],
                material,
                description: `Elegant ${subcategory} for women crafted from ${material}. Perfect for special occasions.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
                tags: ['elegant', 'stylish', 'comfortable', 'trendy'],
                gender: 'women',
                occasion: [['casual'], ['formal'], ['party'], ['ethnic']][i % 4],
                season: [['summer'], ['winter'], ['all-season'], ['festive']][i % 4]
            });
        }
    });

    // Footwear
    const footwearSubcategories = Object.keys(PRODUCT_IMAGES['footwear']);
    footwearSubcategories.forEach(subcategory => {
        const colors = ['black', 'white', 'brown', 'blue', 'red', 'gray', 'navy', 'tan'];
        const sizes = ['6', '7', '8', '9', '10', '11'];
        const materials = ['Leather', 'Synthetic', 'Canvas', 'Rubber', 'Mesh'];
        
        for (let i = 0; i < 35; i++) { // 35 products per subcategory for footwear
            const brand = BRANDS['footwear'][i % BRANDS['footwear'].length];
            const color = colors[i % colors.length];
            const size = sizes[i % sizes.length];
            const material = materials[i % materials.length];
            
            products.push({
                id: id++,
                name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${subcategory} - ${brand}`,
                price: Math.floor(Math.random() * 5000) + 1000,
                image: getProductImage('footwear', subcategory, i),
                category: 'footwear',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color, colors[(i + 1) % colors.length]],
                sizes: [size, sizes[(i + 1) % sizes.length]],
                material,
                description: `Comfortable ${subcategory} made from ${material}. Perfect for all-day wear.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
                tags: ['comfortable', 'durable', 'stylish', 'versatile'],
                gender: 'unisex',
                occasion: [['casual'], ['formal'], ['sport']][i % 3],
                season: [['all-season'], ['summer'], ['winter']][i % 3]
            });
        }
    });

    // Electronics
    const electronicsSubcategories = Object.keys(PRODUCT_IMAGES['electronics']);
    electronicsSubcategories.forEach(subcategory => {
        const colors = ['black', 'white', 'silver', 'blue', 'red', 'gray'];
        const specifications = ['64GB', '128GB', '256GB', '512GB', '1TB'];
        
        for (let i = 0; i < 30; i++) { // 30 products per subcategory for electronics
            const brand = BRANDS['electronics'][i % BRANDS['electronics'].length];
            const color = colors[i % colors.length];
            const spec = specifications[i % specifications.length];
            
            products.push({
                id: id++,
                name: `${brand} ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} ${spec} (${color})`,
                price: Math.floor(Math.random() * 50000) + 5000,
                image: getProductImage('electronics', subcategory, i),
                category: 'electronics',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color],
                material: 'Electronic Components',
                description: `Latest ${subcategory} from ${brand} with ${spec} storage. Advanced technology and sleek design.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : undefined,
                tags: ['latest', 'advanced', 'high-tech', 'reliable'],
                gender: 'unisex',
                occasion: [['personal'], ['professional'], ['entertainment']][i % 3],
                season: [['all-season']][0]
            });
        }
    });

    // Home
    const homeSubcategories = Object.keys(PRODUCT_IMAGES['home']);
    homeSubcategories.forEach(subcategory => {
        const colors = ['white', 'brown', 'black', 'gray', 'beige', 'blue'];
        const materials = ['Wood', 'Metal', 'Plastic', 'Fabric', 'Ceramic'];
        
        for (let i = 0; i < 25; i++) { // 25 products per subcategory for home
            const brand = BRANDS['home'][i % BRANDS['home'].length];
            const color = colors[i % colors.length];
            const material = materials[i % materials.length];
            
            products.push({
                id: id++,
                name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${subcategory} - ${brand}`,
                price: Math.floor(Math.random() * 8000) + 1000,
                image: getProductImage('home', subcategory, i),
                category: 'home',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color],
                material,
                description: `High-quality ${subcategory} from ${brand} made from ${material}. Perfect for modern homes.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : undefined,
                tags: ['durable', 'stylish', 'functional', 'modern'],
                gender: 'unisex',
                occasion: [['home'], ['office'], ['outdoor']][i % 3],
                season: [['all-season']][0]
            });
        }
    });

    // Accessories
    const accessoriesSubcategories = Object.keys(PRODUCT_IMAGES['accessories']);
    accessoriesSubcategories.forEach(subcategory => {
        const colors = ['black', 'brown', 'silver', 'gold', 'blue', 'red', 'white'];
        const materials = ['Leather', 'Metal', 'Plastic', 'Fabric', 'Stainless Steel'];
        
        for (let i = 0; i < 30; i++) { // 30 products per subcategory for accessories
            const brand = BRANDS['accessories'][i % BRANDS['accessories'].length];
            const color = colors[i % colors.length];
            const material = materials[i % materials.length];
            
            products.push({
                id: id++,
                name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${subcategory} - ${brand}`,
                price: Math.floor(Math.random() * 10000) + 500,
                image: getProductImage('accessories', subcategory, i),
                category: 'accessories',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color, colors[(i + 1) % colors.length]],
                material,
                description: `Stylish ${subcategory} from ${brand} made from ${material}. Perfect accessory for any outfit.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : undefined,
                tags: ['stylish', 'elegant', 'durable', 'fashionable'],
                gender: 'unisex',
                occasion: [['casual'], ['formal'], ['party']][i % 3],
                season: [['all-season']][0]
            });
        }
    });

    // Luggage
    const luggageSubcategories = Object.keys(PRODUCT_IMAGES['luggage']);
    luggageSubcategories.forEach(subcategory => {
        const colors = ['black', 'blue', 'red', 'gray', 'silver', 'navy'];
        const sizes = ['Small', 'Medium', 'Large', 'Extra Large'];
        const materials = ['Polycarbonate', 'ABS', 'Nylon', 'Leather', 'Canvas'];
        
        for (let i = 0; i < 20; i++) { // 20 products per subcategory for luggage
            const brand = BRANDS['luggage'][i % BRANDS['luggage'].length];
            const color = colors[i % colors.length];
            const size = sizes[i % sizes.length];
            const material = materials[i % materials.length];
            
            products.push({
                id: id++,
                name: `${color.charAt(0).toUpperCase() + color.slice(1)} ${subcategory} (${size}) - ${brand}`,
                price: Math.floor(Math.random() * 8000) + 2000,
                image: getProductImage('luggage', subcategory, i),
                category: 'luggage',
                subcategory,
                brand,
                rating: Number((Math.random() * 2 + 3).toFixed(1)),
                colors: [color],
                material,
                description: `Durable ${subcategory} from ${brand} made from ${material}. Perfect for travel.`,
                inStock: Math.random() > 0.1,
                discount: Math.random() > 0.7 ? Math.floor(Math.random() * 25) + 5 : undefined,
                tags: ['durable', 'lightweight', 'spacious', 'secure'],
                gender: 'unisex',
                occasion: [['travel'], ['business'], ['vacation']][i % 3],
                season: [['all-season']][0]
            });
        }
    });

    return products;
};

export const massiveProductCatalog = generateMassiveProductCatalog();

// Advanced search functions
export const searchProductsByQuery = (query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    const searchTerms = lowerQuery.split(' ');
    
    return massiveProductCatalog.filter(product => {
        const searchableText = [
            product.name,
            product.brand,
            product.category,
            product.subcategory,
            product.description,
            ...product.colors,
            ...product.tags,
            product.material || '',
            ...(product.sizes || []),
            ...(product.occasion || []),
            ...(product.season || [])
        ].join(' ').toLowerCase();
        
        // Check if all search terms are present
        return searchTerms.every(term => searchableText.includes(term));
    });
};

export const getProductsByCategory = (category: Product['category']): Product[] => {
    return massiveProductCatalog.filter(product => product.category === category);
};

export const getProductsBySubcategory = (subcategory: string): Product[] => {
    return massiveProductCatalog.filter(product => product.subcategory === subcategory);
};

export const getProductsByPriceRange = (min: number, max: number): Product[] => {
    return massiveProductCatalog.filter(product => 
        product.price >= min && product.price <= max
    );
};

export const getProductsByColor = (color: string): Product[] => {
    return massiveProductCatalog.filter(product => 
        product.colors.some(c => c.toLowerCase() === color.toLowerCase())
    );
};

export const getProductsByBrand = (brand: string): Product[] => {
    return massiveProductCatalog.filter(product => 
        product.brand.toLowerCase() === brand.toLowerCase()
    );
};

export const getFeaturedProducts = (): Product[] => {
    return massiveProductCatalog
        .filter(product => product.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 20);
};

export const getDealsOfTheDay = (): Product[] => {
    return massiveProductCatalog
        .filter(product => product.discount && product.discount > 0)
        .sort((a, b) => (b.discount || 0) - (a.discount || 0))
        .slice(0, 15);
};

export const getTrendingProducts = (): Product[] => {
    return massiveProductCatalog
        .filter(product => product.rating >= 4.0)
        .sort(() => Math.random() - 0.5)
        .slice(0, 24);
};

export const getNewArrivals = (): Product[] => {
    return massiveProductCatalog
        .sort((a, b) => b.id - a.id)
        .slice(0, 30);
};
