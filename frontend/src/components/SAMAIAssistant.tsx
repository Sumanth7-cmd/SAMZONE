import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, X, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import { realisticProducts, type Product } from '../data/realisticProducts';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'sam';
    timestamp: Date;
    products?: Product[];
    outfit?: Product[];
    type?: 'text' | 'product-suggestion' | 'outfit' | 'general';
}

interface ConversationContext {
    lastProductCategory?: string;
    lastPriceRange?: { min: number; max: number };
    lastColor?: string;
    lastStyle?: string;
    userPreferences?: {
        favoriteColors: string[];
        preferredStyles: string[];
        budgetRange: { min: number; max: number };
    };
}

const SAMAIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [context, setContext] = useState<ConversationContext>({});
    
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

    // Intent detection
    const detectIntent = (text: string): string => {
        const lowerText = text.toLowerCase();
        
        // Greeting patterns
        if (lowerText.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
            return 'greeting';
        }
        
        // Product search patterns
        if (lowerText.match(/show|find|search|looking for|want|need/) && 
            lowerText.match(/shirt|pants|shoes|watch|accessories|gadgets/)) {
            return 'product-search';
        }
        
        // Price-based search
        if (lowerText.match(/under|below|less than|cheaper|budget|price/)) {
            return 'price-search';
        }
        
        // Color-based search
        if (lowerText.match(/black|white|blue|red|green|gray|brown|navy|beige|olive/)) {
            return 'color-search';
        }
        
        // Outfit request
        if (lowerText.match(/outfit|suggest|complete|combine|what goes with|what suits/)) {
            return 'outfit-request';
        }
        
        // Style advice
        if (lowerText.match(/style|fashion|wear|how to|what should/)) {
            return 'style-advice';
        }
        
        // General conversation
        if (lowerText.match(/how are you|who are you|what can you do|help|thanks|thank you/)) {
            return 'general';
        }
        
        // Default to product search
        return 'product-search';
    };

    // Extract entities from user message
    const extractEntities = (text: string): any => {
        const entities: any = {};
        const lowerText = text.toLowerCase();
        
        // Extract price
        const priceMatch = lowerText.match(/(\d+)/);
        if (priceMatch) {
            entities.price = parseInt(priceMatch[1]);
        }
        
        // Extract colors
        const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'brown', 'navy', 'beige', 'olive'];
        colors.forEach(color => {
            if (lowerText.includes(color)) {
                entities.color = color;
            }
        });
        
        // Extract categories
        const categories = ['shirts', 'pants', 'shoes', 'watches', 'accessories', 'gadgets'];
        categories.forEach(category => {
            if (lowerText.includes(category.slice(0, -1))) { // Remove 's' for singular
                entities.category = category;
            }
        });
        
        // Extract styles
        const styles = ['casual', 'formal', 'sport', 'streetwear', 'outdoor', 'luxury'];
        styles.forEach(style => {
            if (lowerText.includes(style)) {
                entities.style = style;
            }
        });
        
        return entities;
    };

    // Generate AI response based on intent and entities
    const generateAIResponse = useCallback(async (userMessage: string, intent: string, entities: any): Promise<Message> => {
        const response: Message = {
            id: Date.now().toString(),
            text: '',
            sender: 'sam',
            timestamp: new Date(),
            type: 'text'
        };

        switch (intent) {
            case 'greeting':
                response.text = generateGreetingResponse();
                break;
                
            case 'product-search':
                const products = searchProducts(entities);
                response.products = products;
                response.text = generateProductResponse(products, entities);
                response.type = 'product-suggestion';
                break;
                
            case 'price-search':
                const priceProducts = searchByPrice(entities.price);
                response.products = priceProducts;
                response.text = generatePriceResponse(priceProducts, entities.price);
                response.type = 'product-suggestion';
                break;
                
            case 'color-search':
                const colorProducts = searchByColor(entities.color);
                response.products = colorProducts;
                response.text = generateColorResponse(colorProducts, entities.color);
                response.type = 'product-suggestion';
                break;
                
            case 'outfit-request':
                const outfit = generateOutfit(entities);
                response.outfit = outfit;
                response.text = generateOutfitResponse(outfit);
                response.type = 'outfit';
                break;
                
            case 'style-advice':
                response.text = generateStyleAdvice(entities);
                break;
                
            case 'general':
                response.text = generateGeneralResponse(userMessage);
                break;
                
            default:
                response.text = generateFallbackResponse();
        }

        // Update context
        setContext(prev => ({
            ...prev,
            lastProductCategory: entities.category || prev.lastProductCategory,
            lastPriceRange: entities.price ? { min: 0, max: entities.price } : prev.lastPriceRange,
            lastColor: entities.color || prev.lastColor,
            lastStyle: entities.style || prev.lastStyle
        }));

        return response;
    }, []);

    // Response generators
    const generateGreetingResponse = (): string => {
        const greetings = [
            "Hello! I'm S.A.M., your AI shopping assistant. How can I help you find the perfect outfit today?",
            "Hi there! I'm here to help you with fashion advice and product recommendations. What are you looking for?",
            "Hey! Ready to upgrade your style? I can help you find products, create outfits, and give fashion advice!",
            "Good day! I'm S.A.M., your personal AI stylist. What can I assist you with today?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    };

    const generateProductResponse = (products: Product[], entities: any): string => {
        if (products.length === 0) {
            return `I couldn't find any products matching your criteria. Would you like me to search with different filters?`;
        }
        
        const topProducts = products.slice(0, 3);
        let response = `I found some great options for you:\n\n`;
        
        topProducts.forEach((product, index) => {
            response += `${index + 1}. ${product.name} - ₹${product.price.toLocaleString('en-IN')}\n`;
            response += `   ${product.brand} • ${product.style} • Rating: ${product.rating}/5\n\n`;
        });
        
        response += `Would you like me to suggest an outfit with any of these, or would you like to see more options?`;
        return response;
    };

    const generatePriceResponse = (products: Product[], maxPrice: number): string => {
        if (products.length === 0) {
            return `I couldn't find any products under ₹${maxPrice.toLocaleString('en-IN')}. Would you like to increase your budget?`;
        }
        
        const topProducts = products.slice(0, 3);
        let response = `Here are some great options under ₹${maxPrice.toLocaleString('en-IN')}:\n\n`;
        
        topProducts.forEach((product, index) => {
            response += `${index + 1}. ${product.name} - ₹${product.price.toLocaleString('en-IN')}\n`;
            response += `   ${product.brand} • ${product.style} • Rating: ${product.rating}/5\n\n`;
        });
        
        response += `These are perfect for your budget! Would you like more details on any of these?`;
        return response;
    };

    const generateColorResponse = (products: Product[], color: string): string => {
        if (products.length === 0) {
            return `I couldn't find any ${color} products. Would you like me to search for a different color?`;
        }
        
        const topProducts = products.slice(0, 3);
        let response = `Here are some stylish ${color} options:\n\n`;
        
        topProducts.forEach((product, index) => {
            response += `${index + 1}. ${product.name} - ₹${product.price.toLocaleString('en-IN')}\n`;
            response += `   ${product.brand} • ${product.style} • Rating: ${product.rating}/5\n\n`;
        });
        
        response += `${color.charAt(0).toUpperCase() + color.slice(1)} is a great choice! Would you like me to create an outfit around this?`;
        return response;
    };

    const generateOutfitResponse = (outfit: Product[]): string => {
        if (outfit.length === 0) {
            return "I couldn't create a complete outfit. Would you like to specify preferences for style or occasion?";
        }
        
        let response = `Here's a complete outfit I've put together for you:\n\n`;
        let totalPrice = 0;
        
        outfit.forEach((item) => {
            const category = item.category.charAt(0).toUpperCase() + item.category.slice(1, -1);
            response += `${category}: ${item.name} - ₹${item.price.toLocaleString('en-IN')}\n`;
            totalPrice += item.price;
        });
        
        response += `\nTotal: ₹${totalPrice.toLocaleString('en-IN')}\n\n`;
        response += `This combination creates a balanced and stylish look. The colors and styles complement each other perfectly!`;
        
        return response;
    };

    const generateStyleAdvice = (entities: any): string => {
        const advice = [
            "For a professional look, I recommend pairing formal pieces with subtle accessories. Navy and gray are timeless colors that work well in business settings.",
            "Casual style is all about comfort and self-expression. Mix and match different textures and don't be afraid to experiment with colors!",
            "When building a capsule wardrobe, start with versatile basics in neutral colors, then add statement pieces that reflect your personality.",
            "The key to great style is fit. Make sure your clothes fit well - you can always get items tailored for a perfect look.",
            "Layering is essential for creating depth in your outfits. Start with lighter pieces and add heavier layers for dimension."
        ];
        
        return advice[Math.floor(Math.random() * advice.length)];
    };

    const generateGeneralResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('how are you')) {
            return "I'm doing great, thanks for asking! I'm excited to help you find amazing products and create stylish outfits. How about you?";
        }
        
        if (lowerMessage.includes('who are you')) {
            return "I'm S.A.M. (Style & Shopping AI Assistant), your personal AI fashion consultant. I can help you find products, create outfits, give style advice, and much more!";
        }
        
        if (lowerMessage.includes('what can you do')) {
            return "I can help you with:\n• Find products that match your style and budget\n• Create complete outfits\n• Give fashion and style advice\n• Search by color, price, or category\n• Provide product recommendations\n• Answer general fashion questions\n\nWhat would you like to explore?";
        }
        
        if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
            return "You're very welcome! I'm always here to help with your fashion needs. Is there anything else I can assist you with?";
        }
        
        return "That's interesting! While I specialize in fashion and shopping, I'm here to help. Could you tell me more about what you're looking for?";
    };

    const generateFallbackResponse = (): string => {
        return "I'm not sure I understood that. Could you try rephrasing? You can ask me to find products, create outfits, or give style advice!";
    };

    // Product search functions
    const searchProducts = (entities: any): Product[] => {
        let filtered = realisticProducts;
        
        if (entities.category) {
            filtered = filtered.filter(p => p.category === entities.category);
        }
        
        if (entities.color) {
            filtered = filtered.filter(p => 
                p.colors.some(c => c.toLowerCase() === entities.color.toLowerCase())
            );
        }
        
        if (entities.style) {
            filtered = filtered.filter(p => p.style === entities.style);
        }
        
        if (entities.price) {
            filtered = filtered.filter(p => p.price <= entities.price);
        }
        
        return filtered.sort((a, b) => b.rating - a.rating);
    };

    const searchByPrice = (maxPrice: number): Product[] => {
        return realisticProducts
            .filter(p => p.price <= maxPrice)
            .sort((a, b) => b.rating - a.rating);
    };

    const searchByColor = (color: string): Product[] => {
        return realisticProducts
            .filter(p => p.colors.some(c => c.toLowerCase() === color.toLowerCase()))
            .sort((a, b) => b.rating - a.rating);
    };

    const generateOutfit = (entities: any): Product[] => {
        const outfit: Product[] = [];
        const categories = ['shirts', 'pants', 'shoes', 'accessories'];
        
        categories.forEach(category => {
            let categoryProducts = realisticProducts.filter(p => p.category === category);
            
            // Apply filters if provided
            if (entities.color) {
                categoryProducts = categoryProducts.filter(p => 
                    p.colors.some(c => c.toLowerCase() === entities.color.toLowerCase())
                );
            }
            
            if (entities.style) {
                categoryProducts = categoryProducts.filter(p => p.style === entities.style);
            }
            
            if (entities.price) {
                categoryProducts = categoryProducts.filter(p => p.price <= entities.price / 4);
            }
            
            // Select top rated product
            if (categoryProducts.length > 0) {
                outfit.push(categoryProducts[0]);
            }
        });
        
        return outfit;
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
        const intent = detectIntent(inputText);
        const entities = extractEntities(inputText);
        
        // Generate AI response
        setTimeout(async () => {
            try {
                const aiResponse = await generateAIResponse(inputText, intent, entities);
                setMessages(prev => [...prev, aiResponse]);
            } catch (error) {
                console.error('Error generating AI response:', error);
                const fallbackResponse: Message = {
                    id: Date.now().toString(),
                    text: "I'm having trouble responding right now. Please try again!",
                    sender: 'sam',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, fallbackResponse]);
            } finally {
                setIsTyping(false);
            }
        }, 1000);
    }, [inputText, generateAIResponse]);

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Product card component
    const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
        const hasDiscount = product.discount && product.discount > 0;
        const discountedPrice = hasDiscount ? product.price * (1 - (product.discount || 0) / 100) : product.price;

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex gap-3">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
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
                            <span className="text-xs text-gray-600">{product.rating}</span>
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
                    isMinimized ? 'w-80 h-12' : 'w-96 h-[600px]'
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
                                <p className="text-xs opacity-90">Your personal fashion consultant</p>
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
                            <div className="h-[450px] overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 && (
                                    <div className="text-center py-8">
                                        <Bot className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                                        <h3 className="font-semibold text-gray-900 mb-2">Hello! I'm S.A.M.</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Your AI fashion consultant. I can help you find products, create outfits, and give style advice!
                                        </p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <button
                                                onClick={() => setInputText("Show me shirts under 2000")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                🎯 Shirts under ₹2000
                                            </button>
                                            <button
                                                onClick={() => setInputText("Suggest an outfit")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                👔 Suggest outfit
                                            </button>
                                            <button
                                                onClick={() => setInputText("What goes with black shoes?")}
                                                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                            >
                                                🤔 Style advice
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
                                            
                                            {/* Product suggestions */}
                                            {message.products && message.products.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {message.products.slice(0, 3).map((product) => (
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
                                        placeholder="Ask me anything about fashion..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default SAMAIAssistant;
