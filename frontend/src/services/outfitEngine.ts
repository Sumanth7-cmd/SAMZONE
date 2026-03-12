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

// Style matching rules for outfit generation
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
        style: 'sport',
        bottom: 'joggers',
        shoes: 'trainers',
        accessory: 'sports watch'
    },
    {
        style: 'casual',
        bottom: 'shorts',
        shoes: 'sandals',
        accessory: 'sunglasses'
    }
];

// Color compatibility rules
const COLOR_COMPATIBILITY: { [key: string]: string[] } = {
    'black': ['beige', 'gray', 'white', 'blue'],
    'white': ['black', 'denim', 'navy', 'khaki'],
    'blue': ['khaki', 'white', 'beige', 'gray'],
    'gray': ['black', 'white', 'blue', 'navy'],
    'navy': ['beige', 'white', 'gray', 'khaki'],
    'khaki': ['navy', 'white', 'black', 'blue'],
    'red': ['black', 'white', 'gray', 'navy'],
    'green': ['khaki', 'beige', 'white', 'navy'],
    'brown': ['beige', 'white', 'blue', 'gray']
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
    
    // Detect product style from name and description
    private static detectStyle(product: Product): string {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const text = `${name} ${description}`;
        
        if (text.includes('street') || text.includes('urban') || text.includes('oversized')) {
            return 'streetwear';
        } else if (text.includes('formal') || text.includes('dress') || text.includes('oxford')) {
            return 'formal';
        } else if (text.includes('sport') || text.includes('athletic') || text.includes('training')) {
            return 'sport';
        } else if (text.includes('casual') || text.includes('comfort')) {
            return 'casual';
        }
        
        return 'streetwear'; // default
    }
    
    // Get compatible products for a category
    private static getCompatibleProducts(allProducts: Product[], category: string, selectedColor: string, selectedStyle: string): Product[] {
        return allProducts.filter(product => {
            const productCategory = product.category.toLowerCase();
            const isInCategory = productCategory.includes(category) || 
                               (category === 'pants' && (productCategory.includes('pant') || productCategory.includes('jean'))) ||
                               (category === 'shoes' && (productCategory.includes('shoe') || productCategory.includes('sneaker'))) ||
                               (category === 'accessories' && (productCategory.includes('accessor') || productCategory.includes('watch') || productCategory.includes('belt'));
            
            if (!isInCategory) return false;
            
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
    
    // Calculate product score for selection
    private static calculateProductScore(product: Product, selectedColor: string, selectedStyle: string): number {
        let score = 0;
        
        // Rating factor (40% of score)
        score += (product.rating || 0) * 4;
        
        // Price balance factor (30% of score) - prefer mid-range prices
        const priceRange = product.price || 0;
        if (priceRange >= 500 && priceRange <= 2000) {
            score += 30;
        } else if (priceRange > 2000 && priceRange <= 5000) {
            score += 20;
        } else if (priceRange <= 500) {
            score += 10;
        }
        
        // Color compatibility factor (20% of score)
        const productColors = product.colors || [];
        const hasCompatibleColor = productColors.some(color => 
            COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())
        );
        if (hasCompatibleColor) {
            score += 20;
        }
        
        // Style compatibility factor (10% of score)
        const productStyle = this.detectStyle(product);
        if (productStyle === selectedStyle || 
            (selectedStyle === 'streetwear' && productStyle === 'casual') ||
            (selectedStyle === 'casual' && productStyle === 'streetwear')) {
            score += 10;
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
    
    // Calculate overall outfit score
    private static calculateOutfitScore(top: Product, bottom: OutfitItem, shoes: OutfitItem, accessory: OutfitItem): number {
        let score = 0;
        const maxScore = 10;
        
        // Color compatibility (40%)
        const topColor = top.colors?.[0]?.toLowerCase() || '';
        const bottomColors = bottom.product?.colors || [];
        const shoesColors = shoes.product?.colors || [];
        const accessoryColors = accessory.product?.colors || [];
        
        const allColors = [topColor, ...bottomColors, ...shoesColors, ...accessoryColors];
        const uniqueColors = [...new Set(allColors)];
        
        if (uniqueColors.length <= 3) { // Good color harmony
            score += 4;
        } else if (uniqueColors.length <= 4) {
            score += 3;
        } else {
            score += 1;
        }
        
        // Style compatibility (30%)
        const topStyle = this.detectStyle(top);
        const bottomStyle = this.detectStyle(bottom.product || {} as Product);
        const shoesStyle = this.detectStyle(shoes.product || {} as Product);
        const accessoryStyle = this.detectStyle(accessory.product || {} as Product);
        
        const styles = [topStyle, bottomStyle, shoesStyle, accessoryStyle];
        const uniqueStyles = [...new Set(styles)];
        
        if (uniqueStyles.length <= 2) { // Good style harmony
            score += 3;
        } else if (uniqueStyles.length <= 3) {
            score += 2;
        } else {
            score += 1;
        }
        
        // Price balance (20%)
        const prices = [
            top.price || 0,
            bottom.product?.price || 0,
            shoes.product?.price || 0,
            accessory.product?.price || 0
        ].filter(p => p > 0);
        
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        if (avgPrice >= 500 && avgPrice <= 3000) {
            score += 2;
        }
        
        // Rating bonus (10%)
        const avgRating = (top.rating || 0 + (bottom.product?.rating || 0) + (shoes.product?.rating || 0) + (accessory.product?.rating || 0)) / 4;
        if (avgRating >= 4.0) {
            score += 1;
        }
        
        return Math.min(score, maxScore);
    }
    
    // Generate explanation for the outfit
    private static generateExplanation(top: Product, bottom: OutfitItem, shoes: OutfitItem, accessory: OutfitItem, score: number): string {
        const scoreLevel = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'needs improvement';
        
        let explanation = `This ${this.detectStyle(top)} outfit scores ${scoreLevel} (${score}/10). `;
        
        if (bottom.product && shoes.product) {
            explanation += `The ${top.colors?.[0]} ${top.name} pairs perfectly with ${bottom.product.colors?.[0]} ${bottom.product.name} and ${shoes.product.colors?.[0]} ${shoes.product.name}. `;
        }
        
        if (accessory.product) {
            explanation += `Adding a ${accessory.product.colors?.[0]} ${accessory.product.name} completes the look with ${accessory.reason}.`;
        }
        
        explanation += `Total outfit price: ₹${((top.price || 0) + (bottom.product?.price || 0) + (shoes.product?.price || 0) + (accessory.product?.price || 0)).toLocaleString('en-IN')}.`;
        
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
