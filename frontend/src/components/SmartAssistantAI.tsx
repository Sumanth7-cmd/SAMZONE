import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Brain } from 'lucide-react';
import { eventBus, EVENTS } from '../services/events';
import type { Product } from '../services/api';
import { productApi } from '../services/api';
import { AIEmbeddingsService, type OutfitFromImage } from '../services/aiEmbeddings';
import OutfitRecommendationComponent from './OutfitRecommendation';
import type { OutfitRecommendation as OutfitRecommendationType } from '../services/outfitEngine';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    products?: Product[];
    loading?: boolean;
    timestamp?: number;
    outfit?: OutfitFromImage;
}

const SmartAssistantAI: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hey there! 👋 I'm S.A.M., your advanced AI shopping assistant. I can help you with visual search, personalized outfit recommendations, and intelligent product discovery. What can I help you find today?", sender: 'bot', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [currentOutfit, setCurrentOutfit] = useState<OutfitRecommendationType | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize AI embeddings
        AIEmbeddingsService.loadUserProfile();
        AIEmbeddingsService.loadCachedEmbeddings();
        
        // Load products
        productApi.getAllProducts().then(async (products) => {
            const productArray = Array.isArray(products) ? products : (products as any).content || products;
            setAllProducts(productArray);
            
            // Initialize embeddings if not cached
            const cachedEmbeddings = AIEmbeddingsService.loadCachedEmbeddings();
            if (Array.isArray(cachedEmbeddings) && cachedEmbeddings.length === 0) {
                await AIEmbeddingsService.initializeEmbeddings(productArray);
            }
        }).catch(console.error);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Advanced intent detection with semantic understanding
    const detectIntent = (message: string): { intent: string; entities: any[]; semanticQuery?: string } => {
        const lowerMessage = message.toLowerCase();
        const entities: any[] = [];

        // Extract semantic query for embeddings
        let semanticQuery = message;

        // Detect product categories
        const categories = ['shirts', 'pants', 'jeans', 'dresses', 't-shirts', 'shoes', 'sneakers', 'accessories', 'watches', 'bags', 'hoodies', 'jackets'];
        categories.forEach(cat => {
            if (lowerMessage.includes(cat)) {
                entities.push({ type: 'category', value: cat });
            }
        });

        // Detect colors
        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'navy'];
        colors.forEach(color => {
            if (lowerMessage.includes(color)) {
                entities.push({ type: 'color', value: color });
            }
        });

        // Detect styles
        const styles = ['streetwear', 'formal', 'casual', 'sport', 'urban', 'classic', 'modern'];
        styles.forEach(style => {
            if (lowerMessage.includes(style)) {
                entities.push({ type: 'style', value: style });
            }
        });

        // Detect price constraints
        const priceMatch = message.match(/(?:under|below|less than|cheaper than)\s*(?:₹|rs\.?\s*)?(\d+)/i);
        if (priceMatch) {
            entities.push({ type: 'maxPrice', value: parseInt(priceMatch[1]) });
        }

        // Detect visual search intent
        if (lowerMessage.includes('visual') || lowerMessage.includes('image') || lowerMessage.includes('photo') || lowerMessage.includes('picture') || lowerMessage.includes('upload')) {
            return { intent: 'visual_search', entities, semanticQuery };
        }

        // Detect outfit generation from image
        if (lowerMessage.includes('outfit from image') || lowerMessage.includes('generate outfit') || lowerMessage.includes('complete this look')) {
            return { intent: 'outfit_from_image', entities, semanticQuery };
        }

        // Detect complex semantic search
        if (lowerMessage.includes('show') || lowerMessage.includes('find') || lowerMessage.includes('looking') || lowerMessage.includes('search') || 
            lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
            return { intent: 'semantic_search', entities, semanticQuery };
        }

        // Detect personalized recommendations
        if (lowerMessage.includes('my style') || lowerMessage.includes('for me') || lowerMessage.includes('personalized') || lowerMessage.includes('recommend for me')) {
            return { intent: 'personalized_search', entities, semanticQuery };
        }

        return { intent: 'general', entities, semanticQuery };
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        
        // Process the message with AI
        await processMessageWithAI(input);
    };

    const processMessageWithAI = async (message: string) => {
        setIsTyping(true);

        try {
            // Try AI API first
            const response = await fetch('http://localhost:8080/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                const aiReply = await response.text();
                
                const botMessage: Message = {
                    id: Date.now(),
                    text: aiReply,
                    sender: 'bot',
                    timestamp: Date.now()
                };
                
                setMessages(prev => [...prev, botMessage]);
                setIsTyping(false);
                return;
            }
        } catch (error) {
            console.error('AI API error:', error);
        }

        // Fallback to local AI processing
        const { intent, entities, semanticQuery } = detectIntent(message);
        let responseText = '';
        let recommendedProducts: Product[] = [];
        let generatedOutfit: OutfitFromImage | null = null;

        if (intent === 'semantic_search' && semanticQuery) {
            // Use semantic search with embeddings
            const queryEmbedding = await AIEmbeddingsService.generateProductEmbedding({
                id: 0,
                name: semanticQuery,
                brand: '',
                description: semanticQuery,
                price: 0,
                rating: 0,
                image: '',
                category: '',
                colors: [],
                sizes: [],
                specifications: semanticQuery
            });

            const similarProducts = AIEmbeddingsService.findSimilarProducts(queryEmbedding, 6);
            recommendedProducts = similarProducts.map(item => item.productData);
            
            responseText = `I found ${recommendedProducts.length} items that match "${semanticQuery}" using AI semantic search!`;
        } else if (intent === 'personalized_search') {
            // Personalized search based on user profile
            const userProfile = AIEmbeddingsService.getUserProfile();
            const personalizedProducts = allProducts.filter(product => {
                let matches = true;
                
                // Brand preference
                if (userProfile.favoriteBrands.length > 0) {
                    matches = matches && userProfile.favoriteBrands.includes(product.brand);
                }
                
                // Color preference
                if (userProfile.favoriteColors.length > 0) {
                    matches = matches && product.colors?.some(color => 
                        userProfile.favoriteColors.includes(color.toLowerCase())
                    );
                }
                
                // Budget preference
                const price = product.price || 0;
                matches = matches && price >= userProfile.budgetRange.min && price <= userProfile.budgetRange.max;
                
                return matches;
            }).slice(0, 6);
            
            recommendedProducts = personalizedProducts;
            responseText = `Based on your preferences, I found ${recommendedProducts.length} personalized recommendations for you!`;
        } else if (intent === 'visual_search') {
            responseText = "For visual search, please click the AI Visual Search button in the top-right corner and upload an image. I'll find similar products using AI!";
        } else if (intent === 'outfit_from_image') {
            responseText = "To generate an outfit from an image, use the AI Visual Search feature. Upload your clothing photo and click 'Generate Outfit' - I'll create a complete look for you!";
        } else {
            responseText = "I'm your advanced AI shopping assistant! Try asking me:\n• 'Show me streetwear hoodies under ₹2000'\n• 'Find blue formal shirts'\n• 'Recommend clothes for my style'\n• Use AI Visual Search for image-based discovery";
        }

        const botMessage: Message = {
            id: Date.now(),
            text: responseText,
            sender: 'bot',
            products: recommendedProducts,
            outfit: generatedOutfit || undefined,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        
        const selectMessage: Message = {
            id: Date.now(),
            text: `Selected: ${product.name} - ₹${product.price}`,
            sender: 'bot',
            products: [product],
            timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, selectMessage]);
    };

    const handleAddToCart = (product: Product) => {
        eventBus.emit(EVENTS.PRODUCT_SELECTED, product);
        
        const cartMessage: Message = {
            id: Date.now(),
            text: `✅ Added ${product.name} to cart!`,
            sender: 'bot',
            timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, cartMessage]);
    };

    const handleCloseOutfit = () => {
        setCurrentOutfit(null);
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center gap-2"
            >
                <Brain className="w-6 h-6" />
                <span className="font-medium">AI Assistant</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <h2 className="text-2xl font-bold text-gray-900">S.A.M. - Advanced AI Assistant</h2>
                                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">Semantic Search</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                            message.sender === 'user' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        {message.loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                                                <span className="text-sm">S.A.M. is thinking...</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                                        )}
                                        
                                        {/* Product Cards */}
                                        {message.products && message.products.length > 0 && (
                                            <div className="mt-3 grid grid-cols-1 gap-2">
                                                {message.products.map((product, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleProductSelect(product)}
                                                        className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                                                    >
                                                        <div className="flex gap-3">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-16 h-16 object-cover rounded-lg"
                                                            />
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                                                                <p className="text-xs text-gray-600">{product.brand}</p>
                                                                <p className="text-lg font-bold text-purple-900">₹{product.price?.toLocaleString('en-IN')}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Try: 'Show streetwear hoodies under ₹2000' or 'Find blue formal shirts'"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Outfit Recommendation Modal */}
            {currentOutfit && (
                <OutfitRecommendationComponent
                    outfit={currentOutfit}
                    onClose={handleCloseOutfit}
                    onAddToCart={handleAddToCart}
                />
            )}
        </>
    );
};

export default SmartAssistantAI;
