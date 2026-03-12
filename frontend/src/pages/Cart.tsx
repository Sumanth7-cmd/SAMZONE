import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    size?: string;
    color?: string;
    stock?: number;
}

const Cart: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const loadCart = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartItems(cart);
        };

        loadCart();

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cart') {
                loadCart();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateQuantity = (id: number, delta: number) => {
        setCartItems((items) => {
            const updatedItems = items.map((item) => {
                if (item.id === id) {
                    const newQuantity = Math.max(1, Math.min(item.stock || 999, item.quantity + delta));
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
            
            localStorage.setItem('cart', JSON.stringify(updatedItems));
            return updatedItems;
        });
    };

    const removeItem = (id: number) => {
        setCartItems((items) => {
            const updatedItems = items.filter((item) => item.id !== id);
            localStorage.setItem('cart', JSON.stringify(updatedItems));
            return updatedItems;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.setItem('cart', JSON.stringify([]));
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    const total = subtotal + shipping;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                        <p className="text-xl text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart ({cartItems.length} items)</h1>
                    <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {cartItems.map((item) => (
                                <div
                                    key={`${item.id}-${item.size}-${item.color}`}
                                    className="flex items-center p-6 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded-md"
                                    />
                                    <div className="flex-1 ml-6">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {item.name}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            {item.size && <span>Size: {item.size}</span>}
                                            {item.color && <span>Color: {item.color}</span>}
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 mt-2">
                                            ₹{item.price.toLocaleString()}
                                        </p>
                                        {item.stock !== undefined && item.stock <= 5 && (
                                            <p className="text-xs text-orange-600 mt-1">Only {item.stock} left in stock!</p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center border rounded-md">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="px-4 py-2 border-x font-medium min-w-[3rem] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                                disabled={item.stock !== undefined && item.quantity >= item.stock}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ₹{(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 flex justify-between items-center">
                            <Link
                                to="/shop"
                                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                            >
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Order Summary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium">
                                        {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString()}`}
                                    </span>
                                </div>
                                {shipping > 0 && (
                                    <p className="text-xs text-green-600">
                                        Add ₹{(1000 - subtotal).toLocaleString()} more for free shipping!
                                    </p>
                                )}
                                <div className="border-t pt-3 flex justify-between">
                                    <span className="text-lg font-semibold">Total</span>
                                    <span className="text-lg font-bold text-indigo-600">
                                        ₹{total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium">
                                Proceed to Checkout
                            </button>
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    Secure checkout powered by SAMZONE
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
