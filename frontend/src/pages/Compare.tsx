import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';
import type { Product } from '../services/api';

const ROWS: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
        label: 'Image',
        render: (p) => (
            <img
                src={getProductImage(p)}
                alt={p.name}
                className="w-28 h-28 object-cover rounded-lg mx-auto"
                onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                    e.currentTarget.onerror = null;
                }}
            />
        ),
    },
    { label: 'Name', render: (p) => <span className="font-semibold text-gray-900">{p.name}</span> },
    { label: 'Brand', render: (p) => p.brand },
    { label: 'Category', render: (p) => p.category },
    {
        label: 'Price',
        render: (p) => `₹${p.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    },
    {
        label: 'Rating',
        render: (p) => (
            <span className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                {p.rating ? p.rating.toFixed(1) : 'N/A'}
            </span>
        ),
    },
    { label: 'Colors', render: (p) => (p.colors && p.colors.length > 0 ? p.colors.join(', ') : '—') },
    { label: 'Sizes', render: (p) => (p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : '—') },
    {
        label: 'Stock',
        render: (p) =>
            p.stock && p.stock > 0 ? (
                <span className="text-green-600">In Stock ({p.stock})</span>
            ) : (
                <span className="text-red-600">Out of Stock</span>
            ),
    },
];

const Compare: React.FC = () => {
    const { compareItems, clearCompare, toggleCompare } = useCompare();

    if (compareItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center px-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">No products selected for comparison</h1>
                    <p className="text-gray-600 mb-6">Pick the compare icon on a product card to add it here.</p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
                    <button
                        onClick={clearCompare}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                        Clear comparison
                    </button>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                    <table className="w-full text-sm">
                        <tbody>
                            {ROWS.map((row) => (
                                <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
                                    <td className="p-4 font-medium text-gray-500 whitespace-nowrap align-middle">
                                        {row.label}
                                    </td>
                                    {compareItems.map((p) => (
                                        <td key={p.id} className="p-4 text-center align-middle min-w-[180px]">
                                            {row.render(p)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <td className="p-4" />
                                {compareItems.map((p) => (
                                    <td key={p.id} className="p-4 text-center">
                                        <div className="flex flex-col gap-2 items-center">
                                            <button
                                                onClick={() =>
                                                    addToCart({
                                                        id: p.id,
                                                        name: p.name,
                                                        price: p.price,
                                                        image: getProductImage(p),
                                                        size: p.sizes?.[0],
                                                        color: p.colors?.[0],
                                                        stock: p.stock,
                                                    })
                                                }
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium w-full"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                onClick={() => toggleCompare(p)}
                                                className="text-red-600 hover:text-red-700 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Compare;
