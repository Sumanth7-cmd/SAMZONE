import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ShoppingCart, Eye, Loader } from 'lucide-react';
import { visualSearchApi } from '../services/api';
import type { Product, VisualSearchDetection } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';

const VisualSearch: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detected, setDetected] = useState<VisualSearchDetection | null>(null);
    const [products, setProducts] = useState<Product[]>([]);

    const handleFile = (file: File | undefined) => {
        if (!file || !file.type.startsWith('image/')) return;
        setError(null);
        setDetected(null);
        setProducts([]);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const findSimilar = async () => {
        if (!preview) return;
        setLoading(true);
        setError(null);
        try {
            const result = await visualSearchApi.search(preview);
            setDetected(result.detected);
            setProducts(result.products);
        } catch {
            setError("Couldn't analyze this photo right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: getProductImage(product),
            size: product.sizes?.[0],
            color: product.colors?.[0],
            stock: product.stock,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-2">
                        <Camera className="w-8 h-8 text-indigo-600" />
                        Search by Photo
                    </h1>
                    <p className="text-gray-600">Upload any outfit photo and we'll find similar products in our catalog.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-10">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />

                    {!preview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleFile(e.dataTransfer.files?.[0]);
                            }}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                        >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-700 font-medium mb-1">Click to upload or drag a photo here</p>
                            <p className="text-sm text-gray-500">JPG or PNG of a clothing item or outfit</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <img src={preview} alt="Upload preview" className="max-h-80 rounded-lg shadow-sm object-contain" />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setPreview(null);
                                        setDetected(null);
                                        setProducts([]);
                                        setError(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Choose Different Photo
                                </button>
                                <button
                                    onClick={findSimilar}
                                    disabled={loading}
                                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    {loading ? 'Analyzing...' : 'Find Similar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-600 text-center mt-4">{error}</p>}
                </div>

                {detected && (
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {detected.type && (
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">Type: {detected.type}</span>
                        )}
                        {detected.color && (
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">Color: {detected.color}</span>
                        )}
                        {detected.category && (
                            <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-medium">{detected.category}</span>
                        )}
                    </div>
                )}

                {products.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-48 object-cover cursor-pointer"
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    onError={(e) => {
                                        e.currentTarget.src = PLACEHOLDER;
                                        e.currentTarget.onerror = null;
                                    }}
                                />
                                <div className="p-4 flex flex-col flex-1">
                                    <p className="text-xs text-gray-500 uppercase mb-1 truncate">{product.brand}</p>
                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">{product.name}</h3>
                                    <span className="text-lg font-bold text-gray-900 mb-3">
                                        ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                    <div className="mt-auto flex gap-2">
                                        <button
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                                        >
                                            <Eye className="w-4 h-4" /> View
                                        </button>
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm transition-colors"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualSearch;
