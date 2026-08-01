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
    MapPin,
    HelpCircle,
    Gift,
    Sparkles,
    Camera,
    Dna,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CART_EVENT, getCartCount } from '../utils/cart';
import { WISHLIST_EVENT, getWishlistCount } from '../utils/wishlist';

// Autocomplete suggestion sources
const SUGGESTION_BRANDS = ['nike', 'adidas', 'zara', 'roadster', 'puma', 'gucci'];
const SUGGESTION_CATEGORIES = ['dresses', 'shirts', 'jeans', 'sneakers', 'handbags', 'watches'];
const SUGGESTION_OCCASIONS = ['wedding', 'party', 'office', 'festival', 'travel'];
const SUGGESTION_COLORS = ['red', 'blue', 'black', 'white', 'green', 'pink'];

const PremiumNavbar: React.FC = () => {
    const navRef = useRef<HTMLDivElement | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const navigate = useNavigate();

  // State for autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Update suggestions as user types
  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return; }
    const lower = searchQuery.toLowerCase();
    const matches: string[] = [];
    SUGGESTION_BRANDS.forEach(b => { if (b.startsWith(lower)) matches.push(b); });
    SUGGESTION_CATEGORIES.forEach(c => { if (c.startsWith(lower)) matches.push(c); });
    SUGGESTION_OCCASIONS.forEach(o => { if (o.startsWith(lower)) matches.push(o); });
    SUGGESTION_COLORS.forEach(col => { if (col.startsWith(lower)) matches.push(col); });
    setSuggestions(matches.slice(0, 6));
  }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsAccountDropdownOpen(false);
                setIsMobileMenuOpen(false);
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const searchForm = (
        <div className="relative">
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, brands, and more..."
                    className="input-primary pr-24 pl-12"
                    aria-label="Search products"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => navigate('/visual-search')}
                        title="Search by photo"
                        className="rounded-full p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        aria-label="Visual search"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <button
                        type="submit"
                        title="Search"
                        className="rounded-full p-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        aria-label="Submit search"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </form>
            {suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                    {suggestions.map((s, i) => (
                        <li key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSearchQuery(s); navigate(`/shop?q=${encodeURIComponent(s)}`); setSuggestions([]); }} role="option">{s}</li>
                    ))}
                </ul>
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
        <div ref={navRef} className="bg-white shadow-sm sticky top-0 z-50">
            <div className="hidden sm:block bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>Delivering across India</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4" />
                            <span>Free shipping on orders over ₹500</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Curated AI recommendations</span>
                        </div>
                        <span>Secure payments · Easy returns</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <Link to="/" className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[var(--shadow-soft)] flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">S</span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">SAMZONE</p>
                                    <p className="text-lg font-semibold text-slate-900">AI Shopping Studio</p>
                                </div>
                            </Link>

                            <div className="hidden lg:flex items-center gap-6">
                                <div className="relative group">
                                    <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-purple-700">
                                        All Categories
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-72 rounded-3xl border border-slate-200 bg-white p-4 opacity-0 transition duration-300 group-hover:opacity-100 group-hover:pointer-events-auto shadow-xl">
                                        <div className="grid grid-cols-2 gap-4">
                                            {categories.map((category) => (
                                                <Link
                                                    key={category.name}
                                                    to={`/shop?category=${category.name.toLowerCase()}`}
                                                    className="block rounded-3xl p-4 hover:bg-slate-50 transition"
                                                >
                                                    <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                                                    <p className="mt-2 text-xs text-slate-500">{category.subcategories.slice(0, 3).join(', ')}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {categories.slice(0, 4).map((category) => (
                                    <Link
                                        key={category.name}
                                        to={`/shop?category=${category.name.toLowerCase()}`}
                                        className="text-sm font-medium text-slate-700 hover:text-purple-700 transition"
                                    >
                                        {category.name}
                                    </Link>
                                ))}

                                <Link
                                    to="/skin-tone"
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Skin Guide
                                </Link>

                                <Link
                                    to="/stylist"
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Outfit Stylist
                                </Link>

                                <Link
                                    to="/style-dna"
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition"
                                >
                                    <Dna className="w-4 h-4" />
                                    Style DNA
                                </Link>
                            </div>
                        </div>

                        <div className="hidden md:block flex-1 max-w-2xl">{searchForm}</div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsAccountDropdownOpen((open) => !open);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-700 transition"
                                    aria-expanded={isAccountDropdownOpen}
                                    aria-haspopup="menu"
                                >
                                    <User className="w-5 h-5" />
                                    <span className="hidden md:block">Account</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {isAccountDropdownOpen && (
                                    <div className="absolute right-0 top-full z-20 mt-3 w-52 rounded-3xl border border-slate-200 bg-white shadow-xl">
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2 rounded-3xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <User className="w-4 h-4" />
                                            My Profile
                                        </Link>
                                        <Link
                                            to="/orders"
                                            className="flex items-center gap-2 rounded-3xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <Package className="w-4 h-4" />
                                            Orders
                                        </Link>
                                        <Link
                                            to="/wishlist"
                                            className="flex items-center gap-2 rounded-3xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <Heart className="w-4 h-4" />
                                            Wishlist
                                        </Link>
                                        <Link
                                            to="/help"
                                            className="flex items-center gap-2 rounded-3xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            Help & Support
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link
                                to="/wishlist"
                                className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-700 transition"
                            >
                                <Heart className="w-5 h-5" />
                                <span className="hidden md:block">Wishlist</span>
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                to="/cart"
                                className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-purple-700 transition"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="hidden md:block">Cart</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsMobileMenuOpen((open) => !open);
                                }}
                                className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                aria-expanded={isMobileMenuOpen}
                                aria-label="Toggle navigation menu"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="md:hidden px-4 py-4">{searchForm}</div>
            </div>

            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-slate-200 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="grid gap-4">
                            <Link
                                to="/skin-tone"
                                className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 transition"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Sparkles className="w-4 h-4" />
                                Skin Guide
                            </Link>
                            <Link
                                to="/stylist"
                                className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 transition"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Sparkles className="w-4 h-4" />
                                Outfit Stylist
                            </Link>
                            <Link
                                to="/style-dna"
                                className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 transition"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Dna className="w-4 h-4" />
                                Style DNA
                            </Link>
                            {categories.map((category) => (
                                <div key={category.name}>
                                    <Link
                                        to={`/shop?category=${category.name.toLowerCase()}`}
                                        className="block rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {category.name}
                                    </Link>
                                    <div className="ml-4 mt-2 space-y-1">
                                        {category.subcategories.map((sub) => (
                                            <Link
                                                key={sub}
                                                to={`/shop?subcategory=${sub.toLowerCase()}`}
                                                className="block rounded-3xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 transition"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {sub}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumNavbar;
