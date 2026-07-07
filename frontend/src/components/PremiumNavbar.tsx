import React, { useState, useEffect } from 'react';
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
    Camera
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CART_EVENT, getCartCount } from '../utils/cart';
import { WISHLIST_EVENT, getWishlistCount } from '../utils/wishlist';

const PremiumNavbar: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const navigate = useNavigate();

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setIsAccountDropdownOpen(false);
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
        <form onSubmit={handleSearch} className="relative">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands, and more..."
                className="w-full px-4 py-2 pl-10 pr-28 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => navigate('/visual-search')}
                    title="Search by photo"
                    className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors"
                >
                    <Camera className="w-5 h-5" />
                </button>
                <button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-1 rounded transition-colors"
                >
                    Search
                </button>
            </div>
        </form>
    );

    const categories = [
        { name: 'Men', subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Shorts'] },
        { name: 'Women', subcategories: ['Dresses', 'Tops', 'Kurtas', 'Leggings', 'Skirts'] },
        { name: 'Footwear', subcategories: ['Shoes', 'Sandals', 'Sneakers', 'Boots', 'Slippers'] },
        { name: 'Electronics', subcategories: ['Phones', 'Laptops', 'Headphones', 'Smart Watches', 'Accessories'] },
        { name: 'Home', subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Lighting'] },
        { name: 'Accessories', subcategories: ['Bags', 'Watches', 'Belts', 'Sunglasses', 'Jewelry'] }
    ];

    return (
        <div className="bg-white shadow-sm sticky top-0 z-40">
            {/* Top Banner (hidden on narrow screens — the three text groups don't wrap and overflow below sm) */}
            <div className="hidden sm:block bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>Deliver to: Mumbai 400001</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4" />
                            <span>Free delivery on orders above ₹500</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span>AI-powered recommendations</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">S</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">SAMZONE</span>
                            </Link>

                            {/* Desktop Categories */}
                            <div className="hidden lg:flex items-center gap-6">
                                <div className="relative group">
                                    <button className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition-colors py-2">
                                        All Categories
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        {categories.map((category) => (
                                            <div key={category.name} className="border-b border-gray-100 last:border-b-0">
                                                <Link
                                                    to={`/shop?category=${category.name.toLowerCase()}`}
                                                    className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                                                >
                                                    <div className="font-medium text-gray-900">{category.name}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {category.subcategories.slice(0, 3).join(', ')}
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {categories.slice(0, 4).map((category) => (
                                    <Link
                                        key={category.name}
                                        to={`/shop?category=${category.name.toLowerCase()}`}
                                        className="text-gray-700 hover:text-purple-600 transition-colors py-2"
                                    >
                                        {category.name}
                                    </Link>
                                ))}

                                <Link
                                    to="/skin-tone"
                                    className="flex items-center gap-1 text-purple-700 font-medium hover:text-purple-900 transition-colors py-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Skin Guide
                                </Link>
                            </div>
                        </div>

                        {/* Search Bar (desktop/tablet only — a compact version renders below on mobile) */}
                        <div className="hidden md:block flex-1 max-w-2xl mx-8">
                            {searchForm}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            {/* Account Dropdown */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                                    className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                    <span className="hidden md:block">Account</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                
                                {isAccountDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2 px-4 py-3 hover:bg-purple-50 transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            <span>My Profile</span>
                                        </Link>
                                        <Link
                                            to="/orders"
                                            className="flex items-center gap-2 px-4 py-3 hover:bg-purple-50 transition-colors"
                                        >
                                            <Package className="w-4 h-4" />
                                            <span>Orders</span>
                                        </Link>
                                        <Link
                                            to="/wishlist"
                                            className="flex items-center gap-2 px-4 py-3 hover:bg-purple-50 transition-colors"
                                        >
                                            <Heart className="w-4 h-4" />
                                            <span>Wishlist</span>
                                        </Link>
                                        <Link
                                            to="/help"
                                            className="flex items-center gap-2 px-4 py-3 hover:bg-purple-50 transition-colors"
                                        >
                                            <HelpCircle className="w-4 h-4" />
                                            <span>Help & Support</span>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Wishlist */}
                            <Link
                                to="/wishlist"
                                className="relative flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                            >
                                <Heart className="w-5 h-5" />
                                <span className="hidden md:block">Wishlist</span>
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="hidden md:block">Cart</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Search Bar (mobile only) */}
                <div className="md:hidden px-4 pb-3">
                    {searchForm}
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-200">
                    <div className="px-4 py-4">
                        <div className="space-y-4">
                            <Link
                                to="/skin-tone"
                                className="flex items-center gap-2 font-medium text-purple-700 py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Sparkles className="w-4 h-4" />
                                Skin Guide
                            </Link>
                            {categories.map((category) => (
                                <div key={category.name}>
                                    <Link
                                        to={`/shop?category=${category.name.toLowerCase()}`}
                                        className="block font-medium text-gray-900 py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {category.name}
                                    </Link>
                                    <div className="pl-4 space-y-1">
                                        {category.subcategories.map((sub) => (
                                            <Link
                                                key={sub}
                                                to={`/shop?subcategory=${sub.toLowerCase()}`}
                                                className="block text-sm text-gray-600 py-1"
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
