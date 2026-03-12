import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, ShoppingCart, Eye, Search, Package, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
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
        const categories = ['shirts', 'pants', 'jeans', 'dresses', 't-shirts', 'shoes', 'sneakers', 'accessories', 'watches', 'bags', 'electronics', 'headphones', 'phones'];
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

        // Detect price range
        const priceMatch = lowerMessage.match(/under\s*(\d+)/i) || lowerMessage.match(/(\d+)\s*-\s*(\d+)/i) || lowerMessage.match(/between\s*(\d+)\s*and\s*(\d+)/i);
        if (priceMatch) {
            if (priceMatch[1] && priceMatch[2]) {
                entities.push({ type: 'price_range', min: parseInt(priceMatch[1]), max: parseInt(priceMatch[2]) });
            } else if (priceMatch[1]) {
                entities.push({ type: 'max_price', value: parseInt(priceMatch[1]) });
            }
        }

        // Detect intent
        if (lowerMessage.includes('what goes with') || lowerMessage.includes('match with') || lowerMessage.includes('pair with')) {
            return { intent: 'outfit_suggestion', entities };
        }
        if (lowerMessage.includes('show me') || lowerMessage.includes('find') || lowerMessage.includes('looking for')) {
            return { intent: 'product_search', entities };
        }
        if (lowerMessage.includes('outfit') || lowerMessage.includes('style')) {
            return { intent: 'outfit_recommendation', entities };
        }

        return { intent: 'general', entities };
    };

    const searchProducts = async (query: string) => {
        if (!query.trim()) return;
        
        setIsSearching(true);
        try {
            const products = await productApi.searchProducts(query);
            setSearchResults({
                products: products.slice(0, 5), // Limit to 5 results
                query: query,
                total: products.length
            });
            
            // Add search result to chat
            const searchMessage: Message = {
                id: Date.now(),
                text: `I found ${products.length} products matching "${query}":`,
                sender: 'bot',
                products: products.slice(0, 3),
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, searchMessage]);
            
        } catch (error) {
            console.error('Search error:', error);
            const errorMessage: Message = {
                id: Date.now(),
                text: `Sorry, I couldn't find products for "${query}". Please try again.`,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSearching(false);
        }
    };

    const generateAIResponse = async (userMessage: string) => {
        setIsTyping(true);
        
        try {
            const response = await fetch('http://localhost:8080/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error('API call failed');
            }

            const aiReply = await response.text();
            
            const botMessage: Message = {
                id: Date.now(),
                text: aiReply,
                sender: 'bot',
                timestamp: Date.now()
            };
            
            setMessages(prev => [...prev, botMessage]);
            
        } catch (error) {
            console.error('AI API error:', error);
            
            // Fallback to local logic
            const { intent, entities } = detectIntent(userMessage);
            let responseText = '';
            let recommendedProducts: Product[] = [];

            if (intent === 'product_search') {
                recommendedProducts = searchProductsFromEntities(entities);
                responseText = `I found some great options for you!`;
            } else if (intent === 'outfit_suggestion') {
                recommendedProducts = getOutfitSuggestions(entities);
                responseText = `Here are some outfit ideas that would work perfectly:`;
            } else if (intent === 'greeting') {
                responseText = "Hey there! 👋 I'm S.A.M., your AI shopping assistant for SAMZONE. How can I help you today?";
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
            
        } finally {
            setIsTyping(false);
        }
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
            } else if (entity.type === 'price') {
                filteredProducts = filteredProducts.filter(p => p.price <= entity.value);
                    filtered = filtered.filter(p => 
                        p.category.toLowerCase().includes(entity.value) ||
                        p.name.toLowerCase().includes(entity.value)
                    );
                    break;
                case 'color':
                    filtered = filtered.filter(p => 
                        p.colors?.some(color => color.toLowerCase().includes(entity.value))
                    );
                    break;
                case 'price_range':
                    filtered = filtered.filter(p => p.price >= entity.min && p.price <= entity.max);
                    break;
                case 'max_price':
                    filtered = filtered.filter(p => p.price <= entity.value);
                    break;
            }
        });

        return filtered.slice(0, 3);
    };

    const getOutfitSuggestions = (entities: any[]): Product[] => {
        const categoryEntity = entities.find(e => e.type === 'category');
        const colorEntity = entities.find(e => e.type === 'color');
        
        if (!categoryEntity) {
            // Return a complete outfit
            const shirt = allProducts.filter(p => p.category.toLowerCase().includes('shirt')).slice(0, 1);
            const pants = allProducts.filter(p => p.category.toLowerCase().includes('pant')).slice(0, 1);
            const shoes = allProducts.filter(p => p.category.toLowerCase().includes('shoe')).slice(0, 1);
            return [...shirt, ...pants, ...shoes].slice(0, 3);
        }

        const category = categoryEntity.value;
        let suggestions: Product[] = [];

        // Enhanced outfit suggestion logic with color matching
        if (category.includes('shirt')) {
            suggestions = [
                ...allProducts.filter(p => {
                    const isPant = p.category.toLowerCase().includes('pant') || p.category.toLowerCase().includes('jean');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Blue') || c.includes('Black'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Gray'))) ||
                        (colorEntity.value === 'white' && (c.includes('White') || c.includes('Beige'))) ||
                        !colorEntity
                    );
                    return isPant && matchesColor;
                }).slice(0, 1),
                ...allProducts.filter(p => {
                    const isShoe = p.category.toLowerCase().includes('shoe') || p.category.toLowerCase().includes('sneaker');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Blue') || c.includes('White'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Brown'))) ||
                        (colorEntity.value === 'white' && (c.includes('White') || c.includes('Gray'))) ||
                        !colorEntity
                    );
                    return isShoe && matchesColor;
                }).slice(0, 1)
            ];
        } else if (category.includes('pant') || category.includes('jean')) {
            suggestions = [
                ...allProducts.filter(p => {
                    const isShirt = p.category.toLowerCase().includes('shirt');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Blue') || c.includes('White'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Gray'))) ||
                        (colorEntity.value === 'white' && (c.includes('White') || c.includes('Blue'))) ||
                        !colorEntity
                    );
                    return isShirt && matchesColor;
                }).slice(0, 1),
                ...allProducts.filter(p => {
                    const isShoe = p.category.toLowerCase().includes('shoe') || p.category.toLowerCase().includes('sneaker');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Blue') || c.includes('Brown'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Brown'))) ||
                        (colorEntity.value === 'white' && (c.includes('White') || c.includes('Brown'))) ||
                        !colorEntity
                    );
                    return isShoe && matchesColor;
                }).slice(0, 1)
            ];
        } else if (category.includes('dress')) {
            suggestions = [
                ...allProducts.filter(p => {
                    const isShoe = p.category.toLowerCase().includes('shoe') || p.category.toLowerCase().includes('heel');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Gold') || c.includes('Silver'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Gold'))) ||
                        (colorEntity.value === 'white' && (c.includes('Silver') || c.includes('Nude'))) ||
                        !colorEntity
                    );
                    return isShoe && matchesColor;
                }).slice(0, 1),
                ...allProducts.filter(p => {
                    const isAccessory = p.category.toLowerCase().includes('access') || p.category.toLowerCase().includes('bag');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Gold') || c.includes('Silver'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Gold'))) ||
                        (colorEntity.value === 'white' && (c.includes('Silver') || c.includes('Pearl'))) ||
                        !colorEntity
                    );
                    return isAccessory && matchesColor;
                }).slice(0, 1)
            ];
        } else if (category.includes('shoe') || category.includes('sneaker')) {
            suggestions = [
                ...allProducts.filter(p => {
                    const isPant = p.category.toLowerCase().includes('pant') || p.category.toLowerCase().includes('jean');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Blue') || c.includes('Black'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Gray'))) ||
                        (colorEntity.value === 'white' && (c.includes('White') || c.includes('Beige'))) ||
                        !colorEntity
                    );
                    return isPant && matchesColor;
                }).slice(0, 1),
                ...allProducts.filter(p => {
                    const isShirt = p.category.toLowerCase().includes('shirt');
                    const matchesColor = !colorEntity || p.colors?.some(c => 
                        (colorEntity.value === 'blue' && (c.includes('Blue') || c.includes('White'))) ||
                        (colorEntity.value === 'black' && (c.includes('Black') || c.includes('Gray'))) ||
                        (colorEntity.value === 'white' && (c.includes('White') || c.includes('Blue'))) ||
                        !colorEntity
                    );
                    return isShirt && matchesColor;
                }).slice(0, 1)
            ];
        }

        return suggestions.slice(0, 3);
    };

    const generateResponse = (intent: string, products: Product[]): string => {
        switch (intent) {
            case 'greeting':
                return "Hey there! 👋 I'm S.A.M., your shopping assistant. How can I help you today?";
            
            case 'product_search':
                if (products.length === 0) {
                    return "Sorry, I couldn't find any products matching your criteria. Would you like to try different filters?";
                }
                return `I found ${products.length} great options for you! Check these out:`;
            
            case 'outfit_suggestion':
                if (products.length === 0) {
                    return "I'd be happy to help you style that! Could you tell me which item you're looking to match?";
                }
                return `Here are some items that would pair perfectly with your choice:`;
            
            case 'outfit_recommendation':
                return `Here's a complete outfit I've put together for you:`;
            
            default:
                const responses = [
                    "I'm here to help! You can ask me to find products, suggest outfits, or style advice.",
                    "Feel free to ask me about specific products, colors, or price ranges!",
                    "I can help you find the perfect outfit. Just tell me what you're looking for!"
                ];
                return responses[Math.floor(Math.random() * responses.length)];
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { 
            id: Date.now(), 
            text: input, 
            sender: 'user' 
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Add typing indicator
        const typingMessage: Message = {
            id: Date.now() + 1,
            text: "S.A.M. is thinking...",
            sender: 'bot',
            loading: true
        };
        setMessages(prev => [...prev, typingMessage]);

        try {
            // Call OpenAI API
            const response = await fetch('http://localhost:8080/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input })
            });

            if (!response.ok) {
                throw new Error('API call failed');
            }

            const aiResponse = await response.text();
            
            // Remove typing indicator and add response
            setMessages(prev => {
                const filtered = prev.filter(m => !m.loading);
                return [...filtered, {
                    id: Date.now() + 2,
                    text: aiResponse,
                    sender: 'bot',
                    products: [] // Products will be added separately if needed
                }];
            });
            
        } catch (error) {
            console.error('Chat API error:', error);
            
            // Fallback to local logic
            setTimeout(() => {
                const { intent: detectedIntent, entities } = detectIntent(input);
                let recommendedProducts: Product[] = [];

                if (detectedIntent === 'product_search') {
                    recommendedProducts = searchProducts(entities);
                } else if (detectedIntent === 'outfit_suggestion' || detectedIntent === 'outfit_recommendation') {
                    recommendedProducts = getOutfitSuggestions(entities);
                }

                const responseText = generateResponse(detectedIntent, recommendedProducts);
                
                setMessages(prev => {
                    const filtered = prev.filter(m => !m.loading);
                    return [...filtered, {
                        id: Date.now() + 2,
                        text: responseText,
                        sender: 'bot',
                        products: recommendedProducts
                    }];
                });
            }, 1000);
        } finally {
            setIsTyping(false);
        }
    };

    const handleProductSelected = (product: Product) => {
        setIsOpen(true);
        
        const recommendations = getOutfitSuggestions([{ type: 'category', value: product.category.toLowerCase() }]);
        const message = `Excellent choice! That ${product.brand} ${product.name} is one of our top picks. Here are some items that would pair perfectly with it:`;

        setMessages(prev => [...prev, {
            id: Date.now(),
            text: message,
            sender: 'bot',
            products: recommendations.slice(0, 3)
        }]);
    };

    useEffect(() => {
        eventBus.on(EVENTS.PRODUCT_SELECTED, handleProductSelected);
        return () => eventBus.off(EVENTS.PRODUCT_SELECTED, handleProductSelected);
    }, [allProducts]);

    const ProductMiniCard = ({ product }: { product: Product }) => (
        <div className="min-w-[140px] bg-white rounded-xl border border-gray-100 p-2 shadow-sm hover:border-indigo-100 transition-colors">
            <img src={product.image} alt={product.name} className="w-full h-20 object-cover rounded-lg" />
            <div className="mt-2">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter truncate">{product.brand}</p>
                <p className="text-[11px] font-medium text-gray-800 truncate leading-tight">{product.name}</p>
                <p className="text-xs font-black text-gray-900 mt-1">₹{product.price.toLocaleString()}</p>
                <div className="flex gap-1 mt-2">
                    <button
                        onClick={() => {
                            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                            cart.push({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                quantity: 1
                            });
                            localStorage.setItem('cart', JSON.stringify(cart));
                            
                            const toast = document.createElement('div');
                            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
                            toast.textContent = 'Added to cart!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 2000);
                        }}
                        className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded hover:bg-indigo-700 transition-colors"
                    >
                        <ShoppingCart className="w-3 h-3" />
                    </button>
                    <Link
                        to={`/product/${product.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 text-xs py-1 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                        <Eye className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5">
                    <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6 animate-float" />
                            <div>
                                <h3 className="font-bold text-sm leading-tight">S.A.M.</h3>
                                <p className="text-[10px] text-indigo-200">Style Concierge AI</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 rounded-xl p-2 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-grow p-4 space-y-4 h-[400px] overflow-y-auto bg-gray-50/50">
                        {messages.map(m => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                                {!m.loading && (
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100'
                                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                                        }`}>
                                        {m.text}
                                    </div>
                                )}
                                {m.loading && (
                                    <div className="bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none rounded-2xl p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                )}
                                {m.products && m.products.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 w-full">
                                        {m.products.map(p => (
                                            <ProductMiniCard key={p.id} product={p} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask for styling tips or search products..."
                            className="flex-grow bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all border border-transparent"
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isTyping || !input.trim()}
                            className="bg-indigo-600 p-3 rounded-xl text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-indigo-600 text-white p-5 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-110 transition-all group flex items-center gap-3 active:scale-95"
                >
                    <div className="relative">
                        <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-0 right-0 h-3 w-3 bg-green-400 border-2 border-indigo-600 rounded-full animate-pulse"></span>
                    </div>
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold tracking-tight whitespace-nowrap">
                        Ask S.A.M.
                    </span>
                </button>
            )}
        </div>
    );
};

export default SmartAssistant;
