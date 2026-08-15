import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
    Heart,
    Package,
    HelpCircle,
    Sparkles,
    Camera,
    Clock,
    Trash2,
    LogOut,
    LogIn,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CART_EVENT, getCartCount } from '../utils/cart';
import { WISHLIST_EVENT, getWishlistCount } from '../utils/wishlist';
import { useAuth } from '../context/AuthContext';

// Autocomplete suggestion sources
const SUGGESTION_BRANDS = ['nike', 'adidas', 'zara', 'roadster', 'puma', 'gucci', 'levis', 'h&m'];
const SUGGESTION_CATEGORIES = ['dresses', 'shirts', 't-shirts', 'jeans', 'trousers', 'sneakers', 'handbags', 'watches', 'jackets'];
const SUGGESTION_OCCASIONS = ['wedding', 'party', 'office', 'casual', 'festival', 'travel', 'sports'];
const SUGGESTION_COLORS = ['red', 'blue', 'black', 'white', 'green', 'pink', 'yellow', 'purple'];

const RECENT_SEARCHES_KEY = 'samzone_recent_searches_v1';

const PremiumNavbar: React.FC = () => {
    const { user, signOut } = useAuth();
    const navRef = useRef<HTMLDivElement | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const navigate = useNavigate();

    // State for autocomplete suggestions
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch {
                localStorage.removeItem(RECENT_SEARCHES_KEY);
            }
        }
    }, []);

    // Save recent search helper
    const saveRecentSearch = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        const filtered = recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    // Remove single recent search helper
    const removeRecentSearch = (e: React.MouseEvent, term: string) => {
        e.stopPropagation();
        const updated = recentSearches.filter((s) => s !== term);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    // Update suggestions as user types
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            return;
        }
        const lower = searchQuery.toLowerCase();
        const matches: string[] = [];
        SUGGESTION_BRANDS.forEach((b) => { if (b.startsWith(lower)) matches.push(b); });
        SUGGESTION_CATEGORIES.forEach((c) => { if (c.startsWith(lower)) matches.push(c); });
        SUGGESTION_OCCASIONS.forEach((o) => { if (o.startsWith(lower)) matches.push(o); });
        SUGGESTION_COLORS.forEach((col) => { if (col.startsWith(lower)) matches.push(col); });
        setSuggestions(Array.from(new Set(matches)).slice(0, 6));
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsAccountDropdownOpen(false);
                setIsMobileMenuOpen(false);
                setIsSearchFocused(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        setCartCount(getCartCount());
        setWishlistCount(getWishlistCount());

        const updateCart = () => setCartCount(getCartCount());
        const updateWishlist = () => setWishlistCount(getWishlistCount());
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'cart') updateCart();
            if (e.key === 'wishlist') updateWishlist();
        };

        window.addEventListener(CART_EVENT, updateCart);
        window.addEventListener(WISHLIST_EVENT, updateWishlist);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(CART_EVENT, updateCart);
            window.removeEventListener(WISHLIST_EVENT, updateWishlist);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery.trim());
            navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchFocused(false);
        }
    };

    const handleSelectSuggestion = (term: string) => {
        saveRecentSearch(term);
        setSearchQuery('');
        setSuggestions([]);
        setIsSearchFocused(false);
        navigate(`/shop?q=${encodeURIComponent(term)}`);
    };

    const searchForm = (
        <div className="relative w-full">
            <form
                onSubmit={handleSearchSubmit}
                className="flex items-center w-full bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500 rounded-full border border-slate-200/90 transition-all duration-200 shadow-sm p-1"
            >
                <div className="pl-3.5 pr-1 text-slate-400 shrink-0 flex items-center justify-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands, outfits..."
                    className="w-full bg-transparent px-2 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
                    aria-label="Search products"
                />
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <button
                        type="button"
                        onClick={() => navigate('/visual-search')}
                        title="Style DNA / Visual Search"
                        className="w-10 h-10 rounded-full text-slate-500 hover:text-purple-700 hover:bg-purple-100/80 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                        aria-label="Visual search"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <button
                        type="submit"
                        title="Search"
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow flex items-center justify-center shrink-0 cursor-pointer"
                        aria-label="Submit search"
                    >
                        <Search className="w-4 h-4 text-white" />
                    </button>
                </div>
            </form>

            {/* Dropdown Suggestions & Recent Searches */}
            {isSearchFocused && (suggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto py-2">
                    {/* Live Autocomplete Suggestions */}
                    {suggestions.length > 0 && (
                        <div>
                            <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Suggestions
                            </div>
                            {suggestions.map((s, i) => (
                                <div
                                    key={`sugg_${i}`}
                                    className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer text-sm font-medium transition-colors flex items-center gap-2.5"
                                    onClick={() => handleSelectSuggestion(s)}
                                    role="option"
                                >
                                    <Search className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recent Searches Section */}
                    {!searchQuery.trim() && recentSearches.length > 0 && (
                        <div>
                            <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1 pt-2 flex items-center justify-between">
                                <span>Recent Searches</span>
                            </div>
                            {recentSearches.map((term, index) => (
                                <div
                                    key={`recent_${index}`}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium transition-colors flex items-center justify-between group"
                                    onClick={() => handleSelectSuggestion(term)}
                                >
                                    <div className="flex items-center gap-2.5 text-slate-700 group-hover:text-purple-700">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{term}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => removeRecentSearch(e, term)}
                                        className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"
                                        title="Remove search"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const categories = [
        { name: 'Men', subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Shorts'] },
        { name: 'Women', subcategories: ['Dresses', 'Tops', 'Kurtas', 'Leggings', 'Skirts'] },
        { name: 'Footwear', subcategories: ['Shoes', 'Sandals', 'Sneakers', 'Boots', 'Slippers'] },
        { name: 'Electronics', subcategories: ['Phones', 'Laptops', 'Headphones', 'Smart Watches', 'Accessories'] },
        { name: 'Home', subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Lighting'] },
        { name: 'Accessories', subcategories: ['Bags', 'Watches', 'Belts', 'Sunglasses', 'Jewelry'] },
    ];

    return (
        <header ref={navRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs font-sans">
            {/* Announcement Top Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white text-xs py-1.5 px-4 text-center">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <span className="hidden sm:inline-block font-medium text-slate-300">
                        ⚡ AI-Powered Fashion Discovery & Instant Outfit Stylist
                    </span>
                    <span className="w-full sm:w-auto font-semibold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Free Express Shipping on Orders Over $99 | Easy 30-Day Returns
                    </span>
                </div>
            </div>

            {/* Main Navigation Row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Logo & Branding */}
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 bg-clip-text text-transparent leading-none">
                                    SAMZONE
                                </span>
                                <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase leading-none mt-1">
                                    AI SHOPPING STUDIO
                                </span>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden lg:flex items-center gap-1">
                            <Link
                                to="/shop"
                                className="px-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition"
                            >
                                Catalog
                            </Link>
                            <Link
                                to="/skin-tone"
                                className="px-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition flex items-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                Skin Guide
                            </Link>
                            <Link
                                to="/stylist"
                                className="px-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition flex items-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                Outfit Stylist
                            </Link>
                            <Link
                                to="/style-dna"
                                className="px-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition flex items-center gap-1.5"
                            >
                                Style DNA
                            </Link>
                        </div>
                    </div>

                    {/* Search Form Container */}
                    <div className="hidden md:block flex-1 max-w-2xl">{searchForm}</div>

                    {/* Right User Controls */}
                    <div className="flex items-center gap-2">
                        {/* Account Menu */}
                        <div className="relative">
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsAccountDropdownOpen((open) => !open);
                                }}
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer border border-transparent hover:border-purple-200"
                                aria-expanded={isAccountDropdownOpen}
                                aria-haspopup="menu"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                    {user ? (user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U') : <User className="w-4 h-4" />}
                                </div>
                                <span className="hidden md:block max-w-[120px] truncate">
                                    {user ? `Hi, ${user.fullName ? user.fullName.trim().split(' ')[0] : (user.email ? user.email.split('@')[0] : 'User')}` : 'Account'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 font-sans animate-fade-in">
                                    {user ? (
                                        <>
                                            <div className="px-3 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl mb-1.5 border border-purple-100/80">
                                                <p className="text-xs font-extrabold text-purple-950 truncate">
                                                    {user.fullName || 'SAMZONE User'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                            </div>

                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <User className="w-4 h-4 text-purple-600" />
                                                <span>My Profile</span>
                                            </Link>

                                            <Link
                                                to="/wishlist"
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <Heart className="w-4 h-4 text-pink-600" />
                                                <span>Wishlist</span>
                                            </Link>

                                            <Link
                                                to="/cart"
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                                                <span>Cart</span>
                                            </Link>

                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <HelpCircle className="w-4 h-4 text-emerald-600" />
                                                <span>Settings</span>
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setIsAccountDropdownOpen(false);
                                                    signOut();
                                                }}
                                                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer text-left mt-1 border-t border-slate-100"
                                            >
                                                <LogOut className="w-4 h-4 text-red-500" />
                                                <span>Logout</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm transition mb-1 justify-center"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <LogIn className="w-4 h-4" />
                                                <span>Sign In / Register</span>
                                            </Link>
                                            <Link
                                                to="/help"
                                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                onClick={() => setIsAccountDropdownOpen(false)}
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                                <span>Help & Support</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Wishlist Link */}
                        <Link
                            to="/wishlist"
                            className="relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-purple-700 transition"
                        >
                            <Heart className="w-5 h-5" />
                            <span className="hidden md:block">Wishlist</span>
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white shadow-sm">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart Link */}
                        <Link
                            to="/cart"
                            className="relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-purple-700 transition"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="hidden md:block">Cart</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                setIsMobileMenuOpen((open) => !open);
                            }}
                            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition shrink-0"
                            aria-expanded={isMobileMenuOpen}
                            aria-label="Toggle navigation menu"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search Row */}
            <div className="md:hidden px-4 pb-3">{searchForm}</div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl">
                    <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
                        <Link
                            to="/shop"
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-purple-50 transition"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Catalog
                        </Link>
                        <Link
                            to="/skin-tone"
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-purple-700 hover:bg-purple-50 transition"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Skin Guide
                        </Link>
                        <Link
                            to="/stylist"
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            Outfit Stylist
                        </Link>
                        <Link
                            to="/style-dna"
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-purple-50 transition"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Style DNA
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PremiumNavbar;
