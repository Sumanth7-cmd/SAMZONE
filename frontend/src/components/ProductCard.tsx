import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Eye, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../services/api';
import { getCart, addToCart as addToCartUtil } from '../utils/cart';
import { isWishlisted as isProductWishlisted, toggleWishlist as toggleWishlistUtil, WISHLIST_EVENT } from '../utils/wishlist';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';

interface ProductCardProps {
  product: Product;
}

const showToast = (text: string, className: string) => {
  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.className = `toast ${className}`;
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [wishlisted, setWishlisted] = useState(false);
  const currentPrice = product.price ?? 0;
  const originalPrice = product.originalPrice ?? currentPrice;
  const hasDiscount = (product.originalPrice ?? 0) > 0 && currentPrice < originalPrice;
  const imageSrc = getProductImage(product);

  React.useEffect(() => {
    const sync = () => setWishlisted(isProductWishlisted(product.id));
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    return () => window.removeEventListener(WISHLIST_EVENT, sync);
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const alreadyInCart = getCart().some((item) => item.id === product.id);
    addToCartUtil({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.image,
      stock: product.stock,
    });

    if (alreadyInCart) {
      showToast('⚠️ Already in cart — quantity increased', 'bg-orange-500');
    } else {
      showToast('✅ Added to cart!', 'bg-green-500');
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nowWishlisted = toggleWishlistUtil(product.id);
    setWishlisted(nowWishlisted);
    showToast(
      nowWishlisted ? '❤️ Added to wishlist!' : 'Removed from wishlist',
      nowWishlisted ? 'bg-red-500' : 'bg-gray-500'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="card-surface group overflow-hidden"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-slate-50 block">
        <motion.img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
            e.currentTarget.onerror = null;
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Discount badge */}
        {product.discount && product.discount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="badge-pill absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold"
          >
            -{product.discount.toFixed(0)}%
          </motion.div>
        )}

        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-all duration-300 flex items-center justify-center">
          <motion.div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ scale: 0.8 }}
            whileHover={{ scale: 1 }}
          >
            <Eye className="w-8 h-8 text-white" />
          </motion.div>
        </div>
      </Link>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 mb-1">{product.category || 'Featured'}</p>
            <Link to={`/product/${product.id}`}>
              <motion.h3
                className="text-base font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                {product.name}
              </motion.h3>
            </Link>
            <p className="text-sm text-slate-500">{product.brand || 'Premium Brand'}</p>
          </div>

          <motion.button
            onClick={handleToggleWishlist}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-5 h-5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </motion.button>
        </div>
        
        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">({product.rating.toFixed(1)})</span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">₹{currentPrice.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>
            {product.stock !== undefined && product.stock <= 10 && (
              <p className="text-xs text-orange-600 mt-1">Only {product.stock} left</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </motion.button>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={`/product/${product.id}`}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
