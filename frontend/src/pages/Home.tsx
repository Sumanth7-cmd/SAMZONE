import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShoppingBag, Zap, Star, Camera } from 'lucide-react';
import { getRecommendations } from '../services/recommendationService';
import { productApi } from '../services/api';
import type { Product } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';

const OCCASIONS = [
    { emoji: '💒', label: 'Wedding', query: 'wedding', gradient: 'from-rose-500 to-pink-600' },
    { emoji: '🎂', label: 'Birthday Party', query: 'birthday', gradient: 'from-amber-500 to-orange-600' },
    { emoji: '💼', label: 'Office', query: 'office', gradient: 'from-slate-600 to-slate-800' },
    { emoji: '🎓', label: 'College', query: 'college', gradient: 'from-blue-500 to-indigo-600' },
    { emoji: '🪔', label: 'Festival', query: 'festival', gradient: 'from-fuchsia-500 to-purple-600' },
    { emoji: '✈️', label: 'Travel', query: 'travel', gradient: 'from-teal-500 to-cyan-600' },
];

const ScrollProductCard: React.FC<{ product: Product; badge: React.ReactNode; onClick: () => void }> = ({ product, badge, onClick }) => {
    const hasDiscount = (product.discount ?? 0) > 0 && product.originalPrice;

    return (
        <div
            onClick={onClick}
            className="relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden cursor-pointer flex flex-col flex-shrink-0 w-56"
        >
            {badge}
            <img
                src={getProductImage(product)}
                alt={product.name}
                className="w-full h-48 object-cover"
                loading="lazy"
                onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                    e.currentTarget.onerror = null;
                }}
            />
            <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-gray-500 uppercase mb-1 truncate">{product.brand}</p>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        {hasDiscount ? (
                            <>
                                <span className="text-lg font-bold text-green-600">
                                    ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                    ₹{product.originalPrice!.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-bold text-gray-900">
                                ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                        )}
                    </div>
                    {(product.rating ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            {product.rating.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(true);
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [loadingBestsellers, setLoadingBestsellers] = useState(true);
    const [deals, setDeals] = useState<Product[]>([]);
    const [loadingDeals, setLoadingDeals] = useState(true);

    useEffect(() => {
        getRecommendations(8)
            .then(setRecommendations)
            .catch(() => setRecommendations([]))
            .finally(() => setLoadingRecs(false));

        productApi.getBestsellers()
            .then(setBestsellers)
            .catch(() => setBestsellers([]))
            .finally(() => setLoadingBestsellers(false));

        productApi.getDeals()
            .then(setDeals)
            .catch(() => setDeals([]))
            .finally(() => setLoadingDeals(false));
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                            Welcome to SAMZONE
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-gray-100">
                            Experience the future of fashion shopping with AI-powered virtual try-on
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/shop"
                                className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
                            >
                                Shop Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                to="/try-on"
                                className="inline-flex items-center px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors duration-300"
                            >
                                Try Virtual Try-On
                                <Sparkles className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Skin Guide Banner */}
            <section className="py-12 bg-gradient-to-r from-purple-600 to-pink-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                ✨ Find Your Perfect Colors
                            </h2>
                            <p className="text-purple-100 text-lg">
                                Upload a photo and discover which colors suit your skin tone
                            </p>
                        </div>
                        <Link
                            to="/skin-tone"
                            className="inline-flex items-center px-8 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap"
                        >
                            Try Skin Guide
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                        Why Choose SAMZONE?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                                <Sparkles className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">AI-Powered Try-On</h3>
                            <p className="text-gray-600">
                                See how clothes look on you before buying with our advanced virtual try-on technology.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                                <ShoppingBag className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Curated Collection</h3>
                            <p className="text-gray-600">
                                Browse through our carefully selected collection of fashion items for every occasion.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-4">
                                <Zap className="h-6 w-6 text-pink-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
                            <p className="text-gray-600">
                                Get personalized product recommendations from our AI assistant based on your style.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Best Sellers */}
            {(loadingBestsellers || bestsellers.length > 0) && (
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">🔥 Best Sellers</h2>
                            <Link to="/shop" className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {loadingBestsellers
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-72 w-56 flex-shrink-0" />
                                ))
                                : bestsellers.map((product) => (
                                    <ScrollProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        badge={
                                            <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                                                🔥 Best Seller
                                            </span>
                                        }
                                    />
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Deals of the Day */}
            {(loadingDeals || deals.length > 0) && (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">💜 Deals of the Day</h2>
                            <Link to="/shop" className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {loadingDeals
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-72 w-56 flex-shrink-0" />
                                ))
                                : deals.map((product) => (
                                    <ScrollProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        badge={
                                            <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                                                {Math.round(product.discount ?? 0)}% OFF
                                            </span>
                                        }
                                    />
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Shop by Occasion */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Shop by Occasion</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {OCCASIONS.map((occasion) => (
                            <Link
                                key={occasion.query}
                                to={`/shop?q=${occasion.query}`}
                                className={`bg-gradient-to-br ${occasion.gradient} rounded-xl p-6 text-white text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                            >
                                <div className="text-4xl mb-3">{occasion.emoji}</div>
                                <h3 className="text-lg font-bold mb-2">{occasion.label}</h3>
                                <span className="inline-flex items-center gap-1 text-sm font-medium text-white/90">
                                    Shop Now <ArrowRight className="w-4 h-4" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search by Photo */}
            <section className="py-12 bg-gradient-to-r from-indigo-600 to-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                                <Camera className="w-7 h-7" /> Search by Photo
                            </h2>
                            <p className="text-indigo-100 text-lg">
                                Upload any outfit photo and find similar products
                            </p>
                        </div>
                        <Link
                            to="/visual-search"
                            className="inline-flex items-center px-8 py-3 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap"
                        >
                            Try It Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* AI Outfit Stylist */}
            <section className="py-12 bg-gradient-to-r from-fuchsia-600 to-purple-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                                <Sparkles className="w-7 h-7" /> AI Outfit Stylist
                            </h2>
                            <p className="text-fuchsia-100 text-lg">
                                Get a complete, coordinated look for any occasion — picked from real products
                            </p>
                        </div>
                        <Link
                            to="/stylist"
                            className="inline-flex items-center px-8 py-3 bg-white text-fuchsia-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap"
                        >
                            ✨ Style Me
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Recommended For You */}
            {(loadingRecs || recommendations.length > 0) && (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                            Recommended For You
                        </h2>
                        {loadingRecs ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {recommendations.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden cursor-pointer flex flex-col"
                                    >
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-48 object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.src = PLACEHOLDER;
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="text-xs text-gray-500 uppercase mb-1 truncate">{product.brand}</p>
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-lg font-bold text-gray-900">
                                                    ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </span>
                                                {(product.rating ?? 0) > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-600">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                        {product.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-16 bg-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Shopping Experience?</h2>
                    <p className="text-xl mb-8">Join thousands of satisfied customers today!</p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
                    >
                        Start Shopping
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
