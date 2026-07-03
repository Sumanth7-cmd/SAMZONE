import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, TrendingUp, Tag } from 'lucide-react';
import { productApi } from '../services/api';
import type { Product, ProductFilters } from '../services/api';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS: Record<string, { sortBy: string; sortDir: 'asc' | 'desc' }> = {
    name: { sortBy: 'name', sortDir: 'asc' },
    price: { sortBy: 'price', sortDir: 'asc' },
    'price-desc': { sortBy: 'price', sortDir: 'desc' },
    rating: { sortBy: 'rating', sortDir: 'desc' },
};

const parseFiltersFromParams = (params: URLSearchParams): ProductFilters => {
    const filters: ProductFilters = {};
    if (params.get('search')) filters.search = params.get('search')!;
    if (params.get('category')) filters.category = params.get('category')!;
    if (params.get('brand')) filters.brand = params.get('brand')!;
    if (params.get('minPrice')) filters.minPrice = parseInt(params.get('minPrice')!, 10);
    if (params.get('maxPrice')) filters.maxPrice = parseInt(params.get('maxPrice')!, 10);
    if (params.get('minRating')) filters.minRating = parseFloat(params.get('minRating')!);
    return filters;
};

const Shop: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '0', 10));
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState<ProductFilters>(() => parseFiltersFromParams(searchParams));
    const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'name');
    const [categories, setCategories] = useState<string[]>([]);
    const [brands, setBrands] = useState<string[]>([]);

    const pageSize = 20;
    const isFirstRender = useRef(true);

    useEffect(() => {
        fetchCategories();
        fetchBrands();
    }, []);

    // Debounce the search box: only push it into filters 300ms after typing stops
    useEffect(() => {
        if (isFirstRender.current) return;
        const timeout = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput || undefined }));
            setCurrentPage(0);
        }, 300);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    useEffect(() => {
        isFirstRender.current = false;
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters, sortBy]);

    // Keep filters/sort/page in the URL so a refresh or shared link restores them
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.category) params.set('category', filters.category);
        if (filters.brand) params.set('brand', filters.brand);
        if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
        if (filters.minRating) params.set('minRating', filters.minRating.toString());
        if (sortBy !== 'name') params.set('sort', sortBy);
        if (currentPage > 0) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, sortBy, currentPage]);

    const fetchCategories = async () => {
        try {
            const cats = await productApi.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchBrands = async () => {
        try {
            const list = await productApi.getBrands();
            setBrands(list);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const sortConfig = SORT_OPTIONS[sortBy] ?? SORT_OPTIONS.name;
            const response = await productApi.getProducts(currentPage, pageSize, {
                ...filters,
                sortBy: sortConfig.sortBy,
                sortDir: sortConfig.sortDir,
            });
            setProducts(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (err) {
            setError('Failed to fetch products. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        setCurrentPage(0);
        fetchProducts();
    };

    const handleFilterChange = (newFilters: ProductFilters) => {
        setFilters(newFilters);
        setCurrentPage(0);
    };

    const handleRetry = () => {
        fetchProducts();
    };

    if (loading && currentPage === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">SAMZONE</h1>
                            <p className="text-indigo-100 text-lg">Discover Your Perfect Style</p>
                        </div>
                        <div className="flex items-center gap-4 mt-6 lg:mt-0">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                                <p className="text-sm font-medium">🔥 Limited Time Offer</p>
                                <p className="text-2xl font-bold">30% OFF</p>
                                <p className="text-xs text-indigo-100">On selected items</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                                <div className="space-y-2">
                                    {categories.map(cat => (
                                        <label key={cat} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="category"
                                                value={cat}
                                                checked={filters.category === cat}
                                                onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
                                                className="mr-2 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Brand */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Brand</label>
                                <select
                                    value={filters.brand || ''}
                                    onChange={(e) => handleFilterChange({ ...filters, brand: e.target.value || undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">All Brands</option>
                                    {brands.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-600">Min: ₹{filters.minPrice || 0}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50000"
                                            value={filters.minPrice || 0}
                                            onChange={(e) => handleFilterChange({ ...filters, minPrice: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">Max: ₹{filters.maxPrice || 50000}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50000"
                                            value={filters.maxPrice || 50000}
                                            onChange={(e) => handleFilterChange({ ...filters, maxPrice: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Min Rating</label>
                                <select
                                    value={filters.minRating || ''}
                                    onChange={(e) => handleFilterChange({ ...filters, minRating: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">All Ratings</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="2">2+ Stars</option>
                                </select>
                            </div>

                            <button
                                onClick={applyFilters}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="lg:w-3/4">
                        {/* Sort Bar */}
                        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    Showing {products.length} of {totalElements} products
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="name">Name</option>
                                    <option value="price">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="rating">Rating</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Tag className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                                        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-600 text-lg mb-4">{error}</p>
                                <button
                                    onClick={handleRetry}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && !error && totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={currentPage === totalPages - 1}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                {loading && currentPage > 0 && (
                    <div className="mt-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading more products...</p>
                    </div>
                )}
                </div>
            </div>
        </div>
        </div>
    );
};

export default Shop;
