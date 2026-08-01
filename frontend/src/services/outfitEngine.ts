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

export const OUTFIT_TEMPLATES: Record<string, Record<string, string[]>> = {
    women: {
        wedding:   ['saree', 'lehenga', 'gown', 'kurta'],
        birthday:  ['dress', 'top', 'blouse', 'kurti'],
        office:    ['blouse', 'top', 'shirt', 'trouser', 'formal'],
        festival:  ['saree', 'kurta', 'kurti', 'salwar', 'lehenga'],
        college:   ['jeans', 'top', 'shirt', 'dress', 'kurti'],
        travel:    ['jeans', 'top', 'jacket', 'kurta'],
        casual:    ['top', 'jeans', 'dress', 'kurti'],
    },
    men: {
        wedding:   ['sherwani', 'kurta', 'suit', 'blazer'],
        birthday:  ['shirt', 'trouser', 'jeans', 'tshirt'],
        office:    ['formal shirt', 'trouser', 'suit', 'blazer'],
        festival:  ['kurta', 'sherwani', 'ethnic', 'dhoti'],
        college:   ['tshirt', 'jeans', 'shirt', 'hoodie'],
        travel:    ['jeans', 'tshirt', 'jacket', 'cargo'],
        casual:    ['tshirt', 'jeans', 'shirt', 'shorts'],
    },
};

export const COLOR_FAMILY_FALLBACK: Record<string, string[]> = {
    coral: ['peach', 'pink', 'red', 'orange'],
    peach: ['coral', 'pink', 'white', 'red'],
    mustard: ['yellow', 'gold', 'brown'],
    gold: ['yellow', 'mustard', 'beige'],
    lavender: ['purple', 'violet', 'blue'],
    teal: ['blue', 'green', 'cyan'],
    plum: ['purple', 'maroon', 'red', 'black'],
    'hot pink': ['pink', 'magenta', 'red'],
    emerald: ['green'],
    'forest green': ['green'],
    'olive green': ['green'],
    'royal blue': ['blue'],
    'navy blue': ['navy', 'blue'],
};

// Enhanced style matching rules for outfit generation
export const STYLE_RULES: StyleRule[] = [
    { style: 'streetwear', bottom: 'cargo pants', shoes: 'sneakers', accessory: 'cap' },
    { style: 'streetwear', bottom: 'cargo pants', shoes: 'sneakers', accessory: 'watch' },
    { style: 'streetwear', bottom: 'jeans', shoes: 'sneakers', accessory: 'backpack' },
    { style: 'streetwear', bottom: 'joggers', shoes: 'sneakers', accessory: 'chain' },
    { style: 'formal', bottom: 'chinos', shoes: 'loafers', accessory: 'leather belt' },
    { style: 'formal', bottom: 'dress pants', shoes: 'oxford shoes', accessory: 'tie' },
    { style: 'formal', bottom: 'trousers', shoes: 'derby shoes', accessory: 'watch' },
    { style: 'formal', bottom: 'chinos', shoes: 'monk strap', accessory: 'pocket square' },
    { style: 'sport', bottom: 'joggers', shoes: 'trainers', accessory: 'sports watch' },
    { style: 'sport', bottom: 'shorts', shoes: 'running shoes', accessory: 'headband' },
    { style: 'sport', bottom: 'track pants', shoes: 'athletic shoes', accessory: 'gym bag' },
    { style: 'casual', bottom: 'shorts', shoes: 'sandals', accessory: 'sunglasses' },
    { style: 'casual', bottom: 'jeans', shoes: 'casual shoes', accessory: 'leather belt' },
    { style: 'casual', bottom: 'chinos', shoes: 'loafers', accessory: 'watch' },
    { style: 'casual', bottom: 'khakis', shoes: 'boat shoes', accessory: 'canvas belt' },
    { style: 'business casual', bottom: 'chinos', shoes: 'oxford shoes', accessory: 'leather belt' },
    { style: 'business casual', bottom: 'dress pants', shoes: 'loafers', accessory: 'watch' },
    { style: 'business casual', bottom: 'trousers', shoes: 'derby shoes', accessory: 'tie' },
    { style: 'minimalist', bottom: 'plain pants', shoes: 'minimal sneakers', accessory: 'minimal watch' },
    { style: 'minimalist', bottom: 'simple trousers', shoes: 'plain shoes', accessory: 'leather belt' }
];

