import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, Bot, User, Sparkles, ShoppingBag, X, ChevronRight } from 'lucide-react';
import { type Product } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { buildShoppingAssistantReply, createEmptyAssistantContext, explainProduct, type AssistantContext } from '../services/conversationalShoppingAssistant';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isTyping?: boolean;
    products?: Product[];
    productHeading?: string;
}

const QUICK_REPLIES = [
    'Suggest a wedding outfit',
    'Casual shirts under ₹2000',
    'Best sarees for festivals',
    'Office wear for women',
];

const HumanlikeAIChatbot: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [assistantContext, setAssistantContext] = useState<AssistantContext>(createEmptyAssistantContext());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        let rec: any = null;
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            rec = new SpeechRecognition();
            recognitionRef.current = rec;
            rec.continuous = false;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
            };

            rec.onerror = () => {
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };
        }
        return () => {
            if (rec) {
                try {
                    rec.abort();
                } catch (e) {
                    console.error('Speech recognition abort error:', e);
                }
            }
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const simulateStreamingResponse = async (response: string, products: Product[] = [], reasoning: string[] = [], productHeading?: string) => {
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

            await new Promise(resolve => setTimeout(resolve, 25));
        }

        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage) {
                lastMessage.isTyping = false;
                lastMessage.products = products;
                lastMessage.productHeading = productHeading;
                lastMessage.text = response + (reasoning.length > 0 ? `\n\nWhy these picks:\n• ${reasoning.join('\n• ')}` : '');
            }
            return newMessages;
        });

        setIsTyping(false);
    };

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText ?? inputText).trim();
        if (!text || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            isTyping: true,
            products: [],
        };
        setMessages(prev => [...prev, aiMessage]);

        try {
            const assistantReply = await buildShoppingAssistantReply(text, assistantContext);
            const reasoning = assistantReply.products.map((product) => explainProduct(product, assistantReply.context, text, {
                category: assistantReply.context.lastCategory,
                brand: assistantReply.context.lastBrand,
                minPrice: assistantReply.context.lastBudgetMin,
                maxPrice: assistantReply.context.lastBudgetMax,
            }));

            const flattenedReasoning = reasoning.flatMap((entry) => entry).slice(0, 4);
            await simulateStreamingResponse(assistantReply.reply, assistantReply.products, flattenedReasoning, assistantReply.heading);
            setAssistantContext(assistantReply.context);
        } catch (err) {
            await simulateStreamingResponse(
                "Sorry, I hit a snag while narrowing the catalog. I can still help by broadening the search or focusing on a specific brand and price range.",
                []
            );
        }
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

    const handleQuickAction = (text: string) => {
        setInputText(text);
    };

    const FOLLOW_UP_CHIPS = ['Show more like these', 'Under ₹1000', 'Different color'];

    const handleFollowUpChip = (chip: string) => {
        const followUpText = chip === 'Show more like these'
            ? 'Show more like these'
            : chip === 'Under ₹1000'
                ? 'Show cheaper options under ₹1000'
                : 'Show different color options';
        handleSend(followUpText);
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
            isMinimized ? 'w-16 h-16' : 'left-4 sm:left-auto w-auto sm:w-96 h-[600px] max-h-[calc(100vh-2rem)]'
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
                            <>
                                <div className="flex items-center gap-1 text-xs">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span>Online</span>
                                </div>
                                <button
                                    onClick={() => setMessages([])}
                                    className="text-xs underline hover:text-white/80 transition-colors"
                                >
                                    Clear Chat
                                </button>
                            </>
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
                                    <p className="text-gray-600 text-sm mb-4">I can help you find products, suggest outfits, and give fashion advice. What are you looking for?</p>
                                    <div className="flex flex-wrap gap-2 justify-center px-2">
                                        {QUICK_REPLIES.map((reply) => (
                                            <button
                                                key={reply}
                                                onClick={() => handleSend(reply)}
                                                className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message) => (
                                <div key={message.id}>
                                    <div className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
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

                                    {(message.products ?? []).length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-4 mt-2">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4" />
                                                {message.productHeading || 'Recommended Products'}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(message.products ?? []).map((product: any) => (
                                                    <div key={product.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                        <img
                                                            src={getProductImage(product)}
                                                            alt={product.name}
                                                            className="w-full h-20 object-cover rounded mb-2"
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                e.currentTarget.src = PLACEHOLDER;
                                                                e.currentTarget.onerror = null;
                                                            }}
                                                        />
                                                        <h5 className="font-medium text-sm text-gray-900 line-clamp-2">
                                                            {product.name}
                                                        </h5>
                                                        <p className="text-xs text-gray-600">{product.brand || 'Premium pick'}</p>
                                                        <p className="text-sm font-bold text-purple-900">
                                                            ₹{Number(product.price ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                        </p>
                                                        <div className="mt-2 flex gap-2">
                                                            <button
                                                                onClick={() => navigate(`/product/${product.id}`)}
                                                                className="flex-1 text-xs bg-purple-600 text-white py-1 rounded hover:bg-purple-700 transition-colors"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => navigate('/cart')}
                                                                className="text-xs border border-gray-200 text-gray-700 py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                                                            >
                                                                Cart
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 mt-3 flex-wrap">
                                                {FOLLOW_UP_CHIPS.map((chip) => (
                                                    <button
                                                        key={chip}
                                                        onClick={() => handleFollowUpChip(chip)}
                                                        disabled={isTyping}
                                                        className="px-3 py-1 bg-white border border-purple-200 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {chip}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                    onClick={() => handleSend()}
                                    disabled={!inputText.trim() || isTyping}
                                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                    onClick={() => handleQuickAction('Show me kurtas')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    👗 Kurtas
                                </button>
                                <button
                                    onClick={() => handleQuickAction('Outfit ideas for party')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    🎨 Party outfits
                                </button>
                                <button
                                    onClick={() => handleQuickAction('Show me jeans')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    👖 Jeans
                                </button>
                                <button
                                    onClick={() => handleQuickAction('Sarees under ₹2000')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    🥻 Sarees
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
