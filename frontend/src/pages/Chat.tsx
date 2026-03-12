import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Hello! I'm S.A.M., your Smart Assistant for Modern Shopping. How can I help you find the perfect outfit today?",
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: messages.length + 1,
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Simulate bot response
        setTimeout(() => {
            const botResponse = generateBotResponse(inputText);
            const botMessage: Message = {
                id: messages.length + 2,
                text: botResponse,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000);
    };

    const generateBotResponse = (userInput: string): string => {
        const input = userInput.toLowerCase();

        if (input.includes('jacket') || input.includes('coat')) {
            return "I'd recommend our collection of jackets! We have denim jackets, leather jackets, and bomber jackets. What style are you looking for?";
        } else if (input.includes('dress') || input.includes('formal')) {
            return "We have a beautiful selection of dresses for various occasions. Are you looking for something casual, formal, or party wear?";
        } else if (input.includes('price') || input.includes('budget')) {
            return "Our products range from $20 to $200. What's your budget range, and I can show you the best options?";
        } else if (input.includes('size')) {
            return "We offer sizes from XS to XXL. You can also use our Virtual Try-On feature to see how items will look on you!";
        } else if (input.includes('color')) {
            return "We have products in various colors including black, white, blue, red, and more. What color are you interested in?";
        } else {
            return "I can help you find products, check sizes, compare prices, or provide styling suggestions. What would you like to know more about?";
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
                    {/* Header */}
                    <div className="bg-indigo-600 text-white p-6">
                        <div className="flex items-center">
                            <Bot className="w-8 h-8 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold">S.A.M.</h1>
                                <p className="text-indigo-100 text-sm">Smart Assistant for Modern Shopping</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(100% - 180px)' }}>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`flex items-start max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                                        }`}
                                >
                                    <div
                                        className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'
                                            }`}
                                    >
                                        {message.sender === 'user' ? (
                                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            className={`rounded-lg p-3 ${message.sender === 'user'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{message.text}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {message.timestamp.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t p-4 bg-gray-50">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
