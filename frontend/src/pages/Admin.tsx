import React, { useEffect, useState } from 'react';
import { productApi, type Product } from '../services/api';

const PASSCODE = 'samzone2026';
const SESSION_KEY = 'samzone_admin_unlocked';
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`;

interface AdminStats {
    totalProducts: number;
    totalCategories: number;
    categoryCounts: Record<string, number>;
}

const Admin: React.FC = () => {
    const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
    const [passcodeInput, setPasscodeInput] = useState('');
    const [error, setError] = useState('');

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [importing, setImporting] = useState(false);
    const [importMsg, setImportMsg] = useState('');
    const [importError, setImportError] = useState('');

    const handleImportDresses = async () => {
        setImporting(true);
        setImportMsg('');
        setImportError('');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/import-dresses`, {
                method: 'POST',
                headers: {
                    'X-Admin-Token': 'dev-token-secret-12345'
                }
            });
            if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}`);
            }
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                setImportMsg(`Successfully imported ${data.inserted} dresses. (Total read: ${data.totalRead}, Skipped: ${data.skippedInvalid})`);
                // Reload stats
                fetch(`${API_BASE_URL}/admin/stats`)
                    .then((res) => res.json())
                    .then(setStats)
                    .catch(() => {});
            } else {
                setImportError(`Import failed: ${data.status}`);
            }
        } catch (err: any) {
            setImportError(`Request failed: ${err.message}`);
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        if (!unlocked) return;
        fetch(`${API_BASE_URL}/admin/stats`)
            .then((res) => res.json())
            .then(setStats)
            .catch(() => setStats(null))
            .finally(() => setStatsLoading(false));
    }, [unlocked]);

    useEffect(() => {
        if (!unlocked) return;
        setSearchLoading(true);
        const timer = setTimeout(() => {
            const fetcher = searchQuery
                ? productApi.searchProducts(searchQuery, 0, 20)
                : productApi.getProducts(0, 20);
            fetcher
                .then((res) => setSearchResults(res.content))
                .catch(() => setSearchResults([]))
                .finally(() => setSearchLoading(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, unlocked]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcodeInput === PASSCODE) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            setUnlocked(true);
            setError('');
        } else {
            setError('Incorrect passcode');
        }
    };

    if (!unlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <form onSubmit={handleUnlock} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h1>
                    <p className="text-gray-600 text-sm mb-6">Enter the passcode to view the dashboard.</p>
                    <input
                        type="password"
                        value={passcodeInput}
                        onChange={(e) => setPasscodeInput(e.target.value)}
                        placeholder="Passcode"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        autoFocus
                    />
                    {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Unlock
                    </button>
                </form>
            </div>
        );
    }

    const categoryEntries = stats ? Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1]) : [];
    const maxCategoryCount = categoryEntries.length > 0 ? Math.max(...categoryEntries.map(([, c]) => c)) : 1;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Total Products</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {statsLoading ? '…' : (stats?.totalProducts ?? 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Total Categories</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {statsLoading ? '…' : stats?.totalCategories ?? 0}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Dataset Management</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Perform administrative operations to update the e-commerce search catalog and sync fashion items into the database.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleImportDresses}
                            disabled={importing}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                                importing
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
                            }`}
                        >
                            {importing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Importing Dress Dataset...
                                </>
                            ) : (
                                'Import Dress Dataset to Backend'
                            )}
                        </button>
                    </div>

                    {importMsg && (
                        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                            {importMsg}
                        </div>
                    )}
                    {importError && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                            {importError}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Products per Category</h2>
                    {statsLoading ? (
                        <p className="text-gray-500 text-sm">Loading…</p>
                    ) : categoryEntries.length === 0 ? (
                        <p className="text-gray-500 text-sm">Unable to load category stats.</p>
                    ) : (
                        <div className="space-y-3">
                            {categoryEntries.map(([category, count]) => (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700">{category}</span>
                                        <span className="text-gray-500">{count.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full"
                                            style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                        <h2 className="text-lg font-bold text-gray-900">Products</h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name..."
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500">
                                    <th className="py-2 pr-4">ID</th>
                                    <th className="py-2 pr-4">Name</th>
                                    <th className="py-2 pr-4">Brand</th>
                                    <th className="py-2 pr-4">Category</th>
                                    <th className="py-2 pr-4">Price</th>
                                    <th className="py-2">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-gray-500">Loading…</td>
                                    </tr>
                                ) : searchResults.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-gray-500">No products found</td>
                                    </tr>
                                ) : (
                                    searchResults.map((p) => (
                                        <tr key={p.id} className="border-b border-gray-100 last:border-b-0">
                                            <td className="py-2 pr-4 text-gray-500">{p.id}</td>
                                            <td className="py-2 pr-4 text-gray-900 max-w-xs truncate">{p.name}</td>
                                            <td className="py-2 pr-4 text-gray-600">{p.brand}</td>
                                            <td className="py-2 pr-4 text-gray-600">{p.category}</td>
                                            <td className="py-2 pr-4 text-gray-900">
                                                ₹{p.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-2 text-gray-600">{p.stock ?? 'N/A'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Order management and chatbot analytics are planned for a future release.
                </p>
            </div>
        </div>
    );
};

export default Admin;
