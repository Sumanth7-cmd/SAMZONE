import React, { useState, useEffect, useRef } from 'react';
import { Heart, ShoppingCart, Eye, Loader2, Star } from 'lucide-react';
import { type Product, massiveProductCatalog } from '../data/massiveProductCatalog';

interface OptimizedProductCardProps {
    product: Product;
    onView?: (product: Product) => void;
    lazy?: boolean;
}

const OptimizedProductCard: React.FC<OptimizedProductCardProps> = ({ 
    product, 
    onView, 
    lazy = false 
}) => {
    const [isInView, setIsInView] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazy) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    // Preload nearby images
                    preloadNearbyImages(product);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [lazy]);

    // Preload nearby images for better UX
    const preloadNearbyImages = (currentProduct: Product) => {
        const nearbyProducts = massiveProductCatalog
            .filter((p: Product) => 
                p.category === currentProduct.category &&
                p.id !== currentProduct.id &&
                Math.abs(p.price - currentProduct.price) < 5000
            )
            .slice(0, 3);

        nearbyProducts.forEach((p: Product) => {
            const img = new Image();
            img.src = p.image;
            img.loading = 'lazy';
        });
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleProductClick = () => {
        if (onView) {
            onView(product);
        }
    };

    const discountedPrice = product.discount 
        ? product.price * (1 - product.discount / 100)
        : product.price;

    return (
        <div
            ref={cardRef}
            className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${
                isHovered ? 'transform -translate-y-1' : ''
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleProductClick}
            style={{
                opacity: lazy && !isInView ? 0.7 : 1,
                transition: 'opacity 0.3s ease-in-out'
            }}
        >
            {/* Image Container with Lazy Loading */}
            <div className="relative overflow-hidden rounded-t-lg">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gray-400" />
                    </div>
                )}
                
                {lazy ? (
                    <img
                        src={isInView ? product.image : ''}
                        alt={product.name}
                        loading="lazy"
                        onLoad={handleImageLoad}
                        className={`w-full h-48 object-cover transition-all duration-500 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                            filter: imageLoaded ? 'none' : 'blur(8px)',
                            transition: 'filter 0.5s ease-in-out'
                        }}
                    />
                ) : (
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        onLoad={handleImageLoad}
                        className="w-full h-48 object-cover"
                    />
                )}
                
                {/* Wishlist Button */}
                <button
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors group"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Handle wishlist toggle
                    }}
                >
                    <Heart 
                        className={`w-5 h-5 transition-colors ${
                            isHovered ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-gray-400'
                        } group-hover:text-red-500 group-hover:fill-red-500`}
                    />
                </button>
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                            {product.name}
                        </h3>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                    </div>
                    
                    {/* Price and Discount */}
                    <div className="text-right">
                        {product.discount && product.discount > 0 && (
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-sm text-gray-500 line-through">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full">
                                    -{product.discount}%
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-purple-900">
                                ₹{discountedPrice.toLocaleString('en-IN')}
                            </span>
                            {product.discount && (
                                <span className="text-sm text-green-600 ml-2">
                                    Save ₹{(product.price - discountedPrice).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                    i < Math.floor(product.rating)
                                        ? 'bg-yellow-400'
                                        : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                        {product.rating}/5
                    </span>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-700">Colors:</span>
                    <div className="flex gap-1">
                        {product.colors.slice(0, 4).map((color, index) => (
                            <div
                                key={index}
                                className="w-6 h-6 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        {product.colors.length > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                +{product.colors.length - 4}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-700">Sizes:</span>
                        <div className="flex gap-1">
                            {product.sizes.slice(0, 5).map((size, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-300"
                                >
                                    {size}
                                </span>
                            ))}
                            {product.sizes.length > 5 && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-300">
                                    +{product.sizes.length - 5}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Stock Status */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${
                        product.inStock 
                            ? 'text-green-600' 
                            : 'text-red-600'
                    }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => console.log('Quick view')}
                            className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 text-sm"
                        >
                            <Eye className="w-4 h-4" />
                            Quick View
                        </button>
                        
                        <button
                            onClick={() => console.log('Add to cart')}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                        </button>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OptimizedProductCard;
