import { realisticProducts, type Product } from '../data/realisticProducts';

export interface OutfitRecommendation {
    id: string;
    name: string;
    description: string;
    occasion: string;
    season: string;
    style: string;
    products: Product[];
    totalPrice: number;
    reasoning: string[];
    colorHarmony: string;
    styleTips: string[];
    alternatives: Product[];
}

export interface OutfitPreferences {
    occasion?: 'casual' | 'formal' | 'sport' | 'business' | 'party' | 'date';
    season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
    style?: 'casual' | 'formal' | 'sport' | 'streetwear' | 'outdoor' | 'luxury';
    colors?: string[];
    budget?: { min: number; max: number };
    weather?: 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot';
    bodyType?: 'slim' | 'athletic' | 'average' | 'heavy';
    skinTone?: 'light' | 'medium' | 'dark';
}

class OutfitRecommendationEngine {
    private colorTheory = {
        complementary: {
            black: ['white', 'gray', 'silver'],
            white: ['black', 'navy', 'gray'],
            navy: ['white', 'beige', 'gray'],
            gray: ['black', 'white', 'navy'],
            brown: ['beige', 'cream', 'white'],
            beige: ['brown', 'navy', 'olive'],
            olive: ['beige', 'cream', 'brown'],
            red: ['white', 'black', 'gray'],
            blue: ['white', 'beige', 'gray'],
            green: ['white', 'beige', 'brown']
        },
        analogous: {
            black: ['gray', 'navy'],
            white: ['beige', 'cream'],
            navy: ['blue', 'gray'],
            gray: ['black', 'white'],
            brown: ['beige', 'olive'],
            beige: ['cream', 'brown'],
            olive: ['green', 'brown'],
            red: ['orange', 'pink'],
            blue: ['navy', 'light-blue'],
            green: ['olive', 'lime']
        },
        triadic: {
            black: ['white', 'red'],
            white: ['black', 'blue'],
            navy: ['white', 'orange'],
            gray: ['black', 'yellow'],
            brown: ['beige', 'green'],
            beige: ['brown', 'blue'],
            olive: ['beige', 'purple'],
            red: ['white', 'blue'],
            blue: ['white', 'red'],
            green: ['beige', 'orange']
        }
    };

    private occasionRules = {
        casual: {
            allowedStyles: ['casual', 'streetwear', 'outdoor'],
            preferredCategories: ['shirts', 'pants', 'shoes'],
            avoidStyles: ['formal', 'luxury'],
            colorPalette: ['versatile', 'earthy', 'neutral']
        },
        formal: {
            allowedStyles: ['formal', 'luxury'],
            preferredCategories: ['shirts', 'pants', 'shoes', 'accessories'],
            avoidStyles: ['sport', 'streetwear'],
            colorPalette: ['classic', 'neutral', 'sophisticated']
        },
        sport: {
            allowedStyles: ['sport', 'casual'],
            preferredCategories: ['shirts', 'pants', 'shoes'],
            avoidStyles: ['formal', 'luxury'],
            colorPalette: ['energetic', 'bright', 'functional']
        },
        business: {
            allowedStyles: ['formal', 'casual'],
            preferredCategories: ['shirts', 'pants', 'shoes', 'accessories'],
            avoidStyles: ['sport', 'streetwear'],
            colorPalette: ['professional', 'neutral', 'conservative']
        },
        party: {
            allowedStyles: ['luxury', 'casual', 'streetwear'],
            preferredCategories: ['shirts', 'pants', 'shoes', 'accessories'],
            avoidStyles: ['sport', 'outdoor'],
            colorPalette: ['bold', 'stylish', 'eye-catching']
        },
        date: {
            allowedStyles: ['casual', 'luxury', 'formal'],
            preferredCategories: ['shirts', 'pants', 'shoes', 'accessories'],
            avoidStyles: ['sport', 'outdoor'],
            colorPalette: ['romantic', 'elegant', 'sophisticated']
        }
    };

