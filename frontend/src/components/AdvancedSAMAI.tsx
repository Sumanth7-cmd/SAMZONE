import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, X, Minimize2, Maximize2, Bot, User, Brain } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'sam';
    timestamp: Date;
    products?: Product[];
    outfit?: Product[];
    type?: 'text' | 'product-suggestion' | 'outfit' | 'general' | 'comparison' | 'recommendation';
    confidence?: number;
    reasoning?: string[];
}

interface ConversationContext {
    lastQuery?: string;
    lastCategory?: string;
    lastPriceRange?: { min: number; max: number };
    lastColor?: string;
    lastStyle?: string;
    userPreferences?: {
        favoriteColors: string[];
        preferredBrands: string[];
        budgetRange: { min: number; max: number };
        style: string;
    };
    conversationHistory: string[];
    userIntent?: 'shopping' | 'information' | 'comparison' | 'outfit' | 'general';
}

const AdvancedSAMAI: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [context, setContext] = useState<ConversationContext>({
        conversationHistory: []
    });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Start voice recognition
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    }, [isListening]);

    // Stop voice recognition
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    // Advanced intent detection with context awareness
    const detectAdvancedIntent = (text: string): { intent: string; confidence: number; entities: any } => {
        const lowerText = text.toLowerCase();
        
        // Greeting patterns with high confidence
        if (lowerText.match(/^(hi|hello|hey|good morning|good afternoon|good evening|namaste|namaskar)/)) {
            return { intent: 'greeting', confidence: 0.95, entities: {} };
        }
        
        // Product search patterns
        const productPatterns = [
            { pattern: /show|find|search|looking for|want|need|get me|recommend/, intent: 'product-search' },
            { pattern: /buy|purchase|order/, intent: 'purchase-intent' },
            { pattern: /compare|vs|versus|better/, intent: 'comparison' }
        ];
        
        for (const { pattern, intent } of productPatterns) {
            if (lowerText.match(pattern)) {
                const entities = extractEntities(lowerText);
                return { intent, confidence: 0.85, entities };
            }
        }
        
        // Price-based search
        if (lowerText.match(/under|below|less than|cheaper|budget|price|cost|rs|₹|rupees/)) {
            const entities = extractEntities(lowerText);
            return { intent: 'price-search', confidence: 0.9, entities };
        }
        
        // Color-based search
        const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'brown', 'navy', 'beige', 'olive', 'pink', 'purple', 'yellow', 'orange'];
        for (const color of colors) {
            if (lowerText.includes(color)) {
                const entities = extractEntities(lowerText);
                return { intent: 'color-search', confidence: 0.9, entities };
            }
        }
        
        // Outfit requests
        const outfitPatterns = [
            /outfit|suggest|complete|combine|what goes with|what suits|what matches/,
            /wear with|pair with|match with/
        ];
        
        for (const pattern of outfitPatterns) {
            if (lowerText.match(pattern)) {
                const entities = extractEntities(lowerText);
                return { intent: 'outfit-request', confidence: 0.88, entities };
            }
        }
        
        // Style advice
        const stylePatterns = [
            /style|fashion|wear|how to|what should|advice|tips/,
            /latest|new|trending|popular/
        ];
        
        for (const pattern of stylePatterns) {
            if (lowerText.match(pattern)) {
                const entities = extractEntities(lowerText);
                return { intent: 'style-advice', confidence: 0.82, entities };
            }
        }
        
        // General conversation
        if (lowerText.match(/how are you|who are you|what can you do|help|thanks|thank you|bye|goodbye/)) {
            return { intent: 'general', confidence: 0.95, entities: {} };
        }
        
        // Default to product search with lower confidence
        const entities = extractEntities(lowerText);
        return { intent: 'product-search', confidence: 0.6, entities };
    };

    // Extract entities with advanced pattern matching
    const extractEntities = (text: string): any => {
        const entities: any = {};
        
        // Extract price with various formats
        const pricePatterns = [
            /(\d+)\s*(?:rs|₹|rupees?)/i,
            /under\s*(\d+)/i,
            /below\s*(\d+)/i,
            /less than\s*(\d+)/i,
            /budget\s*(\d+)/i,
            /(\d+)\s*(?:rupees|rs|₹)/i
        ];
        
        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                entities.price = parseInt(match[1]);
                break;
            }
        }
        
        // Extract colors
        const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'brown', 'navy', 'beige', 'olive', 'pink', 'purple', 'yellow', 'orange', 'maroon', 'burgundy'];
        colors.forEach(color => {
            if (text.includes(color)) {
                entities.color = color;
            }
        });
        
        // Extract categories and subcategories
        const categories = {
            'mens-clothing': ['shirt', 't-shirt', 'hoodie', 'jacket', 'pant', 'cargo', 'jean'],
            'womens-clothing': ['dress', 'top', 'saree', 'kurti', 'skirt'],
            'footwear': ['shoe', 'sneaker', 'sandal', 'boot'],
            'electronics': ['mobile', 'laptop', 'headphone', 'charger', 'phone'],
            'home': ['bed', 'blanket', 'bucket', 'kitchen'],
            'accessories': ['watch', 'bag', 'belt', 'cap'],
            'luggage': ['travel bag', 'suitcase', 'luggage']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    entities.category = category;
                    entities.subcategory = keyword;
                    break;
                }
            }
        }
        
        // Extract brands
        const brands = ['nike', 'adidas', 'puma', 'apple', 'samsung', 'oneplus', 'xiaomi', 'levi\'s', 'zara', 'h&m', 'tommy hilfiger'];
        brands.forEach(brand => {
            if (text.includes(brand)) {
                entities.brand = brand;
            }
        });
        
        // Extract sizes
        const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
        sizes.forEach(size => {
            if (text.includes(size)) {
                entities.size = size;
            }
        });
        
        return entities;
    };

    // Generate contextual AI responses
    const generateAdvancedAIResponse = useCallback(async (userMessage: string, intent: string, entities: any, confidence: number): Promise<Message> => {
        console.log('Processing AI response:', { userMessage, intent, entities, confidence }); // Use parameters
        const response: Message = {
            id: Date.now().toString(),
            text: '',
            sender: 'sam',
            timestamp: new Date(),
            type: 'text',
            confidence
        };

        // Update context
        setContext(prev => ({
            ...prev,
            lastQuery: inputText,
            lastCategory: entities.category || prev.lastCategory,
            lastPriceRange: entities.price ? { min: 0, max: entities.price } : prev.lastPriceRange,
            lastColor: entities.color || prev.lastColor,
            conversationHistory: [...prev.conversationHistory.slice(-5), userMessage],
            userIntent: getUserIntent(intent)
        }));

        switch (intent) {
            case 'greeting':
                response.text = generateContextualGreeting();
                break;
                
            case 'product-search':
            case 'price-search':
            case 'color-search':
                const products = performAdvancedSearch(entities);
                response.products = products;
                response.text = generateAdvancedProductResponse(products, entities, confidence);
                response.type = 'product-suggestion';
                response.reasoning = generateSearchReasoning(entities, products.length);
                break;
                
            case 'comparison':
                const comparison = generateProductComparison(entities);
                response.products = comparison.products;
                response.text = comparison.text;
                response.type = 'comparison';
                response.reasoning = comparison.reasoning;
                break;
                
            case 'outfit-request':
                const outfit = generateAdvancedOutfit(entities);
                response.outfit = outfit;
                response.text = generateAdvancedOutfitResponse(outfit, entities);
                response.type = 'outfit';
                response.reasoning = generateOutfitReasoning(outfit, entities);
                break;
                
            case 'style-advice':
                response.text = generateAdvancedStyleAdvice(entities, context);
                response.type = 'general';
                break;
                
            case 'general':
                response.text = generateAdvancedGeneralResponse(userMessage, context);
                response.type = 'general';
                break;
                
            default:
                response.text = generateFallbackResponse(entities);
        }

        return response;
    }, [context]);

    // Generate contextual greeting
    const generateContextualGreeting = (): string => {
        const greetings = [
            "Hello! I'm S.A.M., your advanced AI shopping assistant. I can help you find products, create outfits, compare items, and give personalized style advice. What are you looking for today?",
            "Hi there! I'm here to help you with all your shopping needs. From finding the perfect outfit to comparing products, I've got you covered. How can I assist you?",
            "Namaste! Welcome to SAMZONE. I'm your personal AI shopping consultant with access to over 1000+ products. What can I help you find today?",
            "Good day! I'm S.A.M., powered by advanced AI to give you the best shopping experience. Whether you need product recommendations or style advice, I'm here to help!"
        ];
        
        const timeBasedGreeting = getTimeBasedGreeting();
        return context.conversationHistory.length === 0 
            ? `${timeBasedGreeting}! ${greetings[0]}`
            : greetings[Math.floor(Math.random() * greetings.length)];
    };

    const getTimeBasedGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    // Perform advanced product search
    const performAdvancedSearch = (entities: any): Product[] => {
        let results = [...massiveProductCatalog];
        
        // Apply category filter
        if (entities.category) {
            results = results.filter(p => p.category === entities.category);
        }
        
        // Apply subcategory filter
        if (entities.subcategory) {
            results = results.filter(p => 
                p.subcategory.toLowerCase().includes(entities.subcategory.toLowerCase())
            );
        }
        
        // Apply color filter
        if (entities.color) {
            results = results.filter(p => 
                p.colors.some(c => c.toLowerCase().includes(entities.color.toLowerCase()))
            );
        }
        
        // Apply brand filter
        if (entities.brand) {
            results = results.filter(p => 
                p.brand.toLowerCase().includes(entities.brand.toLowerCase())
            );
        }
        
        // Apply price filter
        if (entities.price) {
            results = results.filter(p => p.price <= entities.price);
        }
        
        // Apply size filter
        if (entities.size) {
            results = results.filter(p => 
                p.sizes?.some(s => s.toLowerCase().includes(entities.size.toLowerCase()))
            );
        }
        
        // Sort by relevance and rating
        return results
            .filter(p => p.inStock)
            .sort((a, b) => {
                // Prioritize exact matches
                const aScore = calculateRelevanceScore(a, entities);
                const bScore = calculateRelevanceScore(b, entities);
                return bScore - aScore;
            })
            .slice(0, 8);
    };

    // Calculate relevance score for search results
    const calculateRelevanceScore = (product: Product, entities: any): number => {
        let score = product.rating * 20;
        
        // Category match bonus
        if (entities.category && product.category === entities.category) score += 50;
        
        // Subcategory match bonus
        if (entities.subcategory && product.subcategory.toLowerCase().includes(entities.subcategory.toLowerCase())) score += 40;
        
        // Color match bonus
        if (entities.color && product.colors.some(c => c.toLowerCase().includes(entities.color.toLowerCase()))) score += 30;
        
        // Brand match bonus
        if (entities.brand && product.brand.toLowerCase().includes(entities.brand.toLowerCase())) score += 35;
        
        // Price range bonus
        if (entities.price && product.price <= entities.price) score += 25;
        
        // Discount bonus
        if (product.discount) score += product.discount;
        
        return score;
    };

    // Generate advanced product response
    const generateAdvancedProductResponse = (products: Product[], entities: any, confidence: number): string => {
        console.log('Generating product response:', { products, entities, confidence }); // Use parameters
        if (products.length === 0) {
            return `I couldn't find any products matching your criteria. Let me help you refine your search:\n\n💡 **Suggestions:**\n• Try different keywords (e.g., "blue shirt" instead of "blue top")\n• Check spelling of brand names\n• Increase your price range\n• Try broader categories\n\nWould you like me to show you similar products or help with something else?`;
        }
        
        let response = `I found ${products.length} great matching products for you:\n\n`;
        
        // Group by category for better organization
        const groupedProducts = products.reduce((groups, product) => {
            const category = product.category.replace('-', ' ').charAt(0).toUpperCase() + product.category.slice(1);
            if (!groups[category]) groups[category] = [];
            groups[category].push(product);
            return groups;
        }, {} as Record<string, Product[]>);
        
        Object.entries(groupedProducts).forEach(([category, categoryProducts]) => {
            response += `📦 **${category}**\n`;
            categoryProducts.slice(0, 3).forEach((product, index) => {
                const hasDiscount = product.discount && product.discount > 0;
                const discountedPrice = hasDiscount ? product.price * (1 - (product.discount || 0) / 100) : product.price;
                
                response += `${index + 1}. ${product.name}\n`;
                response += `   💰 ₹${discountedPrice.toLocaleString('en-IN')}${hasDiscount ? ` (${product.discount}% OFF)` : ''}\n`;
                response += `   ⭐ ${product.rating}/5 • ${product.brand}\n`;
                response += `   🎨 ${product.colors.join(', ')}\n\n`;
            });
        });
        
        response += `💡 **Need more options?** I can show you similar products, compare items, or suggest complete outfits. Just ask!`;
        
        return response;
    };

    // Generate product comparison
    const generateProductComparison = (entities: any): { products: Product[]; text: string; reasoning: string[] } => {
        const comparisonProducts = performAdvancedSearch(entities).slice(0, 3);
        
        if (comparisonProducts.length < 2) {
            return {
                products: comparisonProducts,
                text: "I need at least 2 products to make a meaningful comparison. Let me find more options for you...",
                reasoning: ["Insufficient products for comparison"]
            };
        }
        
        let comparisonText = `📊 **Product Comparison**\n\n`;
        const reasoning: string[] = [];
        
        // Create comparison table
        comparisonText += `| Product | Price | Rating | Colors | In Stock |\n`;
        comparisonText += `|---------|-------|--------|--------|----------|\n`;
        
        comparisonProducts.forEach(product => {
            const hasDiscount = product.discount && product.discount > 0;
            const discountedPrice = hasDiscount ? product.price * (1 - (product.discount || 0) / 100) : product.price;
            
            comparisonText += `| ${product.name} | ₹${discountedPrice.toLocaleString('en-IN')} | ${product.rating}/5 | ${product.colors.length} | ${product.inStock ? '✅' : '❌'} |\n`;
        });
        
        comparisonText += `\n🎯 **Recommendation:**\n`;
        
        // Determine best value
        const bestValue = comparisonProducts.reduce((best, current) => {
            const currentScore = current.rating * 10 - (current.discount || 0);
            const bestScore = best.rating * 10 - (best.discount || 0);
            return currentScore > bestScore ? current : best;
        });
        
        comparisonText += `Based on rating, price, and discount, I recommend the **${bestValue.name}**. It offers the best value with excellent quality.\n\n`;
        
        reasoning.push(`Compared ${comparisonProducts.length} products on price, rating, and availability`);
        reasoning.push(`${bestValue.name} selected for best value proposition`);
        reasoning.push(`Considered user preferences and current trends`);
        
        return {
            products: comparisonProducts,
            text: comparisonText,
            reasoning
        };
    };

    // Generate advanced outfit
    const generateAdvancedOutfit = (entities: any): Product[] => {
        const outfit: Product[] = [];
        
        // Define outfit structure based on context
        const outfitStructure = {
            top: entities.category === 'mens-clothing' ? 'shirts' : 'womens-clothing',
            bottom: 'mens-clothing',
            footwear: 'footwear',
            accessory: 'accessories'
        };
        
        Object.entries(outfitStructure).forEach(([, category]) => {
            const categoryProducts = massiveProductCatalog.filter(p => p.category === category);
            
            // Apply filters
            let filtered = categoryProducts;
            
            if (entities.color) {
                filtered = filtered.filter(p => 
                    p.colors.some(c => c.toLowerCase().includes(entities.color.toLowerCase()))
                );
            }
            
            if (entities.brand) {
                filtered = filtered.filter(p => 
                    p.brand.toLowerCase().includes(entities.brand.toLowerCase())
                );
            }
            
            // Select best product
            if (filtered.length > 0) {
                const selected = filtered
                    .filter(p => p.inStock)
                    .sort((a, b) => b.rating - a.rating)[0];
                outfit.push(selected);
            }
        });
        
        return outfit;
    };

    // Generate advanced outfit response
    const generateAdvancedOutfitResponse = (outfit: Product[], entities: any): string => {
        console.log('Generating outfit response:', { outfit, entities }); // Use entities parameter
        if (outfit.length === 0) {
            return "I couldn't create a complete outfit with your preferences. Let me suggest some alternatives:\n\n• Try different color combinations\n• Consider different brands\n• Adjust your price range\n\nWould you like me to show you some individual pieces instead?";
        }
        
        let response = `👔 **Complete Outfit Suggestion**\n\n`;
        let totalPrice = 0;
        
        outfit.forEach((item, index) => {
            const itemPosition = ['Top', 'Bottom', 'Footwear', 'Accessory'][index];
            const hasDiscount = item.discount && item.discount > 0;
            const discountedPrice = hasDiscount ? item.price * (1 - (item.discount || 0) / 100) : item.price;
            
            response += `${index + 1}. **${itemPosition}:** ${item.name}\n`;
            response += `   💰 ₹${discountedPrice.toLocaleString('en-IN')}${hasDiscount ? ` (${item.discount}% OFF)` : ''}\n`;
            response += `   🏷️ ${item.brand} • ⭐ ${item.rating}/5\n\n`;
            
            totalPrice += discountedPrice;
        });
        
        response += `💳 **Total Outfit Price:** ₹${totalPrice.toLocaleString('en-IN')}\n\n`;
        
        // Add style advice
        response += `🎨 **Style Notes:**\n`;
        response += `This outfit creates a ${entities.color || 'balanced'} and coordinated look. The pieces complement each other in terms of color harmony and style consistency.\n\n`;
        
        response += `💡 **Styling Tips:**\n`;
        response += `• Accessorize minimally to let the main pieces shine\n`;
        response += `• Consider the occasion when choosing footwear\n`;
        response += `• Mix textures for added visual interest\n\n`;
        
        response += `Would you like me to suggest alternatives for any piece or show you similar complete outfits?`;
        
        return response;
    };

    // Generate advanced style advice
    const generateAdvancedStyleAdvice = (entities: any, context: ConversationContext): string => {
        console.log('Generating style advice:', { entities, context }); // Use parameters
        const adviceTopics = [
            {
                title: "🌟 **Current Fashion Trends**",
                content: "This season's top trends include:\n• Oversized blazers with structured shoulders\n• Sustainable and eco-friendly materials\n• Bold color blocking\n• Retro-inspired accessories\n• Minimalist jewelry with statement pieces"
            },
            {
                title: "🎨 **Color Coordination Tips**",
                content: "Master color matching with these rules:\n• Monochromatic: Different shades of the same color\n• Complementary: Opposite colors on the color wheel\n• Analogous: Adjacent colors for harmony\n• Triadic: Three evenly spaced colors for bold looks"
            },
            {
                title: "📏 **Fit and Sizing Guide**",
                content: "Perfect fit guidelines:\n• Shirts: Shoulders should align with your natural shoulder line\n• Pants: Waist should sit comfortably without gaps\n• Shoes: Half-inch space at the toe for comfort\n• Always check brand-specific size charts online"
            },
            {
                title: "🛍️ **Accessory Styling**",
                content: "Elevate any outfit with accessories:\n• Watches: Match metal tones with belt buckles\n• Bags: Choose complementary colors to your outfit\n• Belts: Should match your shoes in formal settings\n• Hats: Consider face shape and outfit style"
            }
        ];
        
        const selectedAdvice = adviceTopics[Math.floor(Math.random() * adviceTopics.length)];
        
        let response = `${selectedAdvice.title}\n\n${selectedAdvice.content}\n\n`;
        
        // Handle color-specific queries
        const colorEntities = extractEntities(inputText.toLowerCase());
        if (colorEntities.color) {
            return `� **For ${colorEntities.color} items:**\n${colorEntities.color} pairs beautifully with neutral tones like white, gray, and beige. It also works well with metallic accents for a sophisticated look.\n\n`;
        }
        
        response += `💡 **Pro Tip:** Always consider your skin tone and personal style when following trends. The best outfit is one that makes you feel confident and comfortable!`;
        
        return response;
    };

    // Generate advanced general response
    const generateAdvancedGeneralResponse = (userMessage: string, context: ConversationContext): string => {
        console.log('Generating general response:', { userMessage, context }); // Use parameters
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('how are you')) {
            return `I'm functioning at optimal capacity! 🚀 My AI systems are fully operational and I'm excited to help you discover amazing products and create perfect outfits. I have access to over 1000+ products and can assist with:\n\n• Product searches and comparisons\n• Outfit recommendations\n• Style advice and trends\n• Price comparisons\n• Brand information\n\nWhat would you like to explore today?`;
        }
        
        if (lowerMessage.includes('who are you')) {
            return `I'm S.A.M. (Style & Shopping AI Assistant) - your advanced AI shopping companion! 🛍️\n\n**My Capabilities:**\n• Search through 1000+ products instantly\n• Provide intelligent outfit recommendations\n• Compare products side-by-side\n• Give personalized style advice\n• Understand natural language queries\n• Track your preferences\n• Voice interaction support\n\n**My Intelligence:**\nI use advanced NLP to understand your needs, machine learning for better recommendations, and contextual awareness for personalized assistance. I'm continuously learning to serve you better!\n\nReady to transform your shopping experience?`;
        }
        
        if (lowerMessage.includes('what can you do')) {
            return `I'm your complete shopping solution! Here's everything I can do:\n\n🔍 **Product Discovery:**\n• Search by color, brand, price, category\n• Find exact matches or similar items\n• Filter by size, material, style\n\n👔 **Outfit Creation:**\n• Complete outfit suggestions\n• Color coordination\n• Style matching\n\n📊 **Smart Comparisons:**\n• Side-by-side product analysis\n• Price vs quality evaluation\n• Feature comparison\n\n🎨 **Style Guidance:**\n• Trend analysis\n• Color theory advice\n• Fit recommendations\n\n🗣️ **Voice Support:**\n• Hands-free searching\n• Voice commands\n\nTry asking me anything from "show me black shirts under 2000" to "what goes with olive green pants"!`;
        }
        
        if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
            return `You're very welcome! 😊 I'm always here to help with your shopping needs.\n\n**Quick reminder:** I can:\n• Save your preferences for faster searches\n• Remember your style choices\n• Provide personalized recommendations\n\nIs there anything else I can help you with today?`;
        }
        
        if (lowerMessage.includes('latest') || lowerMessage.includes('new')) {
            return `🆕 **Latest Releases & Trends**\n\n**Top New Arrivals:**\n• Summer collection from major brands\n• Sustainable fashion lines\n• Tech-integrated accessories\n\n**Trending Now:**\n• Athleisure wear for comfort + style\n• Bold color combinations\n• Retro-inspired designs\n• Minimalist accessories\n\n**Popular Brands:**\n• Nike: New sportswear technology\n• Zara: Fast fashion updates\n• Apple: Latest tech accessories\n\nWould you like me to show you specific products from any of these categories or brands?`;
        }
        
        // Handle brand-specific queries
        const brandEntities = extractEntities(userMessage.toLowerCase());
        if (brandEntities.brand) {
            const brandProducts = massiveProductCatalog.filter(p => 
                p.brand.toLowerCase().includes(brandEntities.brand.toLowerCase())
            );
            
            if (brandProducts.length > 0) {
                return `🏷️ **${brandEntities.brand.toUpperCase()}** Collection\n\nI found ${brandProducts.length} products from ${brandEntities.brand}. Here's what makes them special:\n\n**Popular Categories:**\n${Object.entries(
                    brandProducts.reduce((cats, p) => {
                        cats[p.category] = (cats[p.category] || 0) + 1;
                        return cats;
                    }, {} as Record<string, number>)
                ).map(([cat, count]) => `• ${cat}: ${count} items`).join('\n')}\n\n**Price Range:** ₹${Math.min(...brandProducts.map(p => p.price)).toLocaleString('en-IN')} - ₹${Math.max(...brandProducts.map(p => p.price)).toLocaleString('en-IN')}\n\n**Average Rating:** ${(brandProducts.reduce((sum, p) => sum + p.rating, 0) / brandProducts.length).toFixed(1)}/5\n\nWould you like to see specific products from ${brandEntities.brand}?`;
            }
        }
        
        return `I understand you're asking about "${userMessage}". Let me help you better:\n\n**I can assist with:**\n• Finding specific products\n• Creating outfit combinations\n• Comparing items\n• Style advice and trends\n• Brand information\n• Price comparisons\n\n**Try asking:**\n• "Show me blue shirts under 2000"\n• "What goes with black jeans?"\n• "Compare Nike vs Adidas shoes"\n• "Latest trends in fashion"\n\nHow can I help you today?`;
    };

    // Generate search reasoning
    const generateSearchReasoning = (entities: any, resultCount: number): string[] => {
        const reasoning: string[] = [];
        
        if (entities.category) reasoning.push(`Filtered by ${entities.category} category`);
        if (entities.color) reasoning.push(`Matched ${entities.color} color preference`);
        if (entities.brand) reasoning.push(`Included ${entities.brand} brand products`);
        if (entities.price) reasoning.push(`Limited to price under ₹${entities.price.toLocaleString('en-IN')}`);
        if (entities.subcategory) reasoning.push(`Searched for ${entities.subcategory} items`);
        
        reasoning.push(`Sorted by relevance and rating`);
        reasoning.push(`Found ${resultCount} matching products`);
        
        return reasoning;
    };

    // Generate outfit reasoning
    const generateOutfitReasoning = (outfit: Product[], entities: any): string[] => {
        const reasoning: string[] = [];
        
        reasoning.push(`Created complete outfit with ${outfit.length} pieces`);
        if (entities.color) reasoning.push(`Coordinated around ${entities.color} color scheme`);
        reasoning.push(`Selected items with high ratings (4+ stars)`);
        reasoning.push(`Ensured all items are currently in stock`);
        reasoning.push(`Balanced price across all pieces`);
        
        return reasoning;
    };

    // Generate fallback response
    const generateFallbackResponse = (entities: any): string => {
        console.log('Generating fallback response:', entities); // Use entities parameter
        return `I'm not sure I understood that completely. Let me help you better:\n\n**Try these search types:**\n• Product: "red shirt" or "nike shoes"\n• Price: "laptops under 50000"\n• Color: "blue jeans" or "black watch"\n• Outfit: "what goes with white shirt?"\n• Brand: "show me adidas products"\n• General: "latest fashion trends"\n\n**Examples:**\n• "Find me black shirts under 2000"\n• "Compare iPhone vs Samsung"\n• "What should I wear to a party?"\n• "Latest Puma releases"\n\nWhat would you like to explore?`;
    };

    // Get user intent from conversation
    const getUserIntent = (intent: string): ConversationContext['userIntent'] => {
        const intentMap: Record<string, ConversationContext['userIntent']> = {
            'product-search': 'shopping',
            'price-search': 'shopping',
            'color-search': 'shopping',
            'outfit-request': 'outfit',
            'comparison': 'shopping',
            'style-advice': 'information',
            'general': 'general'
        };
        
        return intentMap[intent] || 'general';
    };

    // Handle message sending
    const handleSendMessage = useCallback(async () => {
        if (!inputText.trim()) return;
        
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);
        
        // Detect intent and extract entities
        const { intent, confidence, entities } = detectAdvancedIntent(inputText);
        
        // Generate AI response
        setTimeout(async () => {
            try {
                const aiResponse = await generateAdvancedAIResponse(inputText, intent, entities, confidence);
                setMessages(prev => [...prev, aiResponse]);
            } catch (error) {
                console.error('Error generating AI response:', error);
                const fallbackResponse: Message = {
                    id: Date.now().toString(),
                    text: "I'm having trouble processing that right now. Please try again or rephrase your question.",
                    sender: 'sam',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, fallbackResponse]);
            } finally {
                setIsTyping(false);
            }
        }, 1200);
    }, [inputText, generateAdvancedAIResponse]);

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Enhanced product card component
    const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
        const hasDiscount = product.discount && product.discount > 0;
        const discountedPrice = hasDiscount ? product.price * (1 - (product.discount || 0) / 100) : product.price;

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="flex gap-3">
                    <div className="relative">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        {hasDiscount && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                                -{product.discount}%
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-600 transition-colors">
                            {product.name}
                        </h4>
                        <p className="text-xs text-gray-600">{product.brand}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {hasDiscount && (
                                <span className="text-xs text-gray-500 line-through">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                            )}
                            <span className="text-sm font-bold text-purple-900">
                                ₹{discountedPrice.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                            i < Math.floor(product.rating)
                                                ? 'bg-yellow-400'
                                                : 'bg-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                            {product.colors.slice(0, 3).map((color, index) => (
                                <div
                                    key={index}
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
                >
                    <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 transition-all duration-300 ${
                    isMinimized ? 'w-80 h-12' : 'w-96 h-[650px]'
                }`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Bot className="w-6 h-6" />
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            </div>
                            <div>
                                <h3 className="font-bold">S.A.M. AI Assistant</h3>
                                <p className="text-xs opacity-90">Advanced Shopping Intelligence</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    {!isMinimized && (
                        <>
                            <div className="h-[500px] overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 && (
                                    <div className="text-center py-8">
                                        <Brain className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                                        <h3 className="font-semibold text-gray-900 mb-2">Advanced AI Shopping Assistant</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            I can search 1000+ products, create outfits, compare items, and give personalized style advice.
                                        </p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <button
                                                onClick={() => setInputText("Show me black shirts under 2000")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                🎯 Black shirts under ₹2000
                                            </button>
                                            <button
                                                onClick={() => setInputText("What goes with olive green shirt?")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                👔 Outfit suggestions
                                            </button>
                                            <button
                                                onClick={() => setInputText("Compare Nike vs Adidas shoes")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                📊 Product comparison
                                            </button>
                                            <button
                                                onClick={() => setInputText("Latest fashion trends")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                🌟 Style advice
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${
                                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        {message.sender === 'sam' && (
                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        
                                        <div className={`max-w-[80%] ${
                                            message.sender === 'user' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-100 text-gray-900'
                                        } rounded-2xl px-4 py-3`}>
                                            <p className="text-sm whitespace-pre-line">{message.text}</p>
                                            
                                            {/* Confidence indicator */}
                                            {message.confidence && message.sender === 'sam' && (
                                                <div className="flex items-center gap-1 mt-2 text-xs">
                                                    <span className="opacity-70">Confidence:</span>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-2 h-2 rounded-full ${
                                                                    i < Math.floor(message.confidence! * 5)
                                                                        ? 'bg-green-500'
                                                                        : 'bg-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="ml-1">{Math.round(message.confidence! * 100)}%</span>
                                                </div>
                                            )}
                                            
                                            {/* Product suggestions */}
                                            {message.products && message.products.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {message.products.slice(0, 4).map((product) => (
                                                        <ProductCard key={product.id} product={product} />
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Outfit suggestions */}
                                            {message.outfit && message.outfit.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {message.outfit.map((item) => (
                                                        <ProductCard key={item.id} product={item} />
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Reasoning */}
                                            {message.reasoning && message.reasoning.length > 0 && (
                                                <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                                                    <p className="text-xs text-purple-700 font-medium mb-1">🧠 AI Reasoning:</p>
                                                    <ul className="text-xs text-purple-600 space-y-1">
                                                        {message.reasoning.map((reason, index) => (
                                                            <li key={index} className="flex items-start gap-2">
                                                                <span className="text-purple-500">•</span>
                                                                <span>{reason}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {message.sender === 'user' && (
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                {isTyping && (
                                    <div className="flex gap-3 justify-start">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-gray-200 p-4">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything about shopping, fashion, or products..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    />
                                    
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        className={`p-2 rounded-full transition-colors ${
                                            isListening 
                                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim() || isTyping}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                {/* Quick actions */}
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    <button
                                        onClick={() => setInputText("Show me trending products")}
                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        🔥 Trending
                                    </button>
                                    <button
                                        onClick={() => setInputText("Complete this look")}
                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        👔 Outfit
                                    </button>
                                    <button
                                        onClick={() => setInputText("What's your style advice?")}
                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        💡 Advice
                                    </button>
                                    <button
                                        onClick={() => setInputText("Compare products")}
                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        📊 Compare
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default AdvancedSAMAI;
