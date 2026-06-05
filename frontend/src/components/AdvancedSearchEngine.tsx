import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface SearchFilters {
    query: string;
    category: string;
    priceRange: [number, number];
    rating: number;
    brand: string;
    colors: string[];
    sortBy: string;
    inStock: boolean;
}

interface SearchHistory {
    query: string;
    timestamp: Date;
    resultCount: number;
}

const AdvancedSearchEngine: React.FC = () => {
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        category: 'all',
        priceRange: [0, 50000],
        rating: 0,
        brand: '',
        colors: [],
        sortBy: 'featured',
        inStock: true
    });
    
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const categories = [
        { id: 'all', name: 'All Categories' },
        { id: 'mens-clothing', name: "Men's Clothing" },
        { id: 'womens-clothing', name: "Women's Clothing" },
        { id: 'footwear', name: 'Footwear' },
        { id: 'electronics', name: 'Electronics' },
        { id: 'accessories', name: 'Accessories' },
        { id: 'home', name: 'Home & Living' },
        { id: 'luggage', name: 'Bags & Luggage' }
    ];

    const brands = ['All Brands', 'Nike', 'Adidas', 'Puma', 'Apple', 'Samsung', 'Sony', 'HP', 'Dell', 'Levis', 'Zara', 'H&M'];
    const sortOptions = [
        { id: 'featured', name: 'Featured' },
        { id: 'price-low', name: 'Price: Low to High' },
        { id: 'price-high', name: 'Price: High to Low' },
        { id: 'rating', name: 'Highest Rated' },
        { id: 'newest', name: 'Newest First' },
        { id: 'popular', name: 'Most Popular' }
    ];

    const availableColors = [
        'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 
        'Pink', 'Purple', 'Brown', 'Gray', 'Navy', 'Beige', 'Orange'
    ];

    // Load search history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('samzone_search_history');
        if (saved) {
            setSearchHistory(JSON.parse(saved));
        }
    }, []);

    // Save search history
    useEffect(() => {
        if (searchHistory.length > 0) {
            localStorage.setItem('samzone_search_history', JSON.stringify(searchHistory.slice(-10)));
        }
    }, [searchHistory]);

    // Generate suggestions based on query
    useEffect(() => {
        if (filters.query.length < 2) {
            setSuggestions([]);
            return;
        }

        const query = filters.query.toLowerCase();
        const productNames = massiveProductCatalog
            .map(p => p.name.toLowerCase())
            .filter(name => name.includes(query))
            .slice(0, 5);
        
        const brands = massiveProductCatalog
            .map(p => p.brand.toLowerCase())
            .filter(brand => brand.includes(query))
            .slice(0, 3);
        
        setSuggestions([...new Set([...productNames, ...brands])]);
    }, [filters.query]);

    // Advanced filtering logic
    const filteredProducts = useMemo(() => {
        let filtered = massiveProductCatalog;

        // Text search
        if (filters.query) {
            const query = filters.query.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.brand.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.subcategory.toLowerCase().includes(query)
            );
        }

        // Category filter
        if (filters.category !== 'all') {
            filtered = filtered.filter(product => product.category === filters.category);
        }

        // Price range filter
        filtered = filtered.filter(product => 
            product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
        );

        // Rating filter
        if (filters.rating > 0) {
            filtered = filtered.filter(product => product.rating >= filters.rating);
        }

        // Brand filter
        if (filters.brand && filters.brand !== 'All Brands') {
            filtered = filtered.filter(product => product.brand.toLowerCase() === filters.brand.toLowerCase());
        }

        // Color filter
        if (filters.colors.length > 0) {
            filtered = filtered.filter(product => 
                product.colors.some(color => 
                    filters.colors.some(filterColor => 
                        color.toLowerCase().includes(filterColor.toLowerCase())
                    )
                )
            );
        }

        // Stock filter
        if (filters.inStock) {
            filtered = filtered.filter(product => product.inStock);
        }

        // Sorting
        switch (filters.sortBy) {
            case 'price-low':
                return filtered.sort((a, b) => a.price - b.price);
            case 'price-high':
                return filtered.sort((a, b) => b.price - a.price);
            case 'rating':
                return filtered.sort((a, b) => b.rating - a.rating);
            case 'newest':
                return filtered.sort((a, b) => b.id - a.id);
            case 'popular':
                return filtered.sort((a, b) => b.rating - a.rating);
            default:
                return filtered;
        }
    }, [filters]);

    const handleSearch = (query: string) => {
        setIsSearching(true);
        setFilters(prev => ({ ...prev, query }));
        
        // Add to search history
        const resultCount = filteredProducts.length;
        const newHistory: SearchHistory = {
            query,
            timestamp: new Date(),
            resultCount
        };
        
        setSearchHistory(prev => [...prev.filter(h => h.query !== query), newHistory]);
        setSuggestions([]);
        
        setTimeout(() => setIsSearching(false), 500);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            query: filters.query,
            category: 'all',
            priceRange: [0, 50000],
            rating: 0,
            brand: '',
            colors: [],
            sortBy: 'featured',
            inStock: true
        });
    };

    const clearAll = () => {
        setFilters({
            query: '',
            category: 'all',
            priceRange: [0, 50000],
            rating: 0,
            brand: '',
            colors: [],
            sortBy: 'featured',
            inStock: true
        });
        setSuggestions([]);
    };

    const applyQuickFilter = (type: string, value: string) => {
        switch (type) {
            case 'budget':
                const budget = parseInt(value);
                setFilters(prev => ({ ...prev, priceRange: [0, budget] }));
                break;
            case 'category':
                setFilters(prev => ({ ...prev, category: value }));
                break;
            case 'brand':
                setFilters(prev => ({ ...prev, brand: value }));
                break;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            {/* Search Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Smart Search
                </h2>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        showFilters 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {Object.values(filters).filter(v => 
                        Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'all' && v !== 0
                    ).length > 1 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {Object.values(filters).filter(v => 
                                Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'all' && v !== 0
                            ).length - 1}
                        </span>
                    )}
                </button>
            </div>

            {/* Main Search Bar */}
            <div className="relative mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={filters.query}
                        onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch(filters.query)}
                        placeholder="Search for products, brands, or categories..."
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    />
                    {filters.query && (
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, query: '' }))}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 z-10">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSearch(suggestion)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <Search className="w-4 h-4 text-gray-400" />
                                    <span>{suggestion}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => applyQuickFilter('budget', '2000')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                    💰 Under ₹2000
                </button>
                <button
                    onClick={() => applyQuickFilter('budget', '5000')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                    💎 Under ₹5000
                </button>
                <button
                    onClick={() => applyQuickFilter('category', 'mens-clothing')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                    👔 Men's Fashion
                </button>
                <button
                    onClick={() => applyQuickFilter('category', 'womens-clothing')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                    👗 Women's Fashion
                </button>
                <button
                    onClick={() => applyQuickFilter('category', 'electronics')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                    📱 Electronics
                </button>
                <button
                    onClick={() => applyQuickFilter('brand', 'Nike')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                    🏃 Nike
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Brand Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                            <select
                                value={filters.brand}
                                onChange={(e) => handleFilterChange('brand', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {brands.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Rating: {filters.rating > 0 ? `${filters.rating}+ ⭐` : 'Any'}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                value={filters.rating}
                                onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        {/* Price Range Filter */}
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price Range: ₹{filters.priceRange[0].toLocaleString('en-IN')} - ₹{filters.priceRange[1].toLocaleString('en-IN')}
                            </label>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.priceRange[0]}
                                    onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.priceRange[1]}
                                    onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 50000])}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Color Filter */}
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                            <div className="flex flex-wrap gap-2">
                                {availableColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            const newColors = filters.colors.includes(color)
                                                ? filters.colors.filter(c => c !== color)
                                                : [...filters.colors, color];
                                            handleFilterChange('colors', newColors);
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                            filters.colors.includes(color)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={clearAll}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            )}

            {/* Search Results Summary */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-gray-600">
                    {isSearching ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            Searching...
                        </span>
                    ) : (
                        <span>
                            Found <span className="font-semibold text-purple-900">{filteredProducts.length}</span> products
                            {filters.query && (
                                <span> for "<span className="font-medium">{filters.query}</span>"</span>
                            )}
                        </span>
                    )}
                </div>
                
                {/* Search History */}
                {searchHistory.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gray-400" />
                        <select
                            className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
                            onChange={(e) => handleSearch(e.target.value)}
                        >
                            <option value="">Recent Searches</option>
                            {searchHistory.slice(-5).reverse().map((item, index) => (
                                <option key={index} value={item.query}>
                                    {item.query} ({item.resultCount} results)
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedSearchEngine;