    // Generate outfit recommendation based on preferences
    generateOutfit(preferences: OutfitPreferences): OutfitRecommendation {
        const outfitId = `outfit_${Date.now()}`;
        const occasion = preferences.occasion || 'casual';
        const season = preferences.season || 'all-season';
        const style = preferences.style || 'casual';

        // Get filtered products based on preferences
        const filteredProducts = this.filterProductsByPreferences(preferences);
        
        // Generate outfit components
        const outfitProducts = this.selectOutfitComponents(filteredProducts, preferences);
        
        // Calculate reasoning
        const reasoning = this.generateReasoning(outfitProducts, preferences);
        
        // Generate color harmony explanation
        const colorHarmony = this.analyzeColorHarmony(outfitProducts);
        
        // Generate style tips
        const styleTips = this.generateStyleTips(outfitProducts, preferences);
        
        // Find alternatives
        const alternatives = this.findAlternatives(outfitProducts, preferences);

        return {
            id: outfitId,
            name: this.generateOutfitName(occasion, style),
            description: this.generateOutfitDescription(occasion, style),
            occasion,
            season,
            style,
            products: outfitProducts,
            totalPrice: outfitProducts.reduce((sum, product) => sum + product.price, 0),
            reasoning,
            colorHarmony,
            styleTips,
            alternatives
        };
    }

    // Filter products based on preferences
    private filterProductsByPreferences(preferences: OutfitPreferences): Product[] {
        let filtered = [...realisticProducts];

        // Filter by occasion
        if (preferences.occasion) {
            const occasionRule = this.occasionRules[preferences.occasion];
            filtered = filtered.filter(product => 
                occasionRule.allowedStyles.includes(product.style) &&
                !occasionRule.avoidStyles.includes(product.style)
            );
        }

        // Filter by style
        if (preferences.style) {
            filtered = filtered.filter(product => product.style === preferences.style);
        }

        // Filter by colors
        if (preferences.colors && preferences.colors.length > 0) {
            filtered = filtered.filter(product =>
                product.colors.some(color => 
                    preferences.colors!.some(prefColor =>
                        color.toLowerCase().includes(prefColor.toLowerCase())
                    )
                )
            );
        }

        // Filter by budget
        if (preferences.budget) {
            filtered = filtered.filter(product =>
                product.price >= preferences.budget!.min &&
                product.price <= preferences.budget!.max
            );
        }

        // Filter by season
        if (preferences.season && preferences.season !== 'all-season') {
            filtered = filtered.filter(product =>
                product.season && product.season.includes(preferences.season!)
            );
        }

        // Filter by stock
        filtered = filtered.filter(product => product.inStock);

        return filtered.sort((a, b) => b.rating - a.rating);
    }

    // Select outfit components
    private selectOutfitComponents(products: Product[], preferences: OutfitPreferences): Product[] {
        const outfit: Product[] = [];
        const requiredCategories = ['shirts', 'pants', 'shoes'];
        const optionalCategories = ['accessories', 'watches', 'gadgets'];

        // Select required components
        requiredCategories.forEach(category => {
            const categoryProducts = products.filter(p => p.category === category);
            if (categoryProducts.length > 0) {
                // Select top-rated product or based on preferences
                const selected = this.selectBestProduct(categoryProducts, preferences);
                if (selected) outfit.push(selected);
            }
        });

        // Select optional components (1-2 items)
        const availableOptional = optionalCategories.filter(cat => 
            products.some(p => p.category === cat)
        );
        
        if (availableOptional.length > 0) {
            const numOptional = Math.min(2, availableOptional.length);
            for (let i = 0; i < numOptional; i++) {
                const category = availableOptional[i];
                const categoryProducts = products.filter(p => p.category === category);
                const selected = this.selectBestProduct(categoryProducts, preferences);
                if (selected) outfit.push(selected);
            }
        }

        return outfit;
    }

