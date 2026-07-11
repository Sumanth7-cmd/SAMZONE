import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react';
import {
    searchProducts,
    CATEGORY_OPTIONS,
    GENDER_OPTIONS,
    type CatalogProduct,
    type ProductSort,
} from '../services/productsSearchApi';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 400;

const SORT_OPTIONS: { value: ProductSort | ''; label: string }[] = [
    { value: '', label: 'Relevance' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
];

function parsePage(searchParams: URLSearchParams): number {
    const raw = parseInt(searchParams.get('page') || '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

const CleanProductGrid: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters/page are derived straight from the URL on every render - the
    // single source of truth - rather than mirrored into local useState. That
    // mirroring is what caused the old stale-page/stale-filter bug: since
    // React Router keeps this component mounted across /shop?... URL changes,
    // a one-time useState initializer never picks up a later URL change.
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const gender = searchParams.get('gender') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sort = (searchParams.get('sort') || '') as ProductSort | '';
    const page = parsePage(searchParams);

    const [searchInput, setSearchInput] = useState(q);
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Keep the search box in sync if q changes from elsewhere (e.g. a navbar
    // link to /shop?q=sneakers) without fighting the user mid-keystroke.
    useEffect(() => {
        setSearchInput(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    // Debounce the search box: 400ms after typing stops, push it into the URL.
    useEffect(() => {
        if (searchInput === q) return;
        const timeout = setTimeout(() => {
            updateParams({ q: searchInput || null, page: null });
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    function updateParams(changes: Record<string, string | null>) {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') {
                next.delete(key);
            } else {
                next.set(key, value);
            }
        }
        setSearchParams(next, { replace: true });
    }

    // Any filter change (not page navigation itself) sends the user back to page 1.
    function handleFilterChange(changes: Record<string, string | null>) {
        updateParams({ ...changes, page: null });
    }

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);

        searchProducts({
            q: q || undefined,
            category: category || undefined,
            gender: gender || undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort: sort || undefined,
            page,
            pageSize: PAGE_SIZE,
        })
            .then((result) => {
                if (cancelled) return;
                setProducts(result.products);
                setTotalCount(result.totalCount);
                setTotalPages(result.totalPages);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [q, category, gender, minPrice, maxPrice, sort, page]);

    const clearFilters = () => {
        setSearchInput('');
        setSearchParams({}, { replace: true });
    };

    const goToPage = (n: number) => {
        updateParams({ page: n > 1 ? String(n) : null });
    };

    const pageNumbers = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const nums = new Set([1, totalPages, page, page - 1, page + 1]);
        const sorted = Array.from(nums).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
        const result: (number | '...')[] = [];
        let prev: number | null = null;
        for (const n of sorted) {
            if (prev !== null && n - prev > 1) result.push('...');
            result.push(n);
            prev = n;
        }
        return result;
    };

    const ProductCard = ({ product }: { product: CatalogProduct }) => (
        <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
            <div className="relative overflow-hidden">
                <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
            </div>

            <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 truncate">
                    {product.article_type}
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight min-h-[3.5rem]">
                    {product.product_name}
                </h3>

                <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-gray-900">
                        ₹{product.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                </div>

                <button
                    disabled
                    title="Cart isn't wired up for this collection yet - coming soon"
                    className="mt-auto w-full bg-gray-200 text-gray-500 py-2 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    );

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
                                <span>{totalCount.toLocaleString('en-IN')} Products</span>
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
                                value={category}
                                onChange={(e) => handleFilterChange({ category: e.target.value || null })}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">All Categories</option>
                                {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={gender}
                                onChange={(e) => handleFilterChange({ gender: e.target.value || null })}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">All Genders</option>
                                {GENDER_OPTIONS.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Price:</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => handleFilterChange({ minPrice: e.target.value || null })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => handleFilterChange({ maxPrice: e.target.value || null })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort:</span>
                            <select
                                value={sort}
                                onChange={(e) => handleFilterChange({ sort: e.target.value || null })}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
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
                            onClick={() => setSearchParams(new URLSearchParams(searchParams), { replace: true })}
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {q ? `No results found for "${q}"` : 'No products found'}
                        </h3>
                        <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
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
                                    onClick={() => goToPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Prev
                                </button>
                                {pageNumbers().map((n, i) =>
                                    n === '...' ? (
                                        <span key={`gap-${i}`} className="px-2 text-gray-400">...</span>
                                    ) : (
                                        <button
                                            key={n}
                                            onClick={() => goToPage(n)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                                n === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                                    disabled={page >= totalPages}
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
