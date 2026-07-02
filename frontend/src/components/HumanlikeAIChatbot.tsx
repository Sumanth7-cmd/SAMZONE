import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, Bot, User, Sparkles, ShoppingBag, X } from 'lucide-react';
import { productApi, USD_TO_INR_RATE, type Product } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isTyping?: boolean;
    products?: Product[];
}

const GREETINGS = ['hi', 'hello', 'hey', 'how are you', 'how r u', 'thanks', 'thank you'];

const GREETING_RESPONSES = [
    "Hello! 👋 Welcome to SAMZONE! I'm S.A.M., your Smart Assistant for Modern Shopping. How can I help you today?",
    "Hey there! Great to see you! I'm here to help you find amazing products and give fashion advice. What are you looking for?",
    "Hi! Welcome to SAMZONE! I can help you discover products, create outfits, and get style recommendations. What's on your mind?",
];

const QUICK_REPLIES = [
    'Show me laptops under ₹50,000',
    'Suggest a wedding outfit',
    'Best Samsung phones',
    'Casual shirts under ₹1000',
];

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

const HumanlikeAIChatbot: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

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

            await new Promise(resolve => setTimeout(resolve, 30));
        }

        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage) {
                lastMessage.isTyping = false;
                lastMessage.products = products;
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

        const lower = text.toLowerCase();
        if (GREETINGS.some(g => lower.includes(g))) {
            const greeting = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
            await simulateStreamingResponse(greeting, []);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();
            const rawProducts: any[] = data?.products ?? [];
            let products: Product[] = rawProducts.map((p) => ({
                ...p,
                price: (p.price ?? 0) * USD_TO_INR_RATE,
            }));
            let reply: string;

            if (products.length > 0) {
                reply = `I found ${products.length} products for you! 🛍️`;
            } else {
                reply = "I couldn't find exact matches. Here are some popular items:";
                try {
                    const popular = await productApi.getProducts(0, 12, {
                        sortBy: 'rating',
                        sortDir: 'desc',
                    });
                    products = [...popular.content].sort(() => Math.random() - 0.5).slice(0, 3);
                } catch {
                    // leave products empty if the popular-items fallback also fails
                }
            }

            await simulateStreamingResponse(reply, products);
        } catch (err) {
            await simulateStreamingResponse(
                "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
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
                                                Recommended Products
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
                                                        <h5 className="font-medium text-sm text-gray-900 line-clamp-1">
                                                            {product.name?.slice(0, 25)}
                                                        </h5>
                                                        <p className="text-xs text-gray-600">{product.brand}</p>
                                                        <p className="text-sm font-bold text-purple-900">
                                                            ₹{Number(product.price ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                        </p>
                                                        <button
                                                            onClick={() => navigate(`/product/${product.id}`)}
                                                            className="mt-2 w-full text-xs bg-purple-600 text-white py-1 rounded hover:bg-purple-700 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </div>
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
                                    onClick={() => handleQuickAction('Show me shirts')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    🛍️ Show me shirts
                                </button>
                                <button
                                    onClick={() => handleQuickAction('Outfit ideas')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    🎨 Outfit ideas
                                </button>
                                <button
                                    onClick={() => handleQuickAction('Show me laptops')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
                                    💻 Laptops
                                </button>
                                <button
                                    onClick={() => handleQuickAction('Party wear')}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                                >
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
