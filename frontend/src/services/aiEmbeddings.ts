import type { Product } from './api';

export interface ProductEmbedding {
    productId: number;
    embedding: number[];
    productData: Product;
    similarity?: number;
    personalizedScore?: number;
}

export interface OutfitFromImage {
    top: Product;
    bottom: Product;
    shoes: Product;
    accessory: Product;
    score: number;
    explanation: string;
}

export interface UserProfile {
    favoriteColors: string[];
    favoriteBrands: string[];
    budgetRange: {
        min: number;
        max: number;
    };
    stylePreferences: string[];
    previousPurchases: number[];
}

export class AIEmbeddingsService {
    private static embeddings: ProductEmbedding[] = [];
    private static userProfile: UserProfile = {
        favoriteColors: [],
        favoriteBrands: [],
        budgetRange: { min: 0, max: 10000 },
        stylePreferences: [],
        previousPurchases: []
    };

    // Generate embedding for a product using text and attributes
    static async generateProductEmbedding(product: Product): Promise<number[]> {
        // Combine product description, attributes, and metadata
        const textToEmbed = [
            product.name,
            product.description || '',
            product.category,
            product.colors?.join(' ') || '',
            product.style || '',
            product.brand,
            `Price: ${product.price}`,
            `Rating: ${product.rating}`,
            product.sizes?.join(' ') || ''
        ].join(' ');

        // Simulate embedding generation (in production, use OpenAI or CLIP)
        const embedding = await this.simulateEmbedding(textToEmbed);
        
        return embedding;
    }

