import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye, Sparkles, Filter, Search, TrendingUp } from 'lucide-react';
import { productApi, type Product } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';
import { toggleWishlist, isWishlisted } from '../utils/wishlist';

const PAGE_SIZE = 50;

const sortOptions = [
    { id: 'name,asc', name: 'Featured' },
    { id: 'price,asc', name: 'Price: Low to High' },
    { id: 'price,desc', name: 'Price: High to Low' },
    { id: 'rating,desc', name: 'Highest Rated' },
    { id: 'id,desc', name: 'Newest First' },
];

const CleanProductGrid: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name,asc');
    const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '0', 10));
    const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        productApi.getCategories().then(setCategories).catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, selectedCategory, minPrice, maxPrice, sortBy]);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const [sortField, sortDir] = sortBy.split(',');
            const filters = {
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                sortBy: sortField,
                sortDir: sortDir as 'asc' | 'desc',
            };

            const result = debouncedSearch
                ? await productApi.searchProducts(debouncedSearch, page, PAGE_SIZE)
                : await productApi.getProducts(page, PAGE_SIZE, filters);

            setProducts(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedCategory, minPrice, maxPrice, sortBy, page]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Keep filters/sort/page in the URL so a refresh or shared link restores them
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (sortBy !== 'name,asc') params.set('sort', sortBy);
        if (page > 0) params.set('page', page.toString());
        setSearchParams(params, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, selectedCategory, minPrice, maxPrice, sortBy, page]);

    const handleLike = (productId: number) => {
        const nowLiked = toggleWishlist(productId);
        setLikedIds((prev) => {
            const next = new Set(prev);
            if (nowLiked) next.add(productId);
            else next.delete(productId);
            return next;
        });
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

    const clearFilters = () => {
        setSearchInput('');
        setSelectedCategory('all');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('name,asc');
        setSearchParams({});
    };

    const pageNumbers = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
        const nums = new Set([0, totalPages - 1, page, page - 1, page + 1]);
        const sorted = Array.from(nums).filter((n) => n >= 0 && n < totalPages).sort((a, b) => a - b);
        const result: (number | '...')[] = [];
        let prev: number | null = null;
        for (const n of sorted) {
            if (prev !== null && n - prev > 1) result.push('...');
            result.push(n);
            prev = n;
        }
        return result;
    };

    const ProductCard = ({ product }: { product: Product }) => {
        const isLiked = likedIds.has(product.id) || isWishlisted(product.id);
        const discountedPrice = product.discount
            ? product.price * (1 - product.discount / 100)
            : product.price;

        return (
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
                <div className="relative overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                    <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER;
                            e.currentTarget.onerror = null;
                        }}
                    />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${product.id}`);
                            }}
                            className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors mr-2"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLike(product.id);
                            }}
                            className={`p-2 rounded-full shadow-lg transition-colors ${
                                isLiked
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    {product.discount && product.discount > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{Math.round(product.discount)}%
                        </div>
                    )}

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">{product.rating?.toFixed(1)}</span>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 truncate">
                        {product.brand}
                    </p>

                    <h3
                        className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight cursor-pointer min-h-[3.5rem]"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        {product.name}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                        <div>
                            {product.discount && product.discount > 0 ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        ₹{discountedPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                        ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xl font-bold text-gray-900">
                                    ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                            )}
                        </div>
                    </div>

                    {product.colors && product.colors.length > 0 && (
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
                    )}

                    <button
                        onClick={() => handleAddToCart(product)}
                        className="mt-auto w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                Premium Collection
                            </h1>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <TrendingUp className="w-4 h-4" />
                                <span>{totalElements.toLocaleString('en-IN')} Products</span>
                            </div>
                        </div>

                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Products</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Price:</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={clearFilters}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-64" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-gray-600 mb-4">We couldn't load products. Please try again.</p>
                        <button
                            onClick={loadProducts}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-4">
                            {debouncedSearch
                                ? `No products found for '${debouncedSearch}'. Try a different search term.`
                                : 'Try adjusting your search or filters'}
                        </p>
                        <button
                            onClick={clearFilters}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                <button
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Prev
                                </button>
                                {pageNumbers().map((n, i) =>
                                    n === '...' ? (
                                        <span key={`gap-${i}`} className="px-2 text-gray-400">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={n}
                                            onClick={() => setPage(n)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                                n === page
                                                    ? 'bg-purple-600 text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {n + 1}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CleanProductGrid;
