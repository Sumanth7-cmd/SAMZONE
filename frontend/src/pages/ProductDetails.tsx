import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi, stylistApi } from '../services/api';
import type { Product, StylistPick } from '../services/api';
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Sparkles, Eye } from 'lucide-react';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';
import { toggleWishlist, isWishlisted } from '../utils/wishlist';
import { recordViewedProduct } from '../services/recommendationService';

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [liked, setLiked] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [stylistLoading, setStylistLoading] = useState(false);
    const [stylistPicks, setStylistPicks] = useState<StylistPick[] | null>(null);
    const [stylistError, setStylistError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const data = await productApi.getProductById(parseInt(id));
                setProduct(data);
                setLiked(isWishlisted(data.id));
                setError(null);
                recordViewedProduct(data);
            } catch (err) {
                setError('Failed to load product details. Please try again later.');
                console.error('Error fetching product:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const discountedPrice = product?.discount
        ? product.price * (1 - product.discount / 100)
        : product?.price;

    const handleCompleteLook = async () => {
        if (!product) return;
        setStylistLoading(true);
        setStylistError(null);
        try {
            const result = await stylistApi.completeLook(product.id);
            setStylistPicks(result.picks);
        } catch {
            setStylistError("Couldn't style this look right now. Please try again.");
        } finally {
            setStylistLoading(false);
        }
    };

    const handleAddPickToCart = (pick: Product) => {
        addToCart({
            id: pick.id,
            name: pick.name,
            price: pick.price,
            image: getProductImage(pick),
            size: pick.sizes?.[0],
            color: pick.colors?.[0],
            stock: pick.stock,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    to="/shop"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Shop
                </Link>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Product Images */}
                        <div>
                            <div className="aspect-square mb-4">
                                <img
                                    src={product.images?.[selectedImage] || getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover object-center rounded-lg"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = PLACEHOLDER;
                                        e.currentTarget.onerror = null;
                                    }}
                                />
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            {product.images && product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                selectedImage === index 
                                                    ? 'border-indigo-600' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-col">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider">{product.category}</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setLiked(toggleWishlist(product.id))}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Heart className={`w-5 h-5 ${liked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Share2 className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                                <p className="text-lg text-gray-600 mb-4">{product.brand}</p>
                                
                                {/* Rating */}
                                {(product.rating ?? 0) > 0 && (
                                    <div className="flex items-center mb-4">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${
                                                        i < Math.floor(product.rating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-gray-600 ml-2">({product.rating.toFixed(1)} rating)</span>
                                    </div>
                                )}
                                
                                {/* Price */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-4xl font-bold text-gray-900">
                                        ₹{discountedPrice?.toLocaleString()}
                                    </span>
                                    {(product.discount ?? 0) > 0 && (
                                        <>
                                            <span className="text-2xl text-gray-500 line-through">
                                                ₹{product.price.toLocaleString()}
                                            </span>
                                            <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
                                                -{product.discount.toFixed(0)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Size Selector */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">Size</h3>
                                        <button
                                            onClick={() => setShowSizeGuide(true)}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
                                        >
                                            Size Guide
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 border rounded-lg font-medium transition-all ${
                                                    selectedSize === size
                                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showSizeGuide && (
                                <div
                                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                                    onClick={() => setShowSizeGuide(false)}
                                >
                                    <div
                                        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-gray-900">Size Guide</h3>
                                            <button
                                                onClick={() => setShowSizeGuide(false)}
                                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead>
                                                    <tr className="border-b border-gray-200 text-gray-500">
                                                        <th className="py-2 pr-4">Size</th>
                                                        <th className="py-2 pr-4">Chest (in)</th>
                                                        <th className="py-2 pr-4">Waist (in)</th>
                                                        <th className="py-2">Fits height</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        ['S', '36-38', '30-32', "5'4\"-5'7\""],
                                                        ['M', '38-40', '32-34', "5'7\"-5'10\""],
                                                        ['L', '40-42', '34-36', "5'9\"-6'0\""],
                                                        ['XL', '42-44', '36-38', "5'11\"-6'2\""],
                                                    ].map(([size, chest, waist, height]) => (
                                                        <tr key={size} className="border-b border-gray-100 last:border-b-0">
                                                            <td className="py-2 pr-4 font-semibold text-gray-900">{size}</td>
                                                            <td className="py-2 pr-4 text-gray-600">{chest}</td>
                                                            <td className="py-2 pr-4 text-gray-600">{waist}</td>
                                                            <td className="py-2 text-gray-600">{height}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4">
                                            Tip: Between sizes? We recommend sizing up for a relaxed fit.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Color Selector */}
                            {product.colors && product.colors.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Color</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`px-4 py-2 border rounded-lg font-medium transition-all ${
                                                    selectedColor === color
                                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                                    >
                                        -
                                    </button>
                                    <span className="w-16 text-center font-medium">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                                        className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                                    >
                                        +
                                    </button>
                                    {product.stock !== undefined && (
                                        <span className="text-sm text-gray-600 ml-4">
                                            {product.stock <= 10 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                            </div>

                            {/* Specifications */}
                            {product.specifications && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
                                            {product.specifications}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={() =>
                                        addToCart(
                                            {
                                                id: product.id,
                                                name: product.name,
                                                price: discountedPrice ?? product.price,
                                                image: getProductImage(product),
                                                size: selectedSize || product.sizes?.[0],
                                                color: selectedColor || product.colors?.[0],
                                                stock: product.stock,
                                            },
                                            quantity
                                        )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </button>
                                <Link
                                    to={`/try-on?productId=${product.id}`}
                                    className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Try On
                                </Link>
                                <button
                                    onClick={() => {
                                        addToCart(
                                            {
                                                id: product.id,
                                                name: product.name,
                                                price: discountedPrice ?? product.price,
                                                image: getProductImage(product),
                                                size: selectedSize || product.sizes?.[0],
                                                color: selectedColor || product.colors?.[0],
                                                stock: product.stock,
                                            },
                                            quantity
                                        );
                                        navigate('/cart');
                                    }}
                                    className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Complete the Look */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-8 p-8">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            Complete the Look
                        </h2>
                        {!stylistPicks && (
                            <button
                                onClick={handleCompleteLook}
                                disabled={stylistLoading}
                                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                {stylistLoading ? 'Styling your look...' : '✨ Complete the Look'}
                            </button>
                        )}
                    </div>

                    {stylistLoading && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64" />
                            ))}
                        </div>
                    )}

                    {stylistError && <p className="text-red-600">{stylistError}</p>}

                    {stylistPicks && stylistPicks.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {/* Main item, for context */}
                            <div className="bg-gray-50 rounded-xl border-2 border-purple-200 overflow-hidden flex flex-col">
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; e.currentTarget.onerror = null; }}
                                />
                                <div className="p-3 flex flex-col flex-1">
                                    <span className="text-xs font-semibold text-purple-600 uppercase mb-1">This item</span>
                                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h4>
                                </div>
                            </div>

                            {stylistPicks.map((pick) => (
                                <div key={pick.product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                                    <img
                                        src={getProductImage(pick.product)}
                                        alt={pick.product.name}
                                        className="w-full h-40 object-cover cursor-pointer"
                                        onClick={() => navigate(`/product/${pick.product.id}`)}
                                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; e.currentTarget.onerror = null; }}
                                    />
                                    <div className="p-3 flex flex-col flex-1">
                                        <p className="text-xs text-gray-500 uppercase mb-1 truncate">{pick.product.brand}</p>
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{pick.product.name}</h4>
                                        <span className="text-sm font-bold text-gray-900 mb-2">
                                            ₹{pick.product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                        <p className="text-xs text-gray-600 italic mb-3 flex-1">{pick.reason}</p>
                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={() => navigate(`/product/${pick.product.id}`)}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs transition-colors"
                                            >
                                                <Eye className="w-3 h-3" /> View
                                            </button>
                                            <button
                                                onClick={() => handleAddPickToCart(pick.product)}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs transition-colors"
                                            >
                                                <ShoppingCart className="w-3 h-3" /> Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {stylistPicks && stylistPicks.length === 0 && (
                        <p className="text-gray-500">No complementary items found for this product yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