    // Generate embedding from uploaded image
    static async generateImageEmbedding(imageData: string): Promise<number[]> {
        // Simulate image embedding (in production, use CLIP or similar)
        // For now, we'll analyze the image and create a semantic embedding
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                
                // Analyze image features
                const features = this.analyzeImageFeatures(canvas, ctx);
                const embedding = this.simulateEmbedding(features);
                resolve(embedding);
            };
            img.src = imageData;
        });
    }

    // Analyze image features for embedding generation
    private static analyzeImageFeatures(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null): string {
        if (!ctx) return '';

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Color analysis
        const colorCounts: { [key: string]: number } = {};
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a < 50) continue;
            
            // Quantize color
            const quantizedR = Math.floor(r / 51) * 51;
            const quantizedG = Math.floor(g / 51) * 51;
            const quantizedB = Math.floor(b / 51) * 51;
            
            const color = `${quantizedR},${quantizedG},${quantizedB}`;
            colorCounts[color] = (colorCounts[color] || 0) + 1;
            totalPixels++;
        }
        
        // Find dominant colors
        const dominantColors = Object.keys(colorCounts)
            .sort((a, b) => colorCounts[b] - colorCounts[a])
            .slice(0, 3)
            .map(color => this.getColorName(color));
        
        // Aspect ratio for category detection
        const aspectRatio = canvas.width / canvas.height;
        let category = 'unknown';
        
        if (aspectRatio > 0.8) category = 'hoodie jacket';
        else if (aspectRatio < 0.6) category = 'pants';
        else if (aspectRatio >= 0.6 && aspectRatio <= 0.8) category = 'shirt';
        else if (aspectRatio > 1.2) category = 'shoes';
        
        // Brightness for style detection
        const avgBrightness = this.calculateAverageBrightness(data);
        let style = 'casual';
        if (avgBrightness < 100) style = 'streetwear';
        else if (avgBrightness > 180) style = 'formal';
        
        return `${dominantColors.join(' ')} ${category} ${style}`;
    }

    // Get color name from RGB values
    private static getColorName(rgb: string): string {
        const [r, g, b] = rgb.split(',').map(Number);
        const brightness = (r + g + b) / 3;
        
        if (brightness < 100) return 'black';
        if (brightness < 180) return 'gray';
        if (r > g && r > b) return 'brown';
        if (g > b && b > r) return 'blue';
        if (r > 200 && g > 200 && b < 150) return 'yellow';
        if (r > 150 && b > 150 && b > 150) return 'green';
        return 'unknown';
    }

    // Calculate average brightness
    private static calculateAverageBrightness(data: Uint8ClampedArray): number {
        let totalBrightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a < 50) continue;
            
            totalBrightness += (r + g + b) / 3;
            pixelCount++;
        }
        
        return pixelCount > 0 ? totalBrightness / pixelCount : 0;
    }

    // Simulate embedding generation (in production, use real AI service)
    private static async simulateEmbedding(text: string): Promise<number[]> {
        // Create a deterministic but pseudo-random embedding based on text
        const embedding: number[] = [];
        const seed = this.hashString(text);
        
        for (let i = 0; i < 1536; i++) { // OpenAI embedding size
            embedding.push(Math.sin(seed + i) * 0.5 + 0.5);
        }
        
        return embedding;
    }

    // Hash string for deterministic embedding
    private static hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    // Calculate cosine similarity between two embeddings
    static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length) return 0;
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    // Find similar products using vector search
    static findSimilarProducts(queryEmbedding: number[], limit: number = 6): ProductEmbedding[] {
        const similarities = this.embeddings.map(productEmbedding => ({
            ...productEmbedding,
            similarity: this.cosineSimilarity(queryEmbedding, productEmbedding.embedding)
        }));
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    // Generate outfit from image embedding
    static async generateOutfitFromEmbedding(imageEmbedding: number[], allProducts: Product[]): Promise<OutfitFromImage> {
        // Find similar products
        const similarProducts = this.findSimilarProducts(imageEmbedding, 20);
        
        // Classify product types from similar products
        const tops = similarProducts.filter(p => 
            p.productData.category.toLowerCase().includes('shirt') || 
            p.productData.category.toLowerCase().includes('hoodie') ||
            p.productData.category.toLowerCase().includes('jacket')
        );
        
        const bottoms = similarProducts.filter(p => 
            p.productData.category.toLowerCase().includes('pant') || 
            p.productData.category.toLowerCase().includes('jean')
        );
        
        const shoes = similarProducts.filter(p => 
            p.productData.category.toLowerCase().includes('shoe') || 
            p.productData.category.toLowerCase().includes('sneaker')
        );
        
        const accessories = similarProducts.filter(p => 
            p.productData.category.toLowerCase().includes('accessor') || 
            p.productData.category.toLowerCase().includes('watch') ||
            p.productData.category.toLowerCase().includes('belt')
        );
        
        // Select best items considering user preferences
        const selectBestItem = (items: ProductEmbedding[], category: string): Product => {
            if (items.length === 0) {
                // Fallback to any product in category
                const fallback = allProducts.find(p => 
                    p.category.toLowerCase().includes(category)
                );
                return fallback || items[0]?.productData || allProducts[0];
            }
            
            // Sort by user preferences
            const scored = items.map(item => {
                let score = item.similarity;
                
                // Brand preference
                if (this.userProfile.favoriteBrands.includes(item.productData.brand)) {
                    score += 0.2;
                }
                
                // Color preference
                if (item.productData.colors?.some(color => 
                    this.userProfile.favoriteColors.includes(color.toLowerCase())
                )) {
                    score += 0.15;
                }
                
                // Budget preference
                const price = item.productData.price || 0;
                if (price >= this.userProfile.budgetRange.min && price <= this.userProfile.budgetRange.max) {
                    score += 0.1;
                }
                
                // Rating bonus
                if (item.productData.rating >= 4.0) {
                    score += 0.1;
                }
                
                return { ...item, personalizedScore: score };
            });
            
            return scored.sort((a, b) => b.personalizedScore - a.personalizedScore)[0].productData;
        };
        
        const top = selectBestItem(tops, 'shirt');
        const bottom = selectBestItem(bottoms, 'pant');
        const shoesItem = selectBestItem(shoes, 'shoe');
        const accessory = selectBestItem(accessories, 'accessor');
        
        // Calculate outfit score
        const score = this.calculateOutfitScore(top, bottom, shoesItem, accessory);
        
        // Generate explanation
        const explanation = this.generateOutfitExplanation(top, bottom, shoesItem, accessory, score);
        
        return {
            top,
            bottom,
            shoes: shoesItem,
            accessory,
            score,
            explanation
        };
    }

    // Calculate outfit score
    private static calculateOutfitScore(top: Product, bottom: Product, shoes: Product, accessory: Product): number {
        let score = 0;
        
        // Style compatibility (40%)
        const styles = [top.style, bottom.style, shoes.style, accessory.style].filter(Boolean);
        const uniqueStyles = [...new Set(styles)];
        if (uniqueStyles.length <= 2) score += 4;
        else if (uniqueStyles.length <= 3) score += 3;
        else score += 1;
        
        // Color harmony (30%)
        const allColors = [
            ...(top.colors || []),
            ...(bottom.colors || []),
            ...(shoes.colors || []),
            ...(accessory.colors || [])
        ];
        const uniqueColors = [...new Set(allColors)];
        if (uniqueColors.length <= 3) score += 3;
        else if (uniqueColors.length <= 4) score += 2;
        else score += 1;
        
        // Price balance (20%)
        const prices = [top.price, bottom.price, shoes.price, accessory.price].filter(p => p && p > 0);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        if (avgPrice >= 500 && avgPrice <= 3000) score += 2;
        else score += 1;
        
        // Rating quality (10%)
        const avgRating = (top.rating + bottom.rating + shoes.rating + accessory.rating) / 4;
        if (avgRating >= 4.0) score += 1;
        
        return Math.min(score, 10);
    }

    // Generate outfit explanation
    private static generateOutfitExplanation(top: Product, bottom: Product, shoes: Product, accessory: Product, score: number): string {
        const scoreLevel = score >= 8 ? 'excellent' : score >= 6 ? 'great' : score >= 4 ? 'good' : 'fair';
        
        let explanation = `This ${scoreLevel} outfit scores ${score}/10. `;
        
        // Style explanation
        const topStyle = top.style || 'casual';
        explanation += `The ${top.colors?.[0]} ${top.name} creates a ${topStyle} foundation. `;
        
        // Complementary items
        explanation += `It pairs perfectly with ${bottom.colors?.[0]} ${bottom.name} and ${shoes.colors?.[0]} ${shoes.name}. `;
        
        if (accessory.name) {
            explanation += `The ${accessory.colors?.[0]} ${accessory.name} adds the perfect finishing touch. `;
        }
        
        // Personalization note
        if (this.userProfile.favoriteBrands.includes(top.brand)) {
            explanation += `This features your preferred ${top.brand} brand. `;
        }
        
        explanation += `Total outfit price: ₹${((top.price || 0) + (bottom.price || 0) + (shoes.price || 0) + (accessory.price || 0)).toLocaleString('en-IN')}.`;
        
        return explanation;
    }

    // Update user profile
    static updateUserProfile(updates: Partial<UserProfile>): void {
        this.userProfile = { ...this.userProfile, ...updates };
        this.saveUserProfile();
    }

    // Load user profile from localStorage
    static loadUserProfile(): void {
        const saved = localStorage.getItem('samzone_user_profile');
        if (saved) {
            this.userProfile = JSON.parse(saved);
        }
    }

    // Save user profile to localStorage
    static saveUserProfile(): void {
        localStorage.setItem('samzone_user_profile', JSON.stringify(this.userProfile));
    }

    // Initialize embeddings for all products
    static async initializeEmbeddings(products: Product[]): Promise<void> {
        this.embeddings = [];
        
        for (const product of products) {
            const embedding = await this.generateProductEmbedding(product);
            this.embeddings.push({
                productId: product.id,
                embedding,
                productData: product
            });
        }
        
        // Save to localStorage for caching
        localStorage.setItem('samzone_embeddings', JSON.stringify(this.embeddings));
    }

    // Load cached embeddings
    static loadCachedEmbeddings(): void {
        const cached = localStorage.getItem('samzone_embeddings');
        if (cached) {
            this.embeddings = JSON.parse(cached);
        }
    }

    // Get user profile
    static getUserProfile(): UserProfile {
        return this.userProfile;
    }
}