// Color compatibility rules based on complementary/harmonious color matching
export const COLOR_COMPATIBILITY: Record<string, string[]> = {
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
    
    // Detect product style from name, description, or tags
    static detectStyle(product: Product): string {
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
        
        return 'casual'; // default
    }

    // Select the best outfit combination matching a seed product
    static generateOutfit(selectedProduct: Product, allProducts: Product[]): OutfitRecommendation {
        const selectedCategory = selectedProduct.category.toLowerCase();
        const selectedColor = selectedProduct.colors?.[0]?.toLowerCase() || 'black';
        const selectedStyle = this.detectStyle(selectedProduct);
        
        const bottoms = this.getCompatibleProducts(allProducts, 'pants', selectedColor, selectedStyle);
        const shoes = this.getCompatibleProducts(allProducts, 'shoes', selectedColor, selectedStyle);
        const accessories = this.getCompatibleProducts(allProducts, 'accessories', selectedColor, selectedStyle);
        
        const bestBottom = this.selectBestProduct(bottoms, selectedColor, selectedStyle);
        const bestShoes = this.selectBestProduct(shoes, selectedColor, selectedStyle);
        const bestAccessory = this.selectBestProduct(accessories, selectedColor, selectedStyle);
        
        const score = this.calculateOutfitScore(selectedProduct, bestBottom, bestShoes, bestAccessory);
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
    
    private static getCompatibleProducts(allProducts: Product[], category: string, selectedColor: string, selectedStyle: string): Product[] {
        return allProducts.filter(product => {
            const productCategory = product.category.toLowerCase();
            
            const isInCategory =
                (category === 'pants' && productCategory.includes('pant')) ||
                (category === 'shoes' && productCategory.includes('shoe')) ||
                (category === 'accessories' && (
                    productCategory.includes('watch') ||
                    productCategory.includes('belt') ||
                    productCategory.includes('accessory')
                ));
            
            if (!isInCategory) return false;
            
            const productColors = product.colors || [];
            const hasCompatibleColor = productColors.some(color => 
                COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())
            );
            
            const productStyle = this.detectStyle(product);
            const isStyleCompatible = productStyle === selectedStyle || 
                                     (selectedStyle === 'streetwear' && productStyle === 'casual') ||
                                     (selectedStyle === 'casual' && productStyle === 'streetwear');
            
            return hasCompatibleColor && isStyleCompatible;
        });
    }
    
    private static selectBestProduct(products: Product[], selectedColor: string, selectedStyle: string): OutfitItem {
        if (products.length === 0) {
            return {
                product: null as any,
                category: '',
                reason: 'No compatible items found'
            };
        }
        
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
    
    private static calculateProductScore(product: Product, selectedColor: string, selectedStyle: string): number {
        let score = 0;
        score += (product.rating || 0) * 3.5;
        
        const priceVal = product.price || 0;
        if (priceVal >= 500 && priceVal <= 2000) {
            score += 25;
        } else if (priceVal > 2000 && priceVal <= 5000) {
            score += 20;
        } else if (priceVal <= 500) {
            score += 15;
        } else {
            score += 10;
        }
        
        const productColors = product.colors || [];
        let colorScore = 0;
        productColors.forEach(color => {
            if (COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())) {
                colorScore += 25;
            }
        });
        score += Math.min(colorScore, 25);
        
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
        
        return score;
    }
    
    private static getSelectionReason(product: Product, selectedColor: string, selectedStyle: string): string {
        const reasons = [];
        if (product.rating && product.rating >= 4.5) reasons.push('Highly rated');
        
        const productColors = product.colors || [];
        const hasCompatibleColor = productColors.some(color => 
            COLOR_COMPATIBILITY[selectedColor]?.includes(color.toLowerCase())
        );
        if (hasCompatibleColor) reasons.push('Color compatible');
        
        const productStyle = this.detectStyle(product);
        if (productStyle === selectedStyle || 
            (selectedStyle === 'streetwear' && productStyle === 'casual') ||
            (selectedStyle === 'casual' && productStyle === 'streetwear')) {
            reasons.push('Style matches');
        }
        
        return reasons.length > 0 ? reasons.join(', ') : 'Pairs well';
    }
    
    private static calculateOutfitScore(top: Product, bottom: OutfitItem, shoes: OutfitItem, accessory: OutfitItem): number {
        let score = 0;
        const topColor = top.colors?.[0]?.toLowerCase() || '';
        const bottomColors = bottom.product?.colors || [];
        const shoesColors = shoes.product?.colors || [];
        const accessoryColors = accessory.product?.colors || [];
        
        const allColors = [topColor, ...bottomColors, ...shoesColors, ...accessoryColors].filter(Boolean);
        const uniqueColors = [...new Set(allColors)];
        
        if (uniqueColors.length <= 2) score += 4;
        else if (uniqueColors.length === 3) score += 3.5;
        else if (uniqueColors.length <= 4) score += 3;
        else score += 1.5;
        
        let compatibilityScore = 0;
        const colorPairs = [
            [topColor, bottomColors[0]],
            [bottomColors[0], shoesColors[0]],
            [shoesColors[0], accessoryColors[0]]
        ];
        
        colorPairs.forEach(([color1, color2]) => {
            if (color1 && color2 && COLOR_COMPATIBILITY[color1]?.includes(color2.toLowerCase())) {
                compatibilityScore += 0.5;
            }
        });
        score += Math.min(compatibilityScore, 1.0);
        
        const topStyle = this.detectStyle(top);
        const bottomStyle = bottom.product ? this.detectStyle(bottom.product) : '';
        const shoesStyle = shoes.product ? this.detectStyle(shoes.product) : '';
        const accessoryStyle = accessory.product ? this.detectStyle(accessory.product) : '';
        
        const styles = [topStyle, bottomStyle, shoesStyle, accessoryStyle].filter(Boolean);
        const uniqueStyles = [...new Set(styles)];
        
        if (uniqueStyles.length === 1) score += 3;
        else if (uniqueStyles.length === 2) score += 2.5;
        else if (uniqueStyles.length <= 3) score += 2;
        else score += 1;
        
        const ratings = [
            top.rating || 0,
            bottom.product?.rating || 0,
            shoes.product?.rating || 0,
            accessory.product?.rating || 0
        ].filter(r => r > 0);
        
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / (ratings.length || 1);
        if (avgRating >= 4.5) score += 2;
        else if (avgRating >= 4.0) score += 1.5;
        else score += 1.0;
        
        return Math.min(score, 10);
    }
    
    private static generateExplanation(top: Product, bottom: OutfitItem, shoes: OutfitItem, accessory: OutfitItem, score: number): string {
        const scoreLevel = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'needs improvement';
        const style = this.detectStyle(top);
        
        let explanation = `This ${style} outfit scores ${scoreLevel} (${score.toFixed(1)}/10). `;
        
        if (style === 'streetwear') explanation += `Perfect for urban adventures and casual outings. `;
        else if (style === 'formal') explanation += `Ideal for professional settings and special occasions. `;
        else if (style === 'sport') explanation += `Great for athletic activities and active lifestyles. `;
        else if (style === 'casual') explanation += `Perfect for everyday wear and relaxed settings. `;
        else if (style === 'business casual') explanation += `Suitable for modern workplaces and smart casual events. `;
        else if (style === 'minimalist') explanation += `Clean and simple for those who prefer understated elegance. `;
        
        const topColor = top.colors?.[0]?.toLowerCase() || '';
        const bottomColor = bottom.product?.colors?.[0]?.toLowerCase() || '';
        const shoesColor = shoes.product?.colors?.[0]?.toLowerCase() || '';
        
        if (bottom.product && shoes.product) {
            explanation += `The ${topColor} ${top.name} creates a harmonious look with ${bottomColor} ${bottom.product.name} and ${shoesColor} ${shoes.product.name}. `;
        }
        
        if (accessory.product) {
            explanation += `The ${accessory.product.colors?.[0] || 'matching'} ${accessory.product.name} adds the perfect finishing touch. `;
        }
        
        return explanation;
    }
}
