import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen bg-gray-50 py-8"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-center py-16"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-24 h-24 text-gray-300 mx-auto mb-6"
                        >
                            <ShoppingBag className="w-full h-full" />
                        </motion.div>
                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="text-3xl font-bold text-gray-900 mb-4"
                        >
                            Your cart is empty
                        </motion.h1>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="text-xl text-gray-500 mb-8"
                        >
                            Looks like you haven't added anything to your cart yet.
                        </motion.p>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                to="/shop"
                                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Continue Shopping
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gray-50 py-8"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-between mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart ({cartItems.length} items)</h1>
                    <motion.button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Clear Cart
                    </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <AnimatePresence>
                                {cartItems.map((item, index) => {
                                    return (
                                        <motion.div
                                            key={`${item.id}-${item.size}-${item.color}`}
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            transition={{ 
                                                opacity: { duration: 0.3 },
                                                x: { duration: 0.3 }
                                            }}
                                            className="flex items-center p-6 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                            layout
                                        >
                                            <motion.img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-24 h-24 object-cover rounded-md"
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 0.2 }}
                                            />
                                            <div className="flex-1 ml-6">
                                                <motion.h3 
                                                    className="text-lg font-medium text-gray-900"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                                >
                                                    {item.name}
                                                </motion.h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                    {item.size && <span>Size: {item.size}</span>}
                                                    {item.color && <span>Color: {item.color}</span>}
                                                </div>
                                                <motion.p 
                                                    className="text-lg font-semibold text-gray-900 mt-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.1 + 0.1, duration: 0.3 }}
                                                >
                                                    ₹{item.price.toLocaleString()}
                                                </motion.p>
                                                {item.stock !== undefined && item.stock <= 5 && (
                                                    <motion.p 
                                                        className="text-xs text-orange-600 mt-1"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                                                    >
                                                        Only {item.stock} left in stock!
                                                    </motion.p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center border rounded-md">
                                                    <motion.button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                                        disabled={item.quantity <= 1}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </motion.button>
                                                    <span className="px-4 py-2 border-x font-medium min-w-[3rem] text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <motion.button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                                        disabled={item.stock !== undefined && item.quantity >= item.stock}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                                <motion.div 
                                                    className="text-right"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                                                >
                                                    <p className="font-semibold text-gray-900">
                                                        ₹{(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </motion.div>
                                                <motion.button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        
                        <motion.div 
                            className="mt-6 flex justify-between items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/shop"
                                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Continue Shopping
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1">
                        <motion.div 
                            className="bg-white rounded-lg shadow-md p-6 sticky top-24"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
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
                                    <motion.p 
                                        className="text-xs text-green-600"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4, duration: 0.3 }}
                                    >
                                        Add ₹{(1000 - subtotal).toLocaleString()} more for free shipping!
                                    </motion.p>
                                )}
                                <div className="border-t pt-3 flex justify-between">
                                    <span className="text-lg font-semibold">Total</span>
                                    <span className="text-lg font-bold text-indigo-600">
                                        ₹{total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <motion.button 
                                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Proceed to Checkout
                            </motion.button>
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    Secure checkout powered by SAMZONE
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Cart;
