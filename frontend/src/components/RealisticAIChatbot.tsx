import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User, Sparkles, ShoppingBag, Shirt, Palette, TrendingUp } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    products?: Product[];
    type?: 'text' | 'product-suggestion' | 'outfit-suggestion';
}

interface Intent {
    type: 'search' | 'outfit' | 'general' | 'price' | 'brand' | 'color';
    entities: {
        category?: string;
        color?: string;
        brand?: string;
        price?: string;
        product?: string;
    };
    confidence: number;
}

const RealisticAIChatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const detectIntent = (text: string): Intent => {
        const lowerText = text.toLowerCase();
        
        // Search intent
        if (lowerText.includes('show me') || lowerText.includes('find') || lowerText.includes('search') || 
            lowerText.includes('looking for') || lowerText.includes('want')) {
            return {
                type: 'search',
                entities: extractEntities(lowerText),
                confidence: 0.8
            };
        }
        
        // Outfit intent
        if (lowerText.includes('outfit') || lowerText.includes('wear with') || lowerText.includes('match') || 
            lowerText.includes('suits') || lowerText.includes('goes with')) {
            return {
                type: 'outfit',
                entities: extractEntities(lowerText),
                confidence: 0.8
            };
        }
        
        // Price intent
        if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('how much') || 
            lowerText.includes('cheap') || lowerText.includes('expensive')) {
            return {
                type: 'price',
                entities: extractEntities(lowerText),
                confidence: 0.7
            };
        }
        
        // Brand intent
        if (lowerText.includes('nike') || lowerText.includes('adidas') || lowerText.includes('puma') || 
            lowerText.includes('apple') || lowerText.includes('samsung')) {
            return {
                type: 'brand',
                entities: extractEntities(lowerText),
                confidence: 0.9
            };
        }
        
        // Color intent
        if (lowerText.includes('black') || lowerText.includes('white') || lowerText.includes('red') || 
            lowerText.includes('blue') || lowerText.includes('green') || lowerText.includes('yellow')) {
            return {
                type: 'color',
                entities: extractEntities(lowerText),
                confidence: 0.8
            };
        }
        
        return {
            type: 'general',
            entities: extractEntities(lowerText),
            confidence: 0.5
        };
    };

    const extractEntities = (text: string): Intent['entities'] => {
        const entities: Intent['entities'] = {};
        
        // Colors
        const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'navy', 'olive'];
        const foundColor = colors.find(color => text.includes(color));
        if (foundColor) entities.color = foundColor;
        
        // Categories
        const categories = ['shirt', 'tshirt', 'jeans', 'dress', 'shoes', 'watch', 'laptop', 'phone', 'bag', 'belt'];
        const foundCategory = categories.find(cat => text.includes(cat));
        if (foundCategory) entities.product = foundCategory;
        
        // Brands
        const brands = ['nike', 'adidas', 'puma', 'apple', 'samsung', 'oneplus', 'xiaomi', 'sony', 'boat'];
        const foundBrand = brands.find(brand => text.includes(brand));
        if (foundBrand) entities.brand = foundBrand;
        
        return entities;
    };

    const searchProducts = (entities: Intent['entities']): Product[] => {
        let results = massiveProductCatalog;
        
        if (entities.color) {
            results = results.filter(p => p.colors.some(c => c.toLowerCase().includes(entities.color!)));
        }
        
        if (entities.product) {
            results = results.filter(p => p.name.toLowerCase().includes(entities.product!) || 
                                     p.subcategory.toLowerCase().includes(entities.product!));
        }
        
        if (entities.brand) {
            results = results.filter(p => p.brand.toLowerCase().includes(entities.brand!));
        }
        
        return results.slice(0, 5);
    };

    const generateOutfitSuggestion = (entities: Intent['entities']): string => {
        const { color } = entities;
        
        if (color) {
            const colorMatches: Record<string, string[]> = {
                'black': ['white pants', 'blue jeans', 'gray trousers', 'beige chinos'],
                'white': ['blue jeans', 'black pants', 'navy trousers', 'brown chinos'],
                'blue': ['white shirt', 'beige pants', 'gray trousers', 'khaki shorts'],
                'red': ['black jeans', 'white pants', 'gray trousers', 'navy chinos'],
                'green': ['beige pants', 'white shirt', 'brown jeans', 'khaki trousers'],
                'olive': ['beige pants', 'white shirt', 'brown chinos', 'navy jeans']
            };
            
            const matches = colorMatches[color] || ['neutral colored bottoms'];
            return `Best matches for ${color}:\n\n${matches.map((match, i) => `${i + 1}. ${match}`).join('\n')}\n\nThese combinations create a balanced and stylish look.`;
        }
        
        return "I'd be happy to suggest outfit combinations! Could you tell me what color or item you'd like to match?";
    };

    const generateResponse = async (userMessage: string): Promise<Message> => {
        const intent = detectIntent(userMessage);
        let responseText = '';
        let suggestedProducts: Product[] = [];
        let messageType: Message['type'] = 'text';
        
        switch (intent.type) {
            case 'search':
                suggestedProducts = searchProducts(intent.entities);
                if (suggestedProducts.length > 0) {
                    responseText = `I found ${suggestedProducts.length} products matching your request:\n\n${suggestedProducts.map((p, i) => 
                        `${i + 1}. ${p.name} - ₹${p.price.toLocaleString('en-IN')} (${p.brand})`
                    ).join('\n')}\n\nWould you like more details about any of these?`;
                    messageType = 'product-suggestion';
                } else {
                    responseText = "I couldn't find any products matching your request. Could you try different keywords?";
                }
                break;
                
            case 'outfit':
                responseText = generateOutfitSuggestion(intent.entities);
                messageType = 'outfit-suggestion';
                break;
                
            case 'price':
                suggestedProducts = searchProducts(intent.entities);
                if (suggestedProducts.length > 0) {
                    const prices = suggestedProducts.map(p => p.price);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    responseText = `Price range for your search: ₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}\n\n${suggestedProducts.map((p, i) => 
                        `${i + 1}. ${p.name} - ₹${p.price.toLocaleString('en-IN')}`
                    ).join('\n')}`;
                } else {
                    responseText = "Our products range from ₹500 to ₹50,000. What's your budget range?";
                }
                break;
                
            case 'brand':
                suggestedProducts = searchProducts(intent.entities);
                if (suggestedProducts.length > 0) {
                    responseText = `Here are ${intent.entities.brand} products:\n\n${suggestedProducts.map((p, i) => 
                        `${i + 1}. ${p.name} - ₹${p.price.toLocaleString('en-IN')}`
                    ).join('\n')}`;
                } else {
                    responseText = `I couldn't find any ${intent.entities.brand} products. Would you like to see other brands?`;
                }
                break;
                
            case 'color':
                suggestedProducts = searchProducts(intent.entities);
                if (suggestedProducts.length > 0) {
                    responseText = `${intent.entities.color?.charAt(0).toUpperCase() + intent.entities.color?.slice(1)} products:\n\n${suggestedProducts.map((p, i) => 
                        `${i + 1}. ${p.name} - ₹${p.price.toLocaleString('en-IN')}`
                    ).join('\n')}`;
                } else {
                    responseText = `No ${intent.entities.color} products found. Would you like to see other colors?`;
                }
                break;
                
            case 'general':
                // Handle general conversation
                if (userMessage.toLowerCase().includes('how are you')) {
                    responseText = "I'm doing great! I'm here to help you find the perfect products and create amazing outfits. What can I help you with today?";
                } else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
                    responseText = "Hello! Welcome to SAMZONE! I'm your AI shopping assistant. I can help you find products, suggest outfits, and answer questions about our items. What are you looking for today?";
                } else if (userMessage.toLowerCase().includes('thank')) {
                    responseText = "You're welcome! I'm always here to help. Is there anything else you'd like to know about our products?";
                } else if (userMessage.toLowerCase().includes('bye') || userMessage.toLowerCase().includes('goodbye')) {
                    responseText = "Goodbye! Happy shopping! Feel free to come back anytime you need help finding the perfect items.";
                } else {
                    responseText = "I'm here to help you find products and create outfits! Try asking me about:\n\n• Specific colors (e.g., 'black shirts')\n• Brands (e.g., 'Nike shoes')\n• Outfit suggestions (e.g., 'what goes with blue jeans')\n• Price ranges (e.g., 'shoes under 2000')\n\nWhat would you like to explore?";
                }
                break;
        }
        
        return {
            id: Date.now().toString(),
            text: responseText,
            sender: 'bot',
            timestamp: new Date(),
            products: suggestedProducts,
            type: messageType
        };
    };

    const handleSendMessage = async () => {
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
        
        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const botResponse = await generateResponse(inputText);
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser');
            return;
        }
        
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
        };
        
        recognition.onerror = () => {
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.start();
    };

    const ProductSuggestionCard = ({ product }: { product: Product }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex gap-3">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-gray-600">{product.brand}</p>
                    <p className="text-sm font-bold text-purple-900">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
    );

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
                >
                    <Bot className="w-6 h-6" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        <h3 className="font-bold">SAM AI Assistant</h3>
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <span className="text-xl">×</span>
                    </button>
                </div>
                <p className="text-xs text-purple-200 mt-1">Your personal shopping expert</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                        <p className="text-sm">Hi! I'm SAM, your AI shopping assistant.</p>
                        <p className="text-xs mt-1">Ask me about products, outfits, or prices!</p>
                    </div>
                )}
                
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.sender === 'bot' && (
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-purple-600" />
                            </div>
                        )}
                        
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                message.sender === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-line">{message.text}</p>
                            
                            {message.products && message.products.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {message.products.map((product) => (
                                        <ProductSuggestionCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                            
                            <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        
                        {message.sender === 'user' && (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                    <button
                        onClick={startVoiceInput}
                        disabled={isListening}
                        className={`p-2 rounded-lg transition-colors ${
                            isListening
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about products, outfits, or prices..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isTyping}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500">Try:</span>
                    <button
                        onClick={() => setInputText('black shirts')}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200"
                    >
                        black shirts
                    </button>
                    <button
                        onClick={() => setInputText('what goes with blue jeans')}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200"
                    >
                        outfit ideas
                    </button>
                    <button
                        onClick={() => setInputText('latest Puma shoes')}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200"
                    >
                        brand search
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RealisticAIChatbot;
