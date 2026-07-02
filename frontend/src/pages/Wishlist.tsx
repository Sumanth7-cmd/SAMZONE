import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { productApi, type Product } from '../services/api';
import { getWishlist, toggleWishlist, WISHLIST_EVENT } from '../utils/wishlist';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';

const Wishlist: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const ids = getWishlist();
        if (ids.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }
        const results = await Promise.all(ids.map((id) => productApi.getProductById(id).catch(() => null)));
        setProducts(results.filter((p): p is Product => p !== null));
        setLoading(false);
    };

    useEffect(() => {
        load();
        window.addEventListener(WISHLIST_EVENT, load);
        return () => window.removeEventListener(WISHLIST_EVENT, load);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        No items saved yet. Click ♡ on any product.
                    </h1>
                    <Link
                        to="/shop"
                        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist ({products.length})</h1>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
                        >
                            <Link to={`/product/${product.id}`} className="relative h-48 block">
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = PLACEHOLDER;
                                        e.currentTarget.onerror = null;
                                    }}
                                />
                            </Link>
                            <div className="p-4 flex flex-col flex-1">
                                <p className="text-xs text-gray-500 uppercase mb-1 truncate">{product.brand}</p>
                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                                    {product.name}
                                </h3>
                                <p className="text-lg font-bold text-gray-900 mb-3">
                                    ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                                <button
                                    onClick={() => toggleWishlist(product.id)}
                                    className="mt-auto w-full flex items-center justify-center gap-2 border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
