import React, { useState } from 'react';
import { Heart, ShoppingCart, Star, Eye, Sparkles, Filter, Search, TrendingUp } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

const CleanProductGrid: React.FC = () => {
    const [products] = useState<Product[]>(massiveProductCatalog.slice(0, 12));
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('featured');
    const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

    const categories = [
        { id: 'all', name: 'All Products' },
        { id: 'mens-clothing', name: "Men's Clothing" },
        { id: 'womens-clothing', name: "Women's Clothing" },
        { id: 'footwear', name: 'Footwear' },
        { id: 'electronics', name: 'Electronics' },
        { id: 'accessories', name: 'Accessories' }
    ];

    const sortOptions = [
        { id: 'featured', name: 'Featured' },
        { id: 'price-low', name: 'Price: Low to High' },
        { id: 'price-high', name: 'Price: High to Low' },
        { id: 'rating', name: 'Highest Rated' },
        { id: 'newest', name: 'Newest First' }
    ];

    const handleLike = (productId: number) => {
        setLikedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'newest':
                return b.id - a.id;
            default:
                return 0;
        }
    });

    const ProductCard = ({ product }: { product: Product }) => {
        const isLiked = likedItems.has(product.id);
        const discountedPrice = product.discount 
            ? product.price * (1 - product.discount / 100)
            : product.price;

        return (
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                {/* Product Image */}
                <div className="relative overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors mr-2">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleLike(product.id)}
                            className={`p-2 rounded-full shadow-lg transition-colors ${
                                isLiked 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-white text-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    
                    {/* Discount Badge */}
                    {product.discount && product.discount > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{product.discount}%
                        </div>
                    )}
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">{product.rating}</span>
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                    {/* Brand */}
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                        {product.brand}
                    </p>
                    
                    {/* Product Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {product.name}
                    </h3>
                    
                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            {product.discount && product.discount > 0 ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        ₹{discountedPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xl font-bold text-gray-900">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Colors */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500">Colors:</span>
                        <div className="flex gap-1">
                            {product.colors.slice(0, 3).map((color, index) => (
                                <div
                                    key={index}
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            {product.colors.length > 3 && (
                                <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                    +{product.colors.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                Premium Collection
                            </h1>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <TrendingUp className="w-4 h-4" />
                                <span>{products.length} Products</span>
                            </div>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex items-center gap-4 mt-4">
                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Clear Filters */}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('all');
                                setSortBy('featured');
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {sortedProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('all');
                                setSortBy('featured');
                            }}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
                
                {/* Load More */}
                {sortedProducts.length > 0 && sortedProducts.length < massiveProductCatalog.length && (
                    <div className="text-center mt-12">
                        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300">
                            Load More Products
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CleanProductGrid;
