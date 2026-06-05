import React, { useState, useMemo } from 'react';
import { Star, Heart, ShoppingCart, Search, Grid, List } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface FilterState {
    category: string;
    style: string;
    color: string;
    priceRange: number;
    sortBy: 'price' | 'rating' | 'name';
    viewMode: 'grid' | 'list';
}

const EnhancedProductGrid: React.FC = () => {
    const [filters, setFilters] = useState<FilterState>({
        category: 'All',
        style: 'All',
        color: 'All',
        priceRange: 5000,
        sortBy: 'rating',
        viewMode: 'grid'
    });
    
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlist, setWishlist] = useState<number[]>([]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let products = [...massiveProductCatalog];

        // Apply search
        if (searchQuery) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply category filter
        if (filters.category !== 'All') {
            products = products.filter(product => product.category === filters.category);
        }

        // Apply style filter
        if (filters.style !== 'All') {
            products = products.filter(product => {
                // Use tags to determine style since style property doesn't exist
                const styleTags = {
                    'casual': ['comfortable', 'stylish', 'versatile'],
                    'formal': ['elegant', 'professional', 'classic'],
                    'sport': ['athletic', 'performance', 'active'],
                    'streetwear': ['trendy', 'urban', 'modern'],
                    'outdoor': ['durable', 'practical', 'rugged'],
                    'luxury': ['premium', 'high-end', 'sophisticated']
                };
                
                return styleTags[filters.style as keyof typeof styleTags]?.some(tag => 
                    product.tags.includes(tag)
                );
            });
        }

        // Apply color filter
        if (filters.color !== 'All') {
            products = products.filter(product =>
                product.colors.some((color: string) => color.toLowerCase() === filters.color.toLowerCase())
            );
        }

        // Apply price filter
        products = products.filter(product => product.price <= filters.priceRange);

        // Apply sorting
        products.sort((a, b) => {
            switch (filters.sortBy) {
                case 'price':
                    return a.price - b.price;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return products;
    }, [searchQuery, filters]);

    const toggleWishlist = (productId: number) => {
        setWishlist(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const addToCart = (product: Product) => {
        // Simple cart notification for now
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
        notification.textContent = `${product.name} added to cart!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
        const isInWishlist = wishlist.includes(product.id);
        const hasDiscount = product.discount && product.discount > 0;
        const discountedPrice = hasDiscount ? product.price * (1 - (product.discount || 0) / 100) : product.price;

        return (
            <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100">
                {/* Product Image */}
                <div className="relative overflow-hidden rounded-t-xl">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                    
                    {/* Discount Badge */}
                    {hasDiscount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{product.discount}%
                        </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <button
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                            isInWishlist 
                                ? 'bg-red-500 text-white' 
                                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                    {/* Brand and Category */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {product.brand}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {product.category}
                        </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
                        <span className="text-xs text-gray-500">({Math.floor(product.rating * 20)} reviews)</span>
                    </div>

                    {/* Colors */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-600">Colors:</span>
                        <div className="flex gap-1">
                            {product.colors.slice(0, 4).map((color, index) => (
                                <div
                                    key={index}
                                    className={`w-4 h-4 rounded-full border border-gray-300`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            {product.colors.length > 4 && (
                                <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between">
                        <div>
                            {hasDiscount && (
                                <span className="text-sm text-gray-500 line-through mr-2">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                            )}
                            <span className="text-xl font-bold text-purple-900">
                                ₹{discountedPrice.toLocaleString('en-IN')}
                            </span>
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button
                            onClick={() => addToCart(product)}
                            disabled={!product.inStock}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                                product.inStock
                                    ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {product.inStock ? 'Add' : 'Out of Stock'}
                        </button>
                    </div>
                </div>

                {/* Tags */}
                <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for products, brands, or styles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Category Filter */}
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="All">All Categories</option>
                                <option value="shirts">Shirts</option>
                                <option value="pants">Pants</option>
                                <option value="shoes">Shoes</option>
                                <option value="jackets">Jackets</option>
                                <option value="accessories">Accessories</option>
                            </select>

                            {/* Style Filter */}
                            <select
                                value={filters.style}
                                onChange={(e) => setFilters(prev => ({ ...prev, style: e.target.value }))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="All">All Styles</option>
                                <option value="casual">Casual</option>
                                <option value="formal">Formal</option>
                                <option value="sport">Sport</option>
                                <option value="streetwear">Streetwear</option>
                                <option value="outdoor">Outdoor</option>
                            </select>

                            {/* Price Range */}
                            <select
                                value={filters.priceRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: parseInt(e.target.value) }))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value={1000}>Under ₹1,000</option>
                                <option value={2000}>Under ₹2,000</option>
                                <option value={5000}>Under ₹5,000</option>
                                <option value={10000}>All Prices</option>
                            </select>

                            {/* Sort */}
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="rating">Sort by Rating</option>
                                <option value="price">Sort by Price</option>
                                <option value="name">Sort by Name</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
                                    className={`p-2 rounded ${filters.viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
                                    className={`p-2 rounded ${filters.viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
                    </h1>
                    <span className="text-gray-600">
                        {filteredProducts.length} products found
                    </span>
                </div>

                {/* Active Filters */}
                {(filters.category !== 'All' || filters.style !== 'All' || filters.color !== 'All' || searchQuery) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {filters.category !== 'All' && (
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                {filters.category}
                            </span>
                        )}
                        {filters.style !== 'All' && (
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                {filters.style}
                            </span>
                        )}
                        {searchQuery && (
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                "{searchQuery}"
                            </span>
                        )}
                    </div>
                )}

                {/* Product Grid/List */}
                <div className={
                    filters.viewMode === 'grid' 
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                }>
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* No Results */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">No products found</h3>
                            <p>Try adjusting your filters or search terms</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedProductGrid;
