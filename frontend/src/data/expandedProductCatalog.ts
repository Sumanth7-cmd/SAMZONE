import { getProductImage } from './productImageMapping';

export interface Product {
    id: number;
    name: string;
    brand: string;
    category: string;
    subcategory: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    colors: string[];
    sizes: string[];
    image: string;
    description: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    isNew?: boolean;
    isTrending?: boolean;
    specifications?: string;
    features?: string[];
}

// Expanded product data with 1000+ items
const generateExpandedCatalog = (): Product[] => {
    const products: Product[] = [];
    let id = 1;

    // Men's Clothing - 200 items
    const mensCategories = ['shirts', 'tshirts', 'jeans', 'trousers', 'jackets', 'hoodies', 'shorts', 'sweaters'];
    const mensBrands = ['Nike', 'Adidas', 'Puma', 'Levis', 'Tommy Hilfiger', 'Calvin Klein', 'H&M', 'Zara', 'Gap', 'United Colors of Benetton'];
    const mensColors = ['Black', 'White', 'Navy', 'Gray', 'Blue', 'Beige', 'Olive', 'Burgundy', 'Khaki', 'Charcoal'];
    const mensSizes = ['S', 'M', 'L', 'XL', 'XXL'];

    mensCategories.forEach(category => {
        for (let i = 0; i < 25; i++) {
            const brand = mensBrands[Math.floor(Math.random() * mensBrands.length)];
            const color = mensColors[Math.floor(Math.random() * mensColors.length)];
            const basePrice = 899 + Math.floor(Math.random() * 3000);
            const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 40) + 10 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'mens-clothing',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...mensColors.slice(0, Math.floor(Math.random() * 3) + 1)],
                sizes: mensSizes.slice(0, Math.floor(Math.random() * 3) + 3),
                image: getProductImage('mens-clothing', category),
                description: `Premium ${brand} ${category} made with high-quality materials. Perfect for any occasion.`,
                rating: 3.5 + Math.random() * 1.5,
                reviews: Math.floor(Math.random() * 500) + 10,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.8,
                isTrending: Math.random() > 0.7,
                features: ['Breathable fabric', 'Comfortable fit', 'Stylish design']
            });
        }
    });

    // Women's Clothing - 200 items
    const womensCategories = ['dresses', 'tops', 'jeans', 'skirts', 'kurtis', 'sarees', 'leggings', 'jackets'];
    const womensBrands = ['Zara', 'H&M', 'Mango', 'Forever 21', 'Biba', 'FabIndia', 'W', 'Global Desi', 'Ritu Kumar', 'Sabyasachi'];
    const womensColors = ['Pink', 'Red', 'Blue', 'Black', 'White', 'Yellow', 'Green', 'Purple', 'Orange', 'Maroon'];
    const womensSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    womensCategories.forEach(category => {
        for (let i = 0; i < 25; i++) {
            const brand = womensBrands[Math.floor(Math.random() * womensBrands.length)];
            const color = womensColors[Math.floor(Math.random() * womensColors.length)];
            const basePrice = 1299 + Math.floor(Math.random() * 4000);
            const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 40) + 10 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'womens-clothing',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...womensColors.slice(0, Math.floor(Math.random() * 3) + 1)],
                sizes: womensSizes.slice(0, Math.floor(Math.random() * 3) + 3),
                image: getProductImage('womens-clothing', category),
                description: `Elegant ${brand} ${category} designed for the modern woman. Comfortable and stylish.`,
                rating: 3.5 + Math.random() * 1.5,
                reviews: Math.floor(Math.random() * 500) + 10,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.8,
                isTrending: Math.random() > 0.7,
                features: ['Premium fabric', 'Flattering fit', 'Trendy design']
            });
        }
    });

    // Electronics - 150 items
    const electronicsCategories = ['smartphones', 'laptops', 'headphones', 'smartwatches', 'tablets', 'cameras', 'speakers', 'gaming'];
    const electronicsBrands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Sony', 'HP', 'Dell', 'Lenovo', 'Asus', 'LG', 'Bose', 'JBL'];
    const electronicsColors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Space Gray', 'Rose Gold', 'Midnight Green'];

    electronicsCategories.forEach(category => {
        for (let i = 0; i < 19; i++) {
            const brand = electronicsBrands[Math.floor(Math.random() * electronicsBrands.length)];
            const color = electronicsColors[Math.floor(Math.random() * electronicsColors.length)];
            const basePrice = 2999 + Math.floor(Math.random() * 50000);
            const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 30) + 5 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'electronics',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...electronicsColors.slice(0, Math.floor(Math.random() * 2) + 1)],
                sizes: ['Standard'],
                image: getProductImage('electronics', category),
                description: `Latest ${brand} ${category} with cutting-edge technology and premium features.`,
                rating: 4.0 + Math.random() * 1.0,
                reviews: Math.floor(Math.random() * 1000) + 50,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.7,
                isTrending: Math.random() > 0.6,
                specifications: `Display: ${Math.floor(Math.random() * 4) + 5} inch, Storage: ${Math.floor(Math.random() * 512) + 64}GB, Battery: ${Math.floor(Math.random() * 20) + 10} hours`,
                features: ['Fast performance', 'Long battery life', 'Premium build quality']
            });
        }
    });

    // Footwear - 150 items
    const footwearCategories = ['running-shoes', 'casual-shoes', 'formal-shoes', 'sandals', 'boots', 'sneakers', 'sports-shoes', 'slippers'];
    const footwearBrands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Skechers', 'Woodland', 'Bata', 'Crocs', 'Converse'];
    const footwearColors = ['Black', 'White', 'Red', 'Blue', 'Gray', 'Brown', 'Navy', 'Green', 'Yellow', 'Orange'];
    const footwearSizes = ['6', '7', '8', '9', '10', '11', '12'];

    footwearCategories.forEach(category => {
        for (let i = 0; i < 19; i++) {
            const brand = footwearBrands[Math.floor(Math.random() * footwearBrands.length)];
            const color = footwearColors[Math.floor(Math.random() * footwearColors.length)];
            const basePrice = 1299 + Math.floor(Math.random() * 8000);
            const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 40) + 10 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'footwear',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...footwearColors.slice(0, Math.floor(Math.random() * 3) + 1)],
                sizes: footwearSizes.slice(0, Math.floor(Math.random() * 4) + 4),
                image: getProductImage('footwear', category),
                description: `Comfortable ${brand} ${category} with superior cushioning and style.`,
                rating: 3.5 + Math.random() * 1.5,
                reviews: Math.floor(Math.random() * 800) + 20,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.8,
                isTrending: Math.random() > 0.7,
                features: ['Comfortable fit', 'Durable material', 'Stylish design']
            });
        }
    });

    // Accessories - 100 items
    const accessoriesCategories = ['watches', 'bags', 'wallets', 'belts', 'sunglasses', 'caps', 'jewelry', 'scarves'];
    const accessoriesBrands = ['Titan', 'Fossil', 'Daniel Wellington', 'Coach', 'Michael Kors', 'Ray-Ban', 'Oakley', 'Gucci', 'Louis Vuitton', 'Prada'];
    const accessoriesColors = ['Black', 'Brown', 'Silver', 'Gold', 'Rose Gold', 'Blue', 'Red', 'Green', 'White', 'Gray'];

    accessoriesCategories.forEach(category => {
        for (let i = 0; i < 13; i++) {
            const brand = accessoriesBrands[Math.floor(Math.random() * accessoriesBrands.length)];
            const color = accessoriesColors[Math.floor(Math.random() * accessoriesColors.length)];
            const basePrice = 599 + Math.floor(Math.random() * 15000);
            const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 35) + 10 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'accessories',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...accessoriesColors.slice(0, Math.floor(Math.random() * 2) + 1)],
                sizes: ['One Size'],
                image: getProductImage('accessories', category),
                description: `Premium ${brand} ${category} with elegant design and superior craftsmanship.`,
                rating: 4.0 + Math.random() * 1.0,
                reviews: Math.floor(Math.random() * 600) + 15,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.7,
                isTrending: Math.random() > 0.6,
                features: ['Premium quality', 'Elegant design', 'Durable construction']
            });
        }
    });

    // Home & Living - 100 items
    const homeCategories = ['furniture', 'decor', 'kitchen', 'bedding', 'lighting', 'storage', 'plants', 'electronics'];
    const homeBrands = ['IKEA', 'Godrej', 'Pepperfry', 'Urban Ladder', 'HomeCentre', 'FabIndia', 'Croma', 'Reliance Digital'];
    const homeColors = ['Brown', 'White', 'Black', 'Beige', 'Gray', 'Blue', 'Green', 'Red', 'Yellow', 'Purple'];

    homeCategories.forEach(category => {
        for (let i = 0; i < 13; i++) {
            const brand = homeBrands[Math.floor(Math.random() * homeBrands.length)];
            const color = homeColors[Math.floor(Math.random() * homeColors.length)];
            const basePrice = 999 + Math.floor(Math.random() * 20000);
            const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 30) + 10 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'home',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...homeColors.slice(0, Math.floor(Math.random() * 2) + 1)],
                sizes: ['Standard'],
                image: getProductImage('home', category),
                description: `Stylish ${brand} ${category} perfect for modern homes.`,
                rating: 3.5 + Math.random() * 1.5,
                reviews: Math.floor(Math.random() * 400) + 10,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.7,
                isTrending: Math.random() > 0.6,
                features: ['Modern design', 'Durable material', 'Easy maintenance']
            });
        }
    });

    // Bags & Luggage - 100 items
    const luggageCategories = ['backpacks', 'suitcases', 'handbags', 'travel-bags', 'duffel-bags', 'messenger-bags', 'tote-bags', 'clutches'];
    const luggageBrands = ['Samsonite', 'American Tourister', 'VIP', 'Wildcraft', 'Safari', 'Dell', 'HP', 'Tumi', 'Briggs & Riley'];
    const luggageColors = ['Black', 'Blue', 'Red', 'Gray', 'Navy', 'Brown', 'Silver', 'Pink', 'Purple', 'Green'];

    luggageCategories.forEach(category => {
        for (let i = 0; i < 13; i++) {
            const brand = luggageBrands[Math.floor(Math.random() * luggageBrands.length)];
            const color = luggageColors[Math.floor(Math.random() * luggageColors.length)];
            const basePrice = 1499 + Math.floor(Math.random() * 15000);
            const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 35) + 10 : 0;
            
            products.push({
                id: id++,
                name: `${brand} ${color} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                brand,
                category: 'luggage',
                subcategory: category,
                price: discount ? basePrice * (1 - discount / 100) : basePrice,
                originalPrice: discount ? basePrice : undefined,
                discount: discount || undefined,
                colors: [color, ...luggageColors.slice(0, Math.floor(Math.random() * 2) + 1)],
                sizes: ['Standard'],
                image: getProductImage('luggage', category),
                description: `Durable ${brand} ${category} with ample storage and security features.`,
                rating: 4.0 + Math.random() * 1.0,
                reviews: Math.floor(Math.random() * 500) + 15,
                inStock: Math.random() > 0.1,
                isNew: Math.random() > 0.7,
                isTrending: Math.random() > 0.6,
                features: ['Spacious design', 'Secure locks', 'Lightweight construction']
            });
        }
    });

    return products;
};

export const expandedProductCatalog = generateExpandedCatalog();
export default expandedProductCatalog;
