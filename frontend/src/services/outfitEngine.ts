import type { Product } from './api';

export interface OutfitItem {
    product: Product;
    category: string;
    reason: string;
}

export interface OutfitRecommendation {
    top: OutfitItem;
    bottom: OutfitItem;
    shoes: OutfitItem;
    accessory: OutfitItem;
    score: number;
    totalPrice: number;
    explanation: string;
}

export interface StyleRule {
    style: string;
    bottom: string;
    shoes: string;
    accessory: string;
}

// Enhanced style matching rules for outfit generation
const STYLE_RULES: StyleRule[] = [
    {
        style: 'streetwear',
        bottom: 'cargo pants',
        shoes: 'sneakers',
        accessory: 'cap'
    },
    {
        style: 'streetwear',
        bottom: 'cargo pants',
        shoes: 'sneakers',
        accessory: 'watch'
    },
    {
        style: 'streetwear',
        bottom: 'jeans',
        shoes: 'sneakers',
        accessory: 'backpack'
    },
    {
        style: 'streetwear',
        bottom: 'joggers',
        shoes: 'sneakers',
        accessory: 'chain'
    },
    {
        style: 'formal',
        bottom: 'chinos',
        shoes: 'loafers',
        accessory: 'leather belt'
    },
    {
        style: 'formal',
        bottom: 'dress pants',
        shoes: 'oxford shoes',
        accessory: 'tie'
    },
    {
        style: 'formal',
        bottom: 'trousers',
        shoes: 'derby shoes',
        accessory: 'watch'
    },
    {
        style: 'formal',
        bottom: 'chinos',
        shoes: 'monk strap',
        accessory: 'pocket square'
    },
    {
        style: 'sport',
        bottom: 'joggers',
        shoes: 'trainers',
        accessory: 'sports watch'
    },
    {
        style: 'sport',
        bottom: 'shorts',
        shoes: 'running shoes',
        accessory: 'headband'
    },
    {
        style: 'sport',
        bottom: 'track pants',
        shoes: 'athletic shoes',
        accessory: 'gym bag'
    },
    {
        style: 'casual',
        bottom: 'shorts',
        shoes: 'sandals',
        accessory: 'sunglasses'
    },
    {
        style: 'casual',
        bottom: 'jeans',
        shoes: 'casual shoes',
        accessory: 'leather belt'
    },
    {
        style: 'casual',
        bottom: 'chinos',
        shoes: 'loafers',
        accessory: 'watch'
    },
    {
        style: 'casual',
        bottom: 'khakis',
        shoes: 'boat shoes',
        accessory: 'canvas belt'
    },
    {
        style: 'business casual',
        bottom: 'chinos',
        shoes: 'oxford shoes',
        accessory: 'leather belt'
    },
    {
        style: 'business casual',
        bottom: 'dress pants',
        shoes: 'loafers',
        accessory: 'watch'
    },
    {
        style: 'business casual',
        bottom: 'trousers',
        shoes: 'derby shoes',
        accessory: 'tie'
    },
    {
        style: 'minimalist',
        bottom: 'plain pants',
        shoes: 'minimal sneakers',
        accessory: 'minimal watch'
    },
    {
        style: 'minimalist',
        bottom: 'simple trousers',
        shoes: 'plain shoes',
        accessory: 'leather belt'
    }
];

