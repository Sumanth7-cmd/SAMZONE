import React, { useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import WebcamTryOn from './WebcamTryOn';
import type { Product } from '../services/api';
import { eventBus, EVENTS } from '../services/events';

const WebcamButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Listen for product selection events
    React.useEffect(() => {
        const handleProductSelect = (event: CustomEvent) => {
            setSelectedProduct(event.detail);
        };

        window.addEventListener('productSelected', handleProductSelect as EventListener);
        
        return () => {
            window.removeEventListener('productSelected', handleProductSelect as EventListener);
        };
    }, []);

    const handleAddToCart = (product: Product) => {
        eventBus.emit(EVENTS.PRODUCT_SELECTED, product);
    };

    return (
        <>
            {/* Floating Webcam Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-20 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center gap-2"
            >
                <Camera className="w-6 h-6" />
                <span className="font-medium">Try On</span>
            </button>

            {/* Webcam Try-On Modal */}
            {isOpen && (
                <WebcamTryOn
                    selectedProduct={selectedProduct}
                    onClose={() => setIsOpen(false)}
                    onAddToCart={handleAddToCart}
                />
            )}
        </>
    );
};

export default WebcamButton;