    // Select best product from category based on preferences
    private selectBestProduct(products: Product[], preferences: OutfitPreferences): Product | null {
        if (products.length === 0) return null;
        if (products.length === 1) return products[0];

        // Score products based on multiple factors
        const scoredProducts = products.map(product => {
            let score = product.rating * 20; // Base score from rating

            // Price preference (prefer mid-range)
            if (preferences.budget) {
                const budgetMid = (preferences.budget.min + preferences.budget.max) / 2;
                const priceDiff = Math.abs(product.price - budgetMid);
                score -= priceDiff / 100;
            }

            // Color preference
            if (preferences.colors && preferences.colors.length > 0) {
                const hasPreferredColor = product.colors.some(color =>
                    preferences.colors!.some(prefColor =>
                        color.toLowerCase().includes(prefColor.toLowerCase())
                    )
                );
                if (hasPreferredColor) score += 10;
            }

            // Discount bonus
            if (product.discount && product.discount > 0) {
                score += product.discount;
            }

            return { product, score };
        });

        // Return highest scored product
        scoredProducts.sort((a, b) => b.score - a.score);
        return scoredProducts[0].product;
    }

    // Generate reasoning for the outfit
    private generateReasoning(products: Product[], preferences: OutfitPreferences): string[] {
        const reasoning: string[] = [];

        // Occasion-based reasoning
        if (preferences.occasion) {
            reasoning.push(`This outfit is perfect for ${preferences.occasion} occasions with its balanced style and appropriateness.`);
        }

        // Style reasoning
        const styles = [...new Set(products.map(p => p.style))];
        if (styles.length === 1) {
            reasoning.push(`All pieces follow a consistent ${styles[0]} style for a cohesive look.`);
        } else {
            reasoning.push(`The outfit combines ${styles.join(' and ')} elements for versatility.`);
        }

        // Color harmony reasoning
        const allColors = products.flatMap(p => p.colors);
        const uniqueColors = [...new Set(allColors)];
        if (uniqueColors.length <= 3) {
            reasoning.push(`The color palette uses ${uniqueColors.join(', ')} creating a harmonious and balanced look.`);
        }

        // Price value reasoning
        const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
        reasoning.push(`At ₹${totalPrice.toLocaleString('en-IN')}, this outfit offers excellent value for quality pieces.`);

        // Versatility reasoning
        reasoning.push(`Each piece can be mixed and matched with other items in your wardrobe for maximum versatility.`);

        return reasoning;
    }

    // Analyze color harmony
    private analyzeColorHarmony(products: Product[]): string {
        const allColors = products.flatMap(p => p.colors);
        const uniqueColors = [...new Set(allColors)];

        if (uniqueColors.length === 1) {
            return `Monochromatic scheme using ${uniqueColors[0]} for a sleek, unified look.`;
        }

        if (uniqueColors.length === 2) {
            const [color1, color2] = uniqueColors;
            if (this.colorTheory.complementary[color1 as keyof typeof this.colorTheory.complementary]?.includes(color2)) {
                return `Complementary colors ${color1} and ${color2} create visual interest and balance.`;
            }
            return `Two-tone scheme with ${color1} and ${color2} for simple elegance.`;
        }

        return `Multi-color palette with ${uniqueColors.join(', ')} for a dynamic, expressive look.`;
    }

    // Generate style tips
    private generateStyleTips(products: Product[], preferences: OutfitPreferences): string[] {
        const tips: string[] = [];

        // Fit tips
        const shirt = products.find(p => p.category === 'shirts');
        if (shirt) {
            tips.push(`The ${shirt.name} should fit comfortably - not too tight or too loose.`);
        }

        // Color coordination tips
        const colors = products.flatMap(p => p.colors);
        if (colors.includes('white')) {
            tips.push(`White pieces brighten the outfit and work well with any skin tone.`);
        }

        // Accessory tips
        const accessories = products.filter(p => p.category === 'accessories');
        if (accessories.length > 0) {
            tips.push(`Keep accessories minimal to let the main pieces shine.`);
        } else {
            tips.push(`Consider adding a watch or simple accessory to complete the look.`);
        }

        // Occasion-specific tips
        if (preferences.occasion === 'formal') {
            tips.push(`Ensure shoes are polished and clothes are wrinkle-free for the best impression.`);
        } else if (preferences.occasion === 'casual') {
            tips.push(`Feel free to roll up sleeves or add personal touches for a relaxed vibe.`);
        }

        return tips;
    }

