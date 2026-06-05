import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Bot, Sparkles, Brain, TrendingUp, ShoppingBag, Shirt, Package } from 'lucide-react';
import { eventBus, EVENTS } from '../services/events';
import type { Product } from '../services/api';
import { productApi } from '../services/api';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    products?: Product[];
    loading?: boolean;
    timestamp?: number;
    outfit?: any;
}

interface ConversationContext {
    lastProduct?: Product;
    lastCategory?: string;
    lastPriceRange?: number;
    userIntent?: 'greeting' | 'product_search' | 'outfit_request' | 'comparison' | 'general_chat';
}

const EnhancedAIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 1, 
            text: "Hey! 👋 Welcome to SAMZONE! I'm S.A.M., your advanced AI shopping assistant. I can help you find the perfect outfits, suggest products, compare items, and give style advice. What are you looking for today?", 
            sender: 'bot', 
            timestamp: Date.now() 
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [conversationContext, setConversationContext] = useState<ConversationContext>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load products on mount
    useEffect(() => {
        productApi.getAllProducts().then((products) => {
            const productArray = Array.isArray(products) ? products : (products as any).content || products;
            setAllProducts(productArray);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Enhanced AI Response System
    const generateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
        const lowerMessage = userMessage.toLowerCase();
        
        // Detect user intent
        const intent = detectUserIntent(lowerMessage);
        setConversationContext(prev => ({ ...prev, userIntent: intent }));

        // Handle different intents
        switch (intent) {
            case 'greeting':
                return generateGreetingResponse();
            
            case 'product_search':
                return await handleProductSearch(lowerMessage);
            
            case 'outfit_request':
                return await handleOutfitRequest(lowerMessage);
            
            case 'comparison':
                return await handleComparison(lowerMessage);
            
            case 'general_chat':
                return generateGeneralResponse(lowerMessage);
            
            default:
                return generateFallbackResponse(userMessage);
        }
    }, [allProducts, conversationContext]);

    // Intent Detection
    const detectUserIntent = (message: string): ConversationContext['userIntent'] => {
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        const productKeywords = ['show', 'find', 'search', 'looking for', 'want', 'need'];
        const outfitKeywords = ['outfit', 'suggest', 'complete', 'goes with', 'what goes with', 'recommend'];
        const comparisonKeywords = ['better', 'vs', 'versus', 'compare', 'which is', 'difference'];
        
        if (greetings.some(greeting => message.includes(greeting))) {
            return 'greeting';
        }
        if (outfitKeywords.some(keyword => message.includes(keyword))) {
            return 'outfit_request';
        }
        if (comparisonKeywords.some(keyword => message.includes(keyword))) {
            return 'comparison';
        }
        if (productKeywords.some(keyword => message.includes(keyword))) {
            return 'product_search';
        }
        
        return 'general_chat';
    };

    // Response Generators
    const generateGreetingResponse = (): string => {
        const responses = [
            "Hey there! 👋 I'm doing great! Ready to help you find some amazing outfits. What's on your shopping list today? 😄",
            "Hi! 🌟 Welcome back to SAMZONE! I'm excited to help you discover perfect styles. What can I assist you with?",
            "Hello! 👋 Great to see you! I'm here to make your shopping experience amazing. What are you looking for?",
            "Hey! 😊 I'm S.A.M., your personal AI stylist. Let's find something incredible for you today!"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const generateGeneralResponse = (message: string): string => {
        const generalResponses = [
            "That's interesting! Tell me more about what you have in mind, and I'll help you find the perfect match! 🛍️",
            "I'd love to help you with that! Could you give me more details about what you're looking for? 🤔",
            "Great question! Let me think about that and give you some personalized recommendations. ✨",
            "I'm here to make your shopping experience amazing! What specific products or styles interest you? 🛒"
        ];
        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
    };

    const generateFallbackResponse = (message: string): string => {
        return `I understand you're asking about: "${message}". Let me help you find what you need! 🛍️ Could you tell me more specifically what you're looking for?`;
    };

    // Product Search Handler
    const handleProductSearch = async (message: string): Promise<string> => {
        try {
            // Extract search criteria
            const criteria = extractSearchCriteria(message);
            
            // Filter products based on criteria
            let filteredProducts = allProducts;
            
            if (criteria.color) {
                filteredProducts = filteredProducts.filter(p => 
                    p.colors?.some(color => color.toLowerCase().includes(criteria.color.toLowerCase()))
                );
            }
            
            if (criteria.category) {
                filteredProducts = filteredProducts.filter(p => 
                    p.category.toLowerCase().includes(criteria.category.toLowerCase())
                );
            }
            
            if (criteria.maxPrice) {
                filteredProducts = filteredProducts.filter(p => p.price <= criteria.maxPrice);
            }
            
            if (criteria.minPrice) {
                filteredProducts = filteredProducts.filter(p => p.price >= criteria.minPrice);
            }

            // Update context
            setConversationContext(prev => ({ 
                ...prev, 
                lastCategory: criteria.category,
                lastPriceRange: criteria.maxPrice 
            }));

            // Add products to message
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: generateProductResponse(filteredProducts, criteria),
                sender: 'bot',
                products: filteredProducts.slice(0, 6),
                timestamp: Date.now()
            }]);

            return `I found ${filteredProducts.length} great options for you! Check them out below. 🛍️`;
            
        } catch (error) {
            console.error('Product search error:', error);
            return "I had trouble finding products. Could you try rephrasing your search? 🤔";
        }
    };

    // Outfit Request Handler
    const handleOutfitRequest = async (message: string): Promise<string> => {
        try {
            const outfitCriteria = extractOutfitCriteria(message);
            
            // Generate complete outfit
            const outfit = generateCompleteOutfit(outfitCriteria);
            
            // Add outfit to message
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: generateOutfitResponse(outfit),
                sender: 'bot',
                products: [outfit.top, outfit.bottom, outfit.shoes, outfit.accessory].filter(Boolean),
                timestamp: Date.now()
            }]);

            return `Here's a complete outfit I've put together for you! 👕👖👟`;
            
        } catch (error) {
            console.error('Outfit generation error:', error);
            return "I had trouble creating that outfit. Let me try a different approach! 🤔";
        }
    };

    // Comparison Handler
    const handleComparison = async (message: string): Promise<string> => {
        try {
            const products = extractProductsForComparison(message);
            
            if (products.length < 2) {
                return "I need at least 2 products to compare. Could you specify which items you'd like me to compare? 🤔";
            }
            
            const comparison = generateComparison(products);
            
            return comparison;
            
        } catch (error) {
            console.error('Comparison error:', error);
            return "I had trouble comparing those products. Could you be more specific? 🤔";
        }
    };

    // Extract Search Criteria
    const extractSearchCriteria = (message: string) => {
        const criteria: any = {};
        
        // Color extraction
        const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'gray', 'brown', 'navy', 'olive'];
        colors.forEach(color => {
            if (message.includes(color)) criteria.color = color;
        });
        
        // Category extraction
        const categories = ['shirt', 'pants', 'shoes', 'jacket', 'hoodie', 'dress', 'shorts', 'accessories'];
        categories.forEach(category => {
            if (message.includes(category)) criteria.category = category;
        });
        
        // Price extraction
        const priceMatch = message.match(/(\d+)/);
        if (priceMatch) {
            const price = parseInt(priceMatch[1]);
            if (message.includes('under') || message.includes('below')) {
                criteria.maxPrice = price;
            } else if (message.includes('over') || message.includes('above')) {
                criteria.minPrice = price;
            } else {
                criteria.maxPrice = price;
            }
        }
        
        return criteria;
    };

    // Extract Outfit Criteria
    const extractOutfitCriteria = (message: string) => {
        const criteria: any = {};
        
        // Style extraction
        const styles = ['casual', 'formal', 'sport', 'streetwear', 'business', 'party', 'college'];
        styles.forEach(style => {
            if (message.includes(style)) criteria.style = style;
        });
        
        // Occasion extraction
        const occasions = ['daily', 'office', 'party', 'gym', 'college', 'date', 'meeting'];
        occasions.forEach(occasion => {
            if (message.includes(occasion)) criteria.occasion = occasion;
        });
        
        return criteria;
    };

    // Generate Product Response
    const generateProductResponse = (products: Product[], criteria: any): string => {
        if (products.length === 0) {
            return "I couldn't find products matching your criteria. Let me suggest some popular items instead! 🛍️";
        }
        
        let response = `Here are some great options for you:\n\n`;
        
        products.slice(0, 6).forEach((product, index) => {
            response += `${index + 1}. ${product.name} – ₹${product.price.toLocaleString('en-IN')}\n`;
            response += `   ${product.brand} | ${product.category} | ⭐ ${product.rating}\n`;
            if (product.colors && product.colors.length > 0) {
                response += `   Colors: ${product.colors.join(', ')}\n`;
            }
            response += '\n';
        });
        
        response += `Found ${products.length} total products matching your criteria. Would you like styling suggestions for any of these?`;
        
        return response;
    };

    // Generate Complete Outfit
    const generateCompleteOutfit = (criteria: any) => {
        const outfit = {
            top: allProducts.find(p => p.category.toLowerCase().includes('shirt') && Math.random() > 0.5),
            bottom: allProducts.find(p => p.category.toLowerCase().includes('pant') && Math.random() > 0.5),
            shoes: allProducts.find(p => p.category.toLowerCase().includes('shoe') && Math.random() > 0.5),
            accessory: allProducts.find(p => p.category.toLowerCase().includes('accessor') && Math.random() > 0.7)
        };
        
        // Fallback to random products if specific ones not found
        if (!outfit.top) outfit.top = allProducts[Math.floor(Math.random() * Math.min(allProducts.length, 100))];
        if (!outfit.bottom) outfit.bottom = allProducts[Math.floor(Math.random() * Math.min(allProducts.length, 100))];
        if (!outfit.shoes) outfit.shoes = allProducts[Math.floor(Math.random() * Math.min(allProducts.length, 100))];
        
        const totalPrice = (outfit.top?.price || 0) + (outfit.bottom?.price || 0) + (outfit.shoes?.price || 0) + (outfit.accessory?.price || 0);
        
        return {
            ...outfit,
            totalPrice,
            style: criteria.style || 'casual',
            occasion: criteria.occasion || 'daily'
        };
    };

    // Generate Outfit Response
    const generateOutfitResponse = (outfit: any): string => {
        let response = `Here's a complete ${outfit.style} outfit for you:\n\n`;
        
        if (outfit.top) {
            response += `👕 Top: ${outfit.top.name} – ₹${outfit.top.price.toLocaleString('en-IN')}\n`;
        }
        if (outfit.bottom) {
            response += `👖 Bottom: ${outfit.bottom.name} – ₹${outfit.bottom.price.toLocaleString('en-IN')}\n`;
        }
        if (outfit.shoes) {
            response += `👟 Shoes: ${outfit.shoes.name} – ₹${outfit.shoes.price.toLocaleString('en-IN')}\n`;
        }
        if (outfit.accessory) {
            response += `⌚ Accessory: ${outfit.accessory.name} – ₹${outfit.accessory.price.toLocaleString('en-IN')}\n`;
        }
        
        response += `\n💰 Total Outfit Price: ₹${outfit.totalPrice.toLocaleString('en-IN')}\n\n`;
        response += `This outfit works perfectly for ${outfit.occasion} wear with balanced colors and complementary styles. ✨`;
        
        return response;
    };

    // Generate Comparison
    const generateComparison = (products: Product[]): string => {
        let response = `Here's my comparison of these products:\n\n`;
        
        products.forEach((product, index) => {
            response += `${index + 1}. ${product.name}\n`;
            response += `   Price: ₹${product.price.toLocaleString('en-IN')}\n`;
            response += `   Brand: ${product.brand}\n`;
            response += `   Rating: ⭐ ${product.rating}\n`;
            response += `   Category: ${product.category}\n\n`;
        });
        
        // Recommendation
        const bestValue = products.reduce((best, current) => 
            (current.rating > best.rating) ? current : best
        );
        
        response += `💡 My recommendation: ${bestValue.name} offers the best value with its ${bestValue.rating}⭐ rating and reasonable price.`;
        
        return response;
    };

    // Extract Products for Comparison
    const extractProductsForComparison = (message: string): Product[] => {
        const products: Product[] = [];
        
        // Simple keyword matching for demo
        const keywords = message.toLowerCase().split(' ');
        
        allProducts.forEach(product => {
            if (keywords.some(keyword => 
                product.name.toLowerCase().includes(keyword) ||
                product.category.toLowerCase().includes(keyword) ||
                product.brand.toLowerCase().includes(keyword)
            )) {
                products.push(product);
            }
        });
        
        return products.slice(0, 4);
    };

    // Handle sending message
    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setIsTyping(true);

        // Add user message
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: userMessage,
            sender: 'user',
            timestamp: Date.now()
        }]);

        try {
            // Generate AI response
            const aiResponse = await generateAIResponse(userMessage);
            
            // Add AI response
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: aiResponse,
                    sender: 'bot',
                    timestamp: Date.now()
                }]);
                setIsTyping(false);
            }, 1000 + Math.random() * 1000); // Natural delay

        } catch (error) {
            console.error('AI Response Error:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "I'm having trouble processing that. Could you try asking differently? 🤔",
                sender: 'bot',
                timestamp: Date.now()
            }]);
            setIsTyping(false);
        }
    }, [input, isTyping, generateAIResponse]);

    // Handle product selection from messages
    const handleProductSelect = useCallback((product: Product) => {
        setSelectedProduct(product);
        setConversationContext(prev => ({ ...prev, lastProduct: product }));
        
        // Add to cart or show details
        eventBus.emit(EVENTS.ADD_TO_CART, product);
        
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: `Great choice! I've added ${product.name} to your cart. It's a fantastic ${product.category} with excellent reviews! 🛍️`,
            sender: 'bot',
            timestamp: Date.now()
        }]);
    }, []);

    return (
        <>
            {/* Floating AI Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 flex items-center gap-3 group"
            >
                <Brain className="w-6 h-6 group-hover:animate-pulse" />
                <span className="font-bold hidden sm:block">S.A.M. AI</span>
            </button>

            {/* AI Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full animate-pulse"></div>
                                <h2 className="text-xl font-bold text-gray-900">S.A.M. AI Assistant</h2>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Powered by AI</span>
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
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                                        message.sender === 'user'
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        {message.sender === 'bot' && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Bot className="w-4 h-4 text-purple-600" />
                                                <span className="text-xs font-semibold text-purple-600">S.A.M.</span>
                                            </div>
                                        )}
                                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                                        
                                        {/* Product Cards */}
                                        {message.products && message.products.length > 0 && (
                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {message.products.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => handleProductSelect(product)}
                                                        className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group"
                                                    >
                                                        <div className="flex gap-3">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-gray-900 truncate text-sm">{product.name}</h4>
                                                                <p className="text-xs text-gray-600">{product.brand}</p>
                                                                <p className="text-lg font-bold text-purple-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <span className="text-xs text-gray-500">⭐</span>
                                                                    <span className="text-xs font-semibold">{product.rating}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-2xl p-4">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-purple-600 animate-bounce" />
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask me anything about fashion, products, or styling..."
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isTyping}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                    onClick={() => setInput("Show me black shirts under 1000")}
                                    className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Black Shirts under ₹1000
                                </button>
                                <button
                                    onClick={() => setInput("Suggest casual outfit for college")}
                                    className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    College Outfit
                                </button>
                                <button
                                    onClick={() => setInput("Best shoes for gym")}
                                    className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Gym Shoes
                                </button>
                                <button
                                    onClick={() => setInput("Complete this look")}
                                    className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Complete Look
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EnhancedAIAssistant;
