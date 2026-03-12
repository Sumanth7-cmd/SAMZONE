import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eventBus, EVENTS } from '../services/events';
import type { Product } from '../services/api';
import { OutfitEngine } from '../services/outfitEngine';
import OutfitRecommendationComponent from './OutfitRecommendation';
import type { OutfitRecommendation as OutfitRecommendationType } from '../services/outfitEngine';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    products?: Product[];
    loading?: boolean;
    timestamp?: number;
}

interface SearchResult {
    products: Product[];
    query: string;
    total: number;
}

const SmartAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hey there! 👋 I'm S.A.M., your AI shopping assistant for SAMZONE. I can help you find products, recommend outfits, and assist with shopping decisions. What are you looking for today?", sender: 'bot', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [currentOutfit, setCurrentOutfit] = useState<OutfitRecommendationType | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        productApi.getAllProducts().then(setAllProducts).catch(console.error);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const detectIntent = (message: string): { intent: string; entities: any[] } => {
        const lowerMessage = message.toLowerCase();
        const entities: any[] = [];

        // Detect product categories
        const categories = ['shirts', 'pants', 'jeans', 'dresses', 't-shirts', 'shoes', 'sneakers', 'accessories', 'watches', 'bags'];
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

        // Detect outfit-related keywords
        if (lowerMessage.includes('outfit') || lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('complete')) {
            return { intent: 'outfit_recommendation', entities };
        }

        // Detect search intent
        if (lowerMessage.includes('show') || lowerMessage.includes('find') || lowerMessage.includes('looking') || lowerMessage.includes('search')) {
            return { intent: 'product_search', entities };
        }

        // Detect cart intent
        if (lowerMessage.includes('add') || lowerMessage.includes('cart')) {
            return { intent: 'add_to_cart', entities };
        }

        return { intent: 'general', entities };
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
        
        // Process the message
        await processMessage(input);
    };

    const processMessage = async (message: string) => {
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

        // Fallback to local logic
        const { intent, entities } = detectIntent(message);
        let responseText = '';
        let recommendedProducts: Product[] = [];

        if (intent === 'product_search') {
            recommendedProducts = searchProductsFromEntities(entities);
            responseText = `I found ${recommendedProducts.length} great options for you!`;
        } else if (intent === 'outfit_recommendation' && selectedProduct) {
            const outfit = OutfitEngine.generateOutfit(selectedProduct, allProducts);
            setCurrentOutfit(outfit);
            responseText = `I've created a complete outfit for your ${selectedProduct.name}!`;
        } else if (intent === 'add_to_cart') {
            if (selectedProduct) {
                eventBus.emit(EVENTS.PRODUCT_SELECTED, selectedProduct);
                responseText = `Added ${selectedProduct.name} to your cart!`;
            }
        } else {
            responseText = "I'm here to help with your shopping needs! Feel free to ask me about products, styles, or recommendations.";
        }

        const botMessage: Message = {
            id: Date.now(),
            text: responseText,
            sender: 'bot',
            products: recommendedProducts,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
    };

    const searchProductsFromEntities = (entities: any[]): Product[] => {
        let filteredProducts = allProducts;

        entities.forEach(entity => {
            if (entity.type === 'category') {
                filteredProducts = filteredProducts.filter(p => 
                    p.category.toLowerCase().includes(entity.value.toLowerCase())
                );
            } else if (entity.type === 'color') {
                filteredProducts = filteredProducts.filter(p => 
                    p.colors?.some(c => c.toLowerCase().includes(entity.value.toLowerCase()))
                );
            }
        });

        return filteredProducts.slice(0, 5);
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        
        // Add to messages
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
                className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 z-40 flex items-center gap-2"
            >
                <Bot className="w-6 h-6" />
                <span className="font-medium">Chat with S.A.M.</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <h2 className="text-2xl font-bold text-gray-900">S.A.M. - AI Shopping Assistant</h2>
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
                            {messages.map((message, index) => (
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
                                            <p className="text-sm leading-relaxed">{message.text}</p>
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
                                    placeholder="Ask about products, outfits, or shopping help..."
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

export default SmartAssistant;
