import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart, Eye } from 'lucide-react';
import { stylistApi } from '../services/api';
import type { Product } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';

const OCCASIONS = ['wedding', 'birthday', 'office', 'festival', 'college', 'travel', 'casual'];

const showToast = (text: string, className: string) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${className} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse`;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
};

const Stylist: React.FC = () => {
    const navigate = useNavigate();
    const [occasion, setOccasion] = useState('wedding');
    const [customOccasion, setCustomOccasion] = useState('');
    const [gender, setGender] = useState<'men' | 'women'>('women');
    const [budget, setBudget] = useState(5000);
    const [preferredColor, setPreferredColor] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outfit, setOutfit] = useState<Product[] | null>(null);
    const [explanation, setExplanation] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    const handleStyleMe = async () => {
        setLoading(true);
        setError(null);
        setOutfit(null);
        try {
            const result = await stylistApi.buildOutfit({
                occasion: occasion === 'other' ? (customOccasion.trim() || 'casual') : occasion,
                gender,
                budget,
                preferredColor: preferredColor.trim() || undefined,
            });
            setOutfit(result.outfit);
            setExplanation(result.explanation);
            setTotalPrice(result.totalPrice);
        } catch {
            setError("Couldn't style a look right now. Please try again in a moment.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAllToCart = () => {
        if (!outfit || outfit.length === 0) return;
        outfit.forEach((item) =>
            addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                image: getProductImage(item),
                size: item.sizes?.[0],
                color: item.colors?.[0],
                stock: item.stock,
            })
        );
        showToast('✅ Outfit added to cart!', 'bg-green-500');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        AI Outfit Stylist
                    </h1>
                    <p className="text-gray-600 mt-2">Tell us the occasion, and we'll put together a complete look from real products.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Occasion</label>
                            <select
                                value={occasion}
                                onChange={(e) => setOccasion(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {OCCASIONS.map((o) => (
                                    <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                                ))}
                                <option value="other">Other...</option>
                            </select>
                            {occasion === 'other' && (
                                <input
                                    type="text"
                                    value={customOccasion}
                                    onChange={(e) => setCustomOccasion(e.target.value)}
                                    placeholder="e.g. beach party"
                                    className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setGender('women')}
                                    className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${gender === 'women' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Women
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender('men')}
                                    className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${gender === 'men' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Men
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Budget: ₹{budget.toLocaleString('en-IN')}
                            </label>
                            <input
                                type="range"
                                min={1000}
                                max={50000}
                                step={500}
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="w-full accent-purple-600"
                            />
                            <input
                                type="number"
                                min={100}
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                                className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Color (optional)</label>
                            <input
                                type="text"
                                value={preferredColor}
                                onChange={(e) => setPreferredColor(e.target.value)}
                                placeholder="e.g. blue, black, red"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleStyleMe}
                        disabled={loading}
                        className="w-full mt-6 py-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        {loading ? 'Curating your look...' : '✨ Style Me'}
                    </button>
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64" />
                        ))}
                    </div>
                )}

                {error && <p className="text-red-600 text-center">{error}</p>}

                {/* Results */}
                {outfit && outfit.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                            {outfit.map((item) => (
                                <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                                    <img
                                        src={getProductImage(item)}
                                        alt={item.name}
                                        className="w-full h-40 object-cover cursor-pointer"
                                        onClick={() => navigate(`/product/${item.id}`)}
                                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; e.currentTarget.onerror = null; }}
                                    />
                                    <div className="p-3 flex flex-col flex-1">
                                        <p className="text-xs text-gray-500 uppercase mb-1 truncate">{item.category}</p>
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{item.name}</h4>
                                        <span className="text-sm font-bold text-gray-900 mb-2">
                                            ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={() => navigate(`/product/${item.id}`)}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs transition-colors"
                                            >
                                                <Eye className="w-3 h-3" /> View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-purple-900 italic">✨ {explanation}</p>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <span className="text-xl font-bold text-gray-900">
                                Total: ₹{totalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                            <button
                                onClick={handleAddAllToCart}
                                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                            >
                                <ShoppingCart className="w-5 h-5" /> Add All to Cart
                            </button>
                        </div>
                    </div>
                )}

                {outfit && outfit.length === 0 && !error && (
                    <p className="text-gray-500 text-center">
                        We couldn't find products in this budget right now — try raising the budget a bit.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Stylist;