    // Find alternative products
    private findAlternatives(outfit: Product[], _preferences: OutfitPreferences): Product[] {
        const alternatives: Product[] = [];
        
        outfit.forEach(product => {
            const similarProducts = realisticProducts.filter(p =>
                p.category === product.category &&
                p.style === product.style &&
                p.id !== product.id &&
                p.inStock
            );
            
            if (similarProducts.length > 0) {
                alternatives.push(similarProducts[0]);
            }
        });

        return alternatives.slice(0, 3);
    }

    // Generate outfit name
    private generateOutfitName(occasion: string, style: string): string {
        const names: Record<string, Record<string, string>> = {
            casual: {
                casual: 'Everyday Comfort',
                streetwear: 'Urban Street Style',
                outdoor: 'Adventure Ready',
                sport: 'Active Lifestyle'
            },
            formal: {
                formal: 'Business Professional',
                luxury: 'Executive Excellence'
            },
            sport: {
                sport: 'Athletic Performance',
                casual: 'Sporty Casual'
            },
            business: {
                formal: 'Corporate Sharp',
                casual: 'Business Casual'
            },
            party: {
                luxury: 'Night Out Glamour',
                casual: 'Party Ready',
                streetwear: 'Street Party Style'
            },
            date: {
                formal: 'Romantic Evening',
                casual: 'Casual Date',
                luxury: 'Elegant Night'
            }
        };

        return names[occasion]?.[style] || 'Stylish Ensemble';
    }

    // Generate outfit description
    private generateOutfitDescription(occasion: string, _style: string): string {
        const descriptions = {
            casual: 'A relaxed yet stylish outfit perfect for everyday activities and casual gatherings.',
            formal: 'A sophisticated and polished ensemble ideal for professional settings and formal events.',
            sport: 'An athletic and comfortable outfit designed for active lifestyles and sports activities.',
            business: 'A professional and refined look suitable for office environments and business meetings.',
            party: 'A trendy and eye-catching ensemble perfect for social events and celebrations.',
            date: 'A charming and stylish outfit ideal for romantic occasions and special dates.'
        };

        return descriptions[occasion as keyof typeof descriptions] || 'A versatile and fashionable outfit for any occasion.';
    }

    // Get multiple outfit recommendations
    getMultipleRecommendations(preferences: OutfitPreferences, count: number = 3): OutfitRecommendation[] {
        const recommendations: OutfitRecommendation[] = [];
        
        for (let i = 0; i < count; i++) {
            // Vary preferences slightly for variety
            const variedPreferences = { ...preferences };
            
            if (i === 1) {
                // Second recommendation: different style
                const styles: OutfitPreferences['style'][] = ['casual', 'formal', 'sport', 'streetwear'];
                const currentIndex = styles.indexOf(preferences.style || 'casual');
                variedPreferences.style = styles[(currentIndex + 1) % styles.length];
            } else if (i === 2) {
                // Third recommendation: different color focus
                const colors = ['black', 'white', 'navy', 'gray', 'brown'];
                variedPreferences.colors = [colors[i % colors.length]];
            }
            
            const recommendation = this.generateOutfit(variedPreferences);
            recommendations.push(recommendation);
        }
        
        return recommendations;
    }

    // Get outfit suggestions based on a single product
    getOutfitForProduct(product: Product, preferences?: Partial<OutfitPreferences>): OutfitRecommendation {
        const basePreferences: OutfitPreferences = {
            occasion: 'casual',
            season: 'all-season',
            style: product.style,
            colors: product.colors.slice(0, 2),
            budget: { min: 0, max: product.price * 4 }
        };

        const mergedPreferences = { ...basePreferences, ...preferences };
        
        // Generate outfit and ensure the original product is included
        const recommendation = this.generateOutfit(mergedPreferences);
        
        if (!recommendation.products.find(p => p.id === product.id)) {
            // Replace a similar category product with the original
            const sameCategoryIndex = recommendation.products.findIndex(p => p.category === product.category);
            if (sameCategoryIndex >= 0) {
                recommendation.products[sameCategoryIndex] = product;
            } else {
                recommendation.products.unshift(product);
            }
            
            // Recalculate total price
            recommendation.totalPrice = recommendation.products.reduce((sum, p) => sum + p.price, 0);
        }

        return recommendation;
    }
}

export const outfitEngine = new OutfitRecommendationEngine();