// Enhanced color compatibility rules with undertone consideration
const COLOR_COMPATIBILITY: { [key: string]: string[] } = {
    'black': ['beige', 'gray', 'white', 'blue', 'navy', 'red', 'green', 'purple', 'pink', 'brown'],
    'white': ['black', 'denim', 'navy', 'khaki', 'gray', 'red', 'blue', 'green', 'purple', 'pink'],
    'blue': ['khaki', 'white', 'beige', 'gray', 'navy', 'black', 'brown', 'orange', 'yellow'],
    'gray': ['black', 'white', 'blue', 'navy', 'pink', 'purple', 'red', 'yellow', 'green'],
    'navy': ['beige', 'white', 'gray', 'khaki', 'brown', 'orange', 'yellow', 'red'],
    'khaki': ['navy', 'white', 'black', 'blue', 'brown', 'green', 'red', 'yellow'],
    'red': ['black', 'white', 'gray', 'navy', 'blue', 'khaki', 'beige', 'pink'],
    'green': ['khaki', 'beige', 'white', 'navy', 'brown', 'black', 'yellow', 'blue'],
    'brown': ['beige', 'white', 'blue', 'gray', 'green', 'orange', 'yellow', 'cream'],
    'pink': ['gray', 'white', 'black', 'navy', 'blue', 'purple', 'brown'],
    'purple': ['gray', 'white', 'black', 'blue', 'pink', 'yellow', 'green'],
    'orange': ['black', 'white', 'gray', 'navy', 'blue', 'brown', 'green'],
    'yellow': ['black', 'white', 'gray', 'navy', 'blue', 'brown', 'green', 'purple'],
    'cream': ['black', 'brown', 'navy', 'blue', 'green', 'gray', 'purple'],
    'denim': ['white', 'black', 'gray', 'red', 'blue', 'yellow', 'green']
};

export class OutfitEngine {
    
    // Generate complete outfit based on selected product
    static generateOutfit(selectedProduct: Product, allProducts: Product[]): OutfitRecommendation {
        const selectedCategory = selectedProduct.category.toLowerCase();
        const selectedColor = selectedProduct.colors?.[0]?.toLowerCase() || 'black';
        const selectedStyle = this.detectStyle(selectedProduct);
        
        // Get compatible products for each category
        const bottoms = this.getCompatibleProducts(allProducts, 'pants', selectedColor, selectedStyle);
        const shoes = this.getCompatibleProducts(allProducts, 'shoes', selectedColor, selectedStyle);
        const accessories = this.getCompatibleProducts(allProducts, 'accessories', selectedColor, selectedStyle);
        
        // Select best options
        const bestBottom = this.selectBestProduct(bottoms, selectedColor, selectedStyle);
        const bestShoes = this.selectBestProduct(shoes, selectedColor, selectedStyle);
        const bestAccessory = this.selectBestProduct(accessories, selectedColor, selectedStyle);
        
        // Calculate outfit score
        const score = this.calculateOutfitScore(selectedProduct, bestBottom, bestShoes, bestAccessory);
        
        // Generate explanation
        const explanation = this.generateExplanation(selectedProduct, bestBottom, bestShoes, bestAccessory, score);
        
        const totalPrice = (selectedProduct.price || 0) + 
                        (bestBottom?.product?.price || 0) + 
                        (bestShoes?.product?.price || 0) + 
                        (bestAccessory?.product?.price || 0);
        
        return {
            top: {
                product: selectedProduct,
                category: selectedCategory,
                reason: 'Your selected item'
            },
            bottom: bestBottom,
            shoes: bestShoes,
            accessory: bestAccessory,
            score,
            totalPrice,
            explanation
        };
    }
    
    // Detect product style from name and description with enhanced logic
    private static detectStyle(product: Product): string {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const tags = (product.tags || []).join(' ').toLowerCase();
        const text = `${name} ${description} ${tags}`;
        
        if (text.includes('street') || text.includes('urban') || text.includes('oversized') || 
            text.includes('hoodie') || text.includes('graphic') || text.includes('distressed')) {
            return 'streetwear';
        } else if (text.includes('formal') || text.includes('dress') || text.includes('oxford') || 
                   text.includes('suit') || text.includes('blazer') || text.includes('dress shirt')) {
            return 'formal';
        } else if (text.includes('sport') || text.includes('athletic') || text.includes('training') || 
                   text.includes('performance') || text.includes('running') || text.includes('gym')) {
            return 'sport';
        } else if (text.includes('casual') || text.includes('comfort') || text.includes('relaxed') || 
                   text.includes('everyday') || text.includes('weekend')) {
            return 'casual';
        } else if (text.includes('business') || text.includes('office') || text.includes('professional') || 
                   text.includes('work') || text.includes('corporate')) {
            return 'business casual';
        } else if (text.includes('minimal') || text.includes('simple') || text.includes('clean') || 
                   text.includes('basic') || text.includes('essential')) {
            return 'minimalist';
        }
        
        return 'streetwear'; // default
    }
    
