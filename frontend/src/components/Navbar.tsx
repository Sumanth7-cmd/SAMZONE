import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <nav className="glass-effect sticky top-0 z-50 border-b border-gray-100/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                <img
                                    src="file:///home/rishi/.gemini/antigravity/brain/ddea068b-e842-4889-9787-0972efac6f18/samzone_logo_1770818879096.png"
                                    alt="SAMZONE Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-2xl font-black tracking-tighter gradient-text">SAMZONE</span>
                        </Link>

                        <div className="hidden lg:flex items-center space-x-1">
                            {['Shop', 'Try On', 'Chat'].map((item) => (
                                <Link
                                    key={item}
                                    to={`/${item.toLowerCase().replace(' ', '-')}`}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                                >
                                    {item}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex flex-grow max-w-md items-center px-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search premium fashion..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50/50 border border-gray-200/50 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <Link to="/cart" className="p-3 rounded-2xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all relative group">
                            <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform" />
                            <span className="absolute top-2.5 right-2.5 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 text-[10px] font-bold text-white items-center justify-center">3</span>
                            </span>
                        </Link>
                        <Link to="/profile" className="p-3 rounded-2xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                            <User className="h-6 w-6" />
                        </Link>
                        <div className="lg:hidden ml-2">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="px-4 pt-2 pb-6 space-y-2 border-t border-gray-100 bg-white">
                    {['Shop', 'Try On', 'Chat', 'Cart', 'Profile'].map((item) => (
                        <Link
                            key={item}
                            to={`/${item.toLowerCase().replace(' ', '-')}`}
                            className="block px-4 py-3 rounded-xl text-base font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => setIsOpen(false)}
                        >
                            {item}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
