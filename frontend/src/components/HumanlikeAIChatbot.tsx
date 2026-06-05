import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Bot, User, Sparkles, ShoppingBag, X } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isTyping?: boolean;
    products?: Product[];
    context?: {
        lastQuery?: string;
        userPreferences?: any;
        conversationHistory?: string[];
    };
}

interface ConversationContext {
    lastQueries: string[];
    userPreferences: {
        preferredColors: string[];
        preferredBrands: string[];
        budgetRange: [number, number];
        style: string;
    };
    currentTopic: string;
    conversationFlow: 'product_search' | 'outfit_advice' | 'general_chat' | 'fashion_help';
}

const HumanlikeAIChatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversationContext, setConversationContext] = useState<ConversationContext>({
        lastQueries: [],
        userPreferences: {
            preferredColors: [],
            preferredBrands: [],
            budgetRange: [0, 10000],
            style: 'casual'
        },
        currentTopic: 'general_chat',
        conversationFlow: 'general_chat'
    });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const detectIntent = (text: string): {
        intent: string;
        entities: any[];
        confidence: number;
        flow: ConversationContext['conversationFlow'];
    } => {
        const lowerText = text.toLowerCase();
        
        // Product search intent
        if (lowerText.includes('show') || lowerText.includes('find') || lowerText.includes('search') || 
            lowerText.includes('looking for') || lowerText.includes('want') || lowerText.includes('need')) {
            return {
                intent: 'product_search',
                entities: extractEntities(text),
                confidence: 0.9,
                flow: 'product_search'
            };
        }
        
        // Outfit advice intent
        if (lowerText.includes('outfit') || lowerText.includes('wear') || lowerText.includes('what should') ||
            lowerText.includes('suggest') || lowerText.includes('recommend') || lowerText.includes('style')) {
            return {
                intent: 'outfit_advice',
                entities: extractEntities(text),
                confidence: 0.85,
                flow: 'fashion_help'
            };
        }
        
        // General chat
        return {
            intent: 'general_chat',
            entities: [],
            confidence: 0.7,
            flow: 'general_chat'
        };
    };

    const extractEntities = (text: string) => {
        const entities = [];
        const lowerText = text.toLowerCase();
        
        // Color extraction
        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'navy', 'beige', 'olive', 'maroon', 'teal', 'orange'];
        colors.forEach(color => {
            if (lowerText.includes(color)) {
                entities.push({ type: 'color', value: color });
            }
        });
        
        // Budget extraction
        const budgetMatch = text.match(/(\d+)/g);
        if (budgetMatch) {
            const budget = parseInt(budgetMatch[0]);
            entities.push({ type: 'budget', value: budget });
        }
        
        // Category extraction
        const categories = ['shirt', 'pants', 'shoes', 'dress', 'jacket', 'watch', 'phone', 'laptop', 'hoodie', 't-shirt', 'jeans', 'sneakers', 'boots', 'handbag', 'accessories'];
        categories.forEach(category => {
            if (lowerText.includes(category)) {
                entities.push({ type: 'category', value: category });
            }
        });
        
        // Brand extraction
        const brands = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'puma', 'reebok', 'gucci', 'prada', 'zara', 'h&m'];
        brands.forEach(brand => {
            if (lowerText.includes(brand)) {
                entities.push({ type: 'brand', value: brand });
            }
        });
        
        // Occasion extraction
        const occasions = ['birthday', 'party', 'date', 'interview', 'formal', 'casual', 'wedding', 'office', 'gym', 'beach', 'dinner'];
        occasions.forEach(occasion => {
            if (lowerText.includes(occasion)) {
                entities.push({ type: 'occasion', value: occasion });
            }
        });
        
        // Style extraction
        const styles = ['modern', 'classic', 'casual', 'formal', 'sporty', 'elegant', 'minimalist', 'vintage', 'streetwear'];
        styles.forEach(style => {
            if (lowerText.includes(style)) {
                entities.push({ type: 'style', value: style });
            }
        });
        
        return entities;
    };

    const generateContextualResponse = useCallback((query: string, intent: any, entities: any[]) => {
        const context = conversationContext;
        let response = '';
        let products: Product[] = [];
        
        switch (intent.intent) {
            case 'product_search':
                products = searchProducts(entities);
                if (context.lastQueries.length > 0) {
                    const lastQuery = context.lastQueries[context.lastQueries.length - 1];
                    if (lastQuery.includes('shirt') && query.includes('pants')) {
                        response = `Since you were looking at shirts earlier, these pants will complement them perfectly! `;
                    } else if (lastQuery.includes('shoes') && query.includes('shirt')) {
                        response = `Great choice! These shirts will match perfectly with the shoes you were looking at. `;
                    }
                }
                
                const budgetEntity = entities.find((e: any) => e.type === 'budget');
                const colorEntity = entities.find((e: any) => e.type === 'color');
                
                if (budgetEntity && colorEntity) {
                    response += `I found ${products.length} ${colorEntity.value} options under ₹${budgetEntity.value}. `;
                } else if (budgetEntity) {
                    response += `I found ${products.length} great options under ₹${budgetEntity.value}. `;
                } else if (colorEntity) {
                    response += `I found ${products.length} ${colorEntity.value} options for you. `;
                } else {
                    response += `I found ${products.length} great options for you. `;
                }
                break;
                
            case 'outfit_advice':
                response = generateOutfitAdvice(entities, context);
                break;
                
            case 'general_chat':
                response = generateGeneralResponse(query, context);
                break;
                
            default:
                response = "I'm here to help you find the perfect products and style advice. What are you looking for today?";
        }
        
        return { response, products };
    }, [conversationContext]);

    const searchProducts = (entities: any[]): Product[] => {
        let filtered = massiveProductCatalog;
        
        entities.forEach(entity => {
            switch (entity.type) {
                case 'color':
                    filtered = filtered.filter(p => 
                        p.colors.some(c => c.toLowerCase().includes(entity.value))
                    );
                    break;
                case 'budget':
                    filtered = filtered.filter(p => p.price <= entity.value);
                    break;
                case 'category':
                    filtered = filtered.filter(p => 
                        p.category.toLowerCase().includes(entity.value) ||
                        p.subcategory.toLowerCase().includes(entity.value)
                    );
                    break;
                case 'brand':
                    filtered = filtered.filter(p => 
                        p.brand.toLowerCase().includes(entity.value)
                    );
                    break;
                case 'style':
                    filtered = filtered.filter(p => 
                        p.description?.toLowerCase().includes(entity.value) ||
                        p.tags?.some(tag => tag.toLowerCase().includes(entity.value))
                    );
                    break;
            }
        });
        
        // Sort by rating and return top results
        return filtered
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 8);
    };

    const generateOutfitAdvice = (_entities: any[], _context: ConversationContext): string => {
        const occasion = _entities.find((e: any) => e.type === 'occasion')?.value || 'casual';
        const colors = _entities.filter((e: any) => e.type === 'color').map((e: any) => e.value);
        const categories = _entities.filter((e: any) => e.type === 'category').map((e: any) => e.value);
        
        let advice = "";
        
        // Birthday party outfit
        if (occasion.includes('birthday') || occasion.includes('party')) {
            advice = "🎉 **Birthday Party Outfit!**\n\nFor a birthday celebration, I'd recommend:\n\n👔 **Top**: A stylish shirt in a bold color or pattern\n👖 **Bottom**: Well-fitted trousers or dark jeans\n👟 **Shoes**: Clean dress shoes or stylish sneakers\n⌚ **Accessories**: A nice watch and maybe a subtle accessory\n\n";
            if (colors.length > 0) {
                advice += `Since you like ${colors.join(' and ')}, I'd suggest incorporating those colors as accents. `;
            }
            advice += "Want me to show you some specific products for this look?";
        }
        // Date outfit
        else if (occasion.includes('date') || occasion.includes('romantic')) {
            advice = "💕 **Date Night Outfit!**\n\nFor a date, you want to look confident but comfortable:\n\n👔 **Top**: A well-fitted shirt or stylish polo\n👖 **Bottom**: Chinos or dark jeans\n👟 **Shoes: Clean leather shoes or nice sneakers\n🧥 **Layer**: A light jacket if it's chilly\n\n";
            if (colors.length > 0) {
                advice += `${colors[0].charAt(0).toUpperCase() + colors[0].slice(1)} is a great choice for dates - it shows confidence! `;
            }
            advice += "Shall I find some perfect date outfit pieces for you?";
        }
        // Interview outfit
        else if (occasion.includes('interview') || occasion.includes('formal') || occasion.includes('professional')) {
            advice = "💼 **Professional Interview Outfit!**\n\nFor interviews, you want to look polished and professional:\n\n👔 **Top**: A crisp, well-ironed shirt in white or light blue\n👖 **Bottom**: Formal trousers in navy, black, or gray\n👟 **Shoes**: Clean, polished dress shoes\n👔 **Tie**: A conservative tie that complements your shirt\n\n";
            advice += "The key is looking neat and confident. Would you like me to show you some professional options?";
        }
        // Casual outfit
        else {
            advice = `🌟 **${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Outfit!**\n\nFor a ${occasion} look, I'd recommend:\n\n👔 **Top**: A comfortable yet stylish top\n👖 **Bottom**: Versatile bottoms that match well\n👟 **Shoes**: Comfortable footwear for the occasion\n\n`;
            if (colors.length > 0) {
                advice += `With ${colors.join(' and ')}, you have great color options to work with! `;
            }
            if (categories.length > 0) {
                advice += `I can help you find specific ${categories.join(' and ')} items. `;
            }
            advice += "Would you like me to suggest some products?";
        }
        
        return advice;
    };

    const generateGeneralResponse = (_query: string, _context: ConversationContext): string => {
        const lowerQuery = _query.toLowerCase();
        
        // Greeting responses
        if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('hey')) {
            const greetings = [
                "Hello! 👋 Welcome to SAMZONE! I'm S.A.M., your Smart Assistant for Modern Shopping. How can I help you today?",
                "Hey there! Great to see you! I'm here to help you find amazing products and give fashion advice. What are you looking for?",
                "Hi! Welcome to SAMZONE! I can help you discover products, create outfits, and get style recommendations. What's on your mind?"
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // AI and technology questions
        if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence') || lowerQuery.includes('technology')) {
            return "That's a fascinating topic! AI is transforming how we shop by providing personalized recommendations and virtual try-on experiences. Here at SAMZONE, we use AI to help you find the perfect products and create amazing outfits. Would you like to see some AI-powered features in action?";
        }
        
        // Fashion questions
        if (lowerQuery.includes('fashion') || lowerQuery.includes('style') || lowerQuery.includes('trend')) {
            return "Fashion is all about expressing yourself! Current trends include sustainable materials, minimalist designs, and bold colors. I can help you discover trending products and create stylish outfits. What's your personal style like?";
        }
        
        // Help questions
        if (lowerQuery.includes('help') || lowerQuery.includes('what can you do') || lowerQuery.includes('features')) {
            return "I'm here to help you with:\n\n🛍️ **Product Discovery**: Search for products by color, brand, budget, or category\n👔 **Outfit Recommendations**: Get complete outfit suggestions for any occasion\n🎨 **Style Advice**: Personalized fashion tips based on your preferences\n📷 **Virtual Try-On**: See how products look on you\n🎤 **Voice Shopping**: Use voice commands to shop hands-free\n\nWhat would you like to explore first?";
        }
        
        // Default conversational responses
        const responses = [
            "That's interesting! While I specialize in fashion and shopping, I'd be happy to help you discover amazing products. Are you looking for anything specific today?",
            "I appreciate your question! My expertise is in fashion, products, and styling advice. What can I help you find?",
            "Great to chat with you! I'm here to help you discover amazing products and create perfect outfits. What catches your eye?",
            "Thanks for sharing that! Let me help you find something amazing. What type of products are you interested in?",
            "I understand! I'm focused on helping you find the perfect items and outfits. What would you like to explore?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    };

    const simulateStreamingResponse = async (response: string, products: Product[] = []) => {
        const words = response.split(' ');
        let currentText = '';
        
        setIsTyping(true);
        
        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isTyping) {
                    lastMessage.text = currentText;
                }
                return newMessages;
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        setIsTyping(false);
        
        // Add products if any
        if (products.length > 0) {
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage) {
                    lastMessage.products = products;
                    lastMessage.isTyping = false;
                }
                return newMessages;
            });
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Update context
        const intent = detectIntent(inputText);
        setConversationContext(prev => ({
            ...prev,
            lastQueries: [...prev.lastQueries, inputText].slice(-5),
            currentTopic: intent.intent,
            conversationFlow: intent.flow
        }));
        
        // Generate and stream AI response
        const { response, products } = generateContextualResponse(inputText, intent, intent.entities);
        
        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            isTyping: true,
            products: []
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setInputText('');
        
        await simulateStreamingResponse(response, products);
    };

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
            isMinimized ? 'w-16 h-16' : 'w-96 h-[600px]'
        }`}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <span className={`font-semibold ${isMinimized ? 'hidden' : ''}`}>SAM AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isMinimized && (
                            <div className="flex items-center gap-1 text-xs">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Online</span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            {isMinimized ? <Sparkles className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bot className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Hello! I'm SAM AI</h3>
                                    <p className="text-gray-600 text-sm">I can help you find products, suggest outfits, and give fashion advice. What are you looking for?</p>
                                </div>
                            )}
                            
                            {messages.map((message) => (
                                <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            message.sender === 'user' 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-3 rounded-lg ${
                                            message.sender === 'user' 
                                                ? 'bg-purple-600 text-white rounded-br-none' 
                                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                        }`}>
                                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                            {message.isTyping && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Product Suggestions */}
                            {messages.map((message) => (
                                message.products && message.products.length > 0 && (
                                    <div key={`products-${message.id}`} className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4" />
                                            Recommended Products
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {message.products.map((product) => (
                                                <div key={product.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <img src={product.image} alt={product.name} className="w-full h-20 object-cover rounded mb-2" />
                                                    <h5 className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</h5>
                                                    <p className="text-xs text-gray-600">{product.brand}</p>
                                                    <p className="text-sm font-bold text-purple-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything about products, fashion, or style..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    disabled={isTyping}
                                />
                                
                                <button
                                    onClick={toggleVoiceInput}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isListening 
                                            ? 'bg-red-500 text-white hover:bg-red-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    disabled={!recognitionRef.current}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || isTyping}
                                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-3">
                                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors">
                                    🛍️ Show me shirts
                                </button>
                                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors">
                                    🎨 Outfit ideas
                                </button>
                                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors">
                                    💰 Under ₹2000
                                </button>
                                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors">
                                    🎉 Party wear
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HumanlikeAIChatbot;