    // Get compatible products for a category
    private static getCompatibleProducts(allProducts: Product[], category: string, selectedColor: string, selectedStyle: string): Product[] {
        return allProducts.filter(product => {
            const productCategory = product.category.toLowerCase();
            
            // Check if product belongs to the correct category
            const isInCategory =
                (category === 'pants' && productCategory.includes('pant')) ||
                (category === 'shoes' && productCategory.includes('shoe')) ||
                (category === 'accessories' && (
                    productCategory.includes('watch') ||
                    productCategory.includes('belt') ||
                    productCategory.includes('accessory')
                ));
            
            if (!isInCategory) {
                return false;
            }
            
            // Check color compatibility
            const productColors = product.colors || [];
            const hasCompatibleColor = productColors.some(color => 
                COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())
            );
            
            // Check style compatibility
            const productStyle = this.detectStyle(product);
            const isStyleCompatible = productStyle === selectedStyle || 
                                     (selectedStyle === 'streetwear' && productStyle === 'casual') ||
                                     (selectedStyle === 'casual' && productStyle === 'streetwear');
            
            return hasCompatibleColor && isStyleCompatible;
        });
    }
    
    // Select best product from compatible options
    private static selectBestProduct(products: Product[], selectedColor: string, selectedStyle: string): OutfitItem {
        if (products.length === 0) {
            return {
                product: null as any,
                category: '',
                reason: 'No compatible items found'
            };
        }
        
        // Sort by rating and price balance
        const sorted = products.sort((a, b) => {
            const aScore = this.calculateProductScore(a, selectedColor, selectedStyle);
            const bScore = this.calculateProductScore(b, selectedColor, selectedStyle);
            return bScore - aScore;
        });
        
        const best = sorted[0];
        return {
            product: best,
            category: best.category.toLowerCase(),
            reason: this.getSelectionReason(best, selectedColor, selectedStyle)
        };
    }
    
    // Calculate product score for selection with enhanced algorithm
    private static calculateProductScore(product: Product, selectedColor: string, selectedStyle: string): number {
        let score = 0;
        
        // Rating factor (35% of score)
        score += (product.rating || 0) * 3.5;
        
        // Price balance factor (25% of score) - prefer mid-range prices
        const priceRange = product.price || 0;
        if (priceRange >= 500 && priceRange <= 2000) {
            score += 25;
        } else if (priceRange > 2000 && priceRange <= 5000) {
            score += 20;
        } else if (priceRange <= 500) {
            score += 15;
        } else {
            score += 10;
        }
        
        // Color compatibility factor (25% of score) - enhanced with multiple color checks
        const productColors = product.colors || [];
        let colorScore = 0;
        productColors.forEach(color => {
            if (COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())) {
                colorScore += 25;
            }
        });
        score += Math.min(colorScore, 25);
        
        // Style compatibility factor (15% of score) - enhanced with more flexible matching
        const productStyle = this.detectStyle(product);
        if (productStyle === selectedStyle) {
            score += 15;
        } else if (
            (selectedStyle === 'streetwear' && (productStyle === 'casual' || productStyle === 'minimalist')) ||
            (selectedStyle === 'casual' && (productStyle === 'streetwear' || productStyle === 'business casual')) ||
            (selectedStyle === 'business casual' && (productStyle === 'formal' || productStyle === 'casual')) ||
            (selectedStyle === 'formal' && productStyle === 'business casual')
        ) {
            score += 10;
        } else {
            score += 5;
        }
        
        // Brand consistency bonus (optional, 5% of score)
        if (product.brand && ['Nike', 'Adidas', 'Zara', 'H&M'].includes(product.brand)) {
            score += 5;
        }
        
        return score;
    }
    
    // Generate selection reason
    private static getSelectionReason(product: Product, selectedColor: string, selectedStyle: string): string {
        const reasons = [];
        
        if (product.rating && product.rating >= 4.5) {
            reasons.push('Highly rated');
        }
        
        const productColors = product.colors || [];
        const hasCompatibleColor = productColors.some(color => 
            COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())
        );
        if (hasCompatibleColor) {
            reasons.push('Color compatible');
        }
        
        const productStyle = this.detectStyle(product);
        if (productStyle === selectedStyle || 
            (selectedStyle === 'streetwear' && productStyle === 'casual') ||
            (selectedStyle === 'casual' && productStyle === 'streetwear')) {
            reasons.push('Style matches');
        }
        
        return reasons.join(', ');
    }
    
    // Calculate overall outfit score with enhanced algorithm
    private static calculateOutfitScore(top: Product, bottom: OutfitItem, shoes: OutfitItem, accessory: OutfitItem): number {
        let score = 0;
        const maxScore = 10;
        
        // Color compatibility (40%) - enhanced with better color harmony analysis
        const topColor = top.colors?.[0]?.toLowerCase() || '';
        const bottomColors = bottom.product?.colors || [];
        const shoesColors = shoes.product?.colors || [];
        const accessoryColors = accessory.product?.colors || [];
        
        const allColors = [topColor, ...bottomColors, ...shoesColors, ...accessoryColors];
        const uniqueColors = [...new Set(allColors)];
        
        // Check for color harmony
        let colorHarmonyScore = 0;
        if (uniqueColors.length <= 2) { // Monochromatic or analogous - excellent
            colorHarmonyScore = 4;
        } else if (uniqueColors.length === 3) { // Triadic or complementary - very good
            colorHarmonyScore = 3.5;
        } else if (uniqueColors.length <= 4) { // Good balance
            colorHarmonyScore = 3;
        } else { // Too many colors - needs improvement
            colorHarmonyScore = 1.5;
        }
        
        // Check color compatibility between items
        let compatibilityScore = 0;
        const colorPairs = [
            [topColor, bottomColors[0]],
            [bottomColors[0], shoesColors[0]],
            [shoesColors[0], accessoryColors[0]]
        ];
        
        colorPairs.forEach(([color1, color2]) => {
            if (color1 && color2 && COLOR_COMPATIBILITY[color1]?.includes(color2?.toLowerCase())) {
                compatibilityScore += 0.5;
            }
        });
        
        score += colorHarmonyScore + Math.min(compatibilityScore, 0.5);
        
        // Style compatibility (30%) - enhanced with better style matching
        const topStyle = this.detectStyle(top);
        const bottomStyle = this.detectStyle(bottom.product || {} as Product);
        const shoesStyle = this.detectStyle(shoes.product || {} as Product);
        const accessoryStyle = this.detectStyle(accessory.product || {} as Product);
        
        const styles = [topStyle, bottomStyle, shoesStyle, accessoryStyle];
        const uniqueStyles = [...new Set(styles)];
        
        let styleScore = 0;
        if (uniqueStyles.length === 1) { // Perfect style match
            styleScore = 3;
        } else if (uniqueStyles.length === 2) { // Good style harmony (e.g., casual + streetwear)
            styleScore = 2.5;
        } else if (uniqueStyles.length <= 3) { // Acceptable mix
            styleScore = 2;
        } else { // Too many styles - needs improvement
            styleScore = 1;
        }
        
        score += styleScore;
        
        // Price balance (20%) - enhanced with better price range analysis
        const prices = [
            top.price || 0,
            bottom.product?.price || 0,
            shoes.product?.price || 0,
            accessory.product?.price || 0
        ].filter(p => p > 0);
        
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const totalPrice = prices.reduce((sum, price) => sum + price, 0);
        
        let priceScore = 0;
        if (avgPrice >= 500 && avgPrice <= 3000) { // Good price balance
            priceScore = 2;
        } else if (avgPrice >= 3000 && avgPrice <= 5000) { // Premium but reasonable
            priceScore = 1.5;
        } else if (avgPrice < 500) { // Budget-friendly
            priceScore = 1;
        } else { // Very expensive
            priceScore = 0.5;
        }
        
        score += priceScore;
        
        // Rating bonus (10%) - enhanced with weighted average
        const ratings = [
            top.rating || 0,
            bottom.product?.rating || 0,
            shoes.product?.rating || 0,
            accessory.product?.rating || 0
        ].filter(r => r > 0);
        
        const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        if (avgRating >= 4.5) {
            score += 1;
        } else if (avgRating >= 4.0) {
            score += 0.8;
        } else if (avgRating >= 3.5) {
            score += 0.5;
        }
        
        return Math.min(score, maxScore);
    }
    
    // Generate explanation for the outfit with enhanced details
    private static generateExplanation(top: Product, bottom: OutfitItem, shoes: OutfitItem, accessory: OutfitItem, score: number): string {
        const scoreLevel = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'needs improvement';
        const style = this.detectStyle(top);
        
        let explanation = `This ${style} outfit scores ${scoreLevel} (${score.toFixed(1)}/10). `;
        
        // Add style-specific explanation
        if (style === 'streetwear') {
            explanation += `Perfect for urban adventures and casual outings. `;
        } else if (style === 'formal') {
            explanation += `Ideal for professional settings and special occasions. `;
        } else if (style === 'sport') {
            explanation += `Great for athletic activities and active lifestyles. `;
        } else if (style === 'casual') {
            explanation += `Perfect for everyday wear and relaxed settings. `;
        } else if (style === 'business casual') {
            explanation += `Suitable for modern workplaces and smart casual events. `;
        } else if (style === 'minimalist') {
            explanation += `Clean and simple for those who prefer understated elegance. `;
        }
        
        // Add color harmony explanation
        const topColor = top.colors?.[0]?.toLowerCase() || '';
        const bottomColor = bottom.product?.colors?.[0]?.toLowerCase() || '';
        const shoesColor = shoes.product?.colors?.[0]?.toLowerCase() || '';
        
        if (bottom.product && shoes.product) {
            explanation += `The ${topColor} ${top.name} creates a harmonious look with ${bottomColor} ${bottom.product.name} and ${shoesColor} ${shoes.product.name}. `;
        }
        
        // Add accessory explanation
        if (accessory.product) {
            explanation += `The ${accessory.product.colors?.[0]} ${accessory.product.name} adds the perfect finishing touch with ${accessory.reason}. `;
        }
        
        // Add price information
        const totalPrice = (top.price || 0) + (bottom.product?.price || 0) + (shoes.product?.price || 0) + (accessory.product?.price || 0);
        explanation += `Total outfit price: ₹${totalPrice.toLocaleString('en-IN')}. `;
        
        // Add specific recommendations based on score
        if (score >= 8) {
            explanation += `This is a perfectly coordinated outfit with excellent color harmony and style consistency.`;
        } else if (score >= 6) {
            explanation += `This is a well-balanced outfit with good color coordination and style matching.`;
        } else if (score >= 4) {
            explanation += `This outfit has room for improvement in color coordination or style consistency.`;
        } else {
            explanation += `Consider adjusting the color palette or style choices for better harmony.`;
        }
        
        return explanation;
    }
    
    // Get style rule for a given style
    static getStyleRule(style: string): StyleRule | null {
        return STYLE_RULES.find(rule => rule.style === style) || null;
    }
    
    // Get color compatibility for a color
    static getColorCompatibility(color: string): string[] {
        return COLOR_COMPATIBILITY[color.toLowerCase()] || [];
    }
}
