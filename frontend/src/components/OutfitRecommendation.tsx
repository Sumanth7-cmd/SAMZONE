import React from 'react';
import { Sparkles, Star, ShoppingCart, X } from 'lucide-react';
import { OutfitEngine } from '../services/outfitEngine';
import type { Product } from '../services/api';
import type { OutfitRecommendation as OutfitRecommendationType } from '../services/outfitEngine';

interface OutfitRecommendationProps {
    outfit: OutfitRecommendationType | null;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
}

const OutfitRecommendationComponent: React.FC<OutfitRecommendationProps> = ({ outfit, onClose, onAddToCart }) => {
    if (!outfit) return null;

    const getScoreColor = (score: number): string => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        if (score >= 4) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number): string => {
        if (score >= 8) return 'bg-green-100';
        if (score >= 6) return 'bg-yellow-100';
        if (score >= 4) return 'bg-orange-100';
        return 'bg-red-100';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-bold text-gray-900">AI Outfit Recommendation</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Outfit Score */}
                <div className="p-6">
                    <div className={`text-center p-4 rounded-xl ${getScoreBg(outfit.score)}`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Star className="w-8 h-8 text-yellow-500 fill-current" />
                            <span className={`text-3xl font-bold ${getScoreColor(outfit.score)}`}>
                                {outfit.score}/10
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                            {outfit.score >= 8 ? 'Excellent Match!' : 
                             outfit.score >= 6 ? 'Good Match!' : 
                             outfit.score >= 4 ? 'Fair Match!' : 'Consider Alternatives'}
                        </p>
                    </div>
                </div>

                {/* Outfit Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {/* Top Item */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <span>👔 Top</span>
                            <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">Selected</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <img 
                                    src={outfit.top.product.image} 
                                    alt={outfit.top.product.name}
                                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{outfit.top.product.name}</h4>
                                    <p className="text-sm text-gray-600">{outfit.top.product.brand}</p>
                                    <p className="text-lg font-bold text-purple-900">₹{outfit.top.product.price?.toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-gray-500">{outfit.top.reason}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Item */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <span>👖 Bottom</span>
                            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">Recommended</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <img 
                                    src={outfit.bottom.product.image} 
                                    alt={outfit.bottom.product.name}
                                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{outfit.bottom.product.name}</h4>
                                    <p className="text-sm text-gray-600">{outfit.bottom.product.brand}</p>
                                    <p className="text-lg font-bold text-blue-900">₹{outfit.bottom.product.price?.toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-gray-500">{outfit.bottom.reason}</p>
                                    <button
                                        onClick={() => onAddToCart(outfit.bottom.product)}
                                        className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shoes Item */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                        <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                            <span>👟 Shoes</span>
                            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Recommended</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <img 
                                    src={outfit.shoes.product.image} 
                                    alt={outfit.shoes.product.name}
                                    className="w-24 h-24 object-cover rounded-lg shadow-md"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{outfit.shoes.product.name}</h4>
                                    <p className="text-sm text-gray-600">{outfit.shoes.product.brand}</p>
                                    <p className="text-lg font-bold text-green-900">₹{outfit.shoes.product.price?.toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-gray-500">{outfit.shoes.reason}</p>
                                    <button
                                        onClick={() => onAddToCart(outfit.shoes.product)}
                                        className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accessory Item */}
                    {outfit.accessory.product && (
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200">
                            <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                                <span>⌚ Accessory</span>
                                <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Recommended</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <img 
                                        src={outfit.accessory.product.image} 
                                        alt={outfit.accessory.product.name}
                                        className="w-24 h-24 object-cover rounded-lg shadow-md"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{outfit.accessory.product.name}</h4>
                                        <p className="text-sm text-gray-600">{outfit.accessory.product.brand}</p>
                                        <p className="text-lg font-bold text-yellow-900">₹{outfit.accessory.product.price?.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-gray-500">{outfit.accessory.reason}</p>
                                        <button
                                            onClick={() => onAddToCart(outfit.accessory.product)}
                                            className="mt-2 w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Explanation and Total */}
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-gray-200">
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4">Why This Outfit Works</h3>
                        <p className="text-gray-700 leading-relaxed mb-6">
                            {outfit.explanation}
                        </p>
                        
                        <div className="bg-white p-4 rounded-xl border-2 border-indigo-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total Outfit Price:</span>
                                <span className="text-2xl font-bold text-indigo-900">₹{outfit.totalPrice?.toLocaleString('en-IN')}</span>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => onAddToCart(outfit.top.product)}
                                    className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    Add Top Item to Cart
                                </button>
                                <button
                                    onClick={onClose}
                                    className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutfitRecommendationComponent;
