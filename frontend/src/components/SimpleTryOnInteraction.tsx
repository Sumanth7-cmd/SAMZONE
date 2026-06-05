import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, RotateCw, Eye, EyeOff, Lock, Unlock, Download, Grid, List, Shirt, Camera } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface OverlayItem {
    id: string;
    product: Product;
    x: number;
    y: number;
    scale: number;
    opacity: number;
    rotation: number;
    visible: boolean;
    locked: boolean;
}

const SimpleTryOnInteraction: React.FC = () => {
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<OverlayItem | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCanvas, setShowCanvas] = useState(false);
    
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter products for try-on
    const tryOnProducts = massiveProductCatalog.filter(p => 
        p.inStock && 
        (p.category === 'mens-clothing' || p.category === 'womens-clothing') &&
        (p.subcategory === 'shirts' || p.subcategory === 'tshirts' || p.subcategory === 'dresses')
    ).slice(0, 20);

    const addProduct = (product: Product) => {
        // Check if product already exists
        if (overlayItems.some(item => item.product.id === product.id)) {
            return;
        }

        const newItem: OverlayItem = {
            id: `overlay_${Date.now()}`,
            product,
            x: 200,
            y: 150,
            scale: 0.5,
            opacity: 0.8,
            rotation: 0,
            visible: true,
            locked: false
        };

        setOverlayItems(prev => [...prev, newItem]);
        setSelectedItem(newItem);
    };

    const removeProduct = (id: string) => {
        setOverlayItems(prev => prev.filter(item => item.id !== id));
        if (selectedItem?.id === id) {
            setSelectedItem(null);
        }
    };

    const updateItem = (id: string, updates: Partial<OverlayItem>) => {
        setOverlayItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
        
        if (selectedItem?.id === id) {
            setSelectedItem(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const handleMouseDown = (e: React.MouseEvent, item: OverlayItem) => {
        if (item.locked) return;
        
        setSelectedItem(item);
        setIsDragging(true);
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left - item.x,
                y: e.clientY - rect.top - item.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !selectedItem || selectedItem.locked) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const newX = e.clientX - rect.left - dragOffset.x;
            const newY = e.clientY - rect.top - dragOffset.y;
            
            updateItem(selectedItem.id, { x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const clearAll = () => {
        setOverlayItems([]);
        setSelectedItem(null);
    };

    const exportCanvas = () => {
        // Create a simple export notification
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        message.textContent = 'Try-on exported successfully!';
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
    };

    const loadFromImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Simulate loading from image
            setShowCanvas(true);
            
            // Add a sample product
            const sampleProduct = tryOnProducts[0];
            if (sampleProduct) {
                addProduct(sampleProduct);
            }
        }
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging || !selectedItem || selectedItem.locked) return;
            
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const newX = e.clientX - rect.left - dragOffset.x;
                const newY = e.clientY - rect.top - dragOffset.y;
                
                updateItem(selectedItem.id, { x: newX, y: newY });
            }
        };

        if (isDragging) {
            document.addEventListener('mouseup', handleGlobalMouseUp);
            document.addEventListener('mousemove', handleGlobalMouseMove);
        }

        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('mousemove', handleGlobalMouseMove);
        };
    }, [isDragging, selectedItem, dragOffset]);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shirt className="w-6 h-6 text-purple-600" />
                            Try-On Studio
                        </h1>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Camera className="w-4 h-4" />
                                Upload Photo
                            </button>
                            
                            <button
                                onClick={exportCanvas}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Clear All
                            </button>
                        </div>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'grid' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'list' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Canvas Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Try-On Canvas</h2>
                            
                            <div
                                ref={canvasRef}
                                className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden"
                                style={{ height: '500px' }}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                            >
                                {!showCanvas && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-4">Upload a photo or add products to start</p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                Upload Photo
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {overlayItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onMouseDown={(e) => handleMouseDown(e, item)}
                                        className={`absolute cursor-move transition-all ${
                                            selectedItem?.id === item.id ? 'ring-2 ring-purple-600' : ''
                                        } ${item.locked ? 'cursor-not-allowed' : ''}`}
                                        style={{
                                            left: `${item.x}px`,
                                            top: `${item.y}px`,
                                            width: `${200 * item.scale}px`,
                                            height: `${200 * item.scale}px`,
                                            transform: `rotate(${item.rotation}deg)`,
                                            opacity: item.visible ? item.opacity : 0,
                                            zIndex: selectedItem?.id === item.id ? 1000 : 1
                                        }}
                                    >
                                        <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-full h-full object-contain pointer-events-none"
                                            draggable={false}
                                        />
                                        
                                        {/* Item Controls */}
                                        {selectedItem?.id === item.id && (
                                            <div className="absolute -top-12 -right-12 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                                                <div className="grid grid-cols-3 gap-1">
                                                    <button
                                                        onClick={() => updateItem(item.id, { scale: Math.max(0.3, item.scale - 0.1) })}
                                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                        title="Decrease size"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateItem(item.id, { scale: Math.min(2, item.scale + 0.1) })}
                                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                        title="Increase size"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateItem(item.id, { rotation: item.rotation - 15 })}
                                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                        title="Rotate left"
                                                    >
                                                        <RotateCw className="w-3 h-3" style={{ transform: 'scaleX(-1)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateItem(item.id, { rotation: item.rotation + 15 })}
                                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                        title="Rotate right"
                                                    >
                                                        <RotateCw className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateItem(item.id, { opacity: Math.max(0.3, item.opacity - 0.1) })}
                                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                        title="Decrease opacity"
                                                    >
                                                        <EyeOff className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateItem(item.id, { opacity: Math.min(1, item.opacity + 0.1) })}
                                                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                        title="Increase opacity"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateItem(item.id, { locked: !item.locked })}
                                                        className={`p-1 rounded text-xs ${
                                                            item.locked 
                                                                ? 'bg-red-100 hover:bg-red-200' 
                                                                : 'bg-gray-100 hover:bg-gray-200'
                                                        }`}
                                                        title={item.locked ? 'Unlock' : 'Lock'}
                                                    >
                                                        {item.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={() => removeProduct(item.id)}
                                                        className="p-1 bg-red-100 hover:bg-red-200 rounded text-xs"
                                                        title="Remove"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Products</h2>
                            
                            <div className={`space-y-3 max-h-96 overflow-y-auto ${
                                viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : ''
                            }`}>
                                {tryOnProducts.map((product) => {
                                    const isAdded = overlayItems.some(item => item.product.id === product.id);
                                    
                                    return (
                                        <div
                                            key={product.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                                                isAdded
                                                    ? 'border-green-600 bg-green-50'
                                                    : 'border-gray-200 hover:border-purple-400'
                                            }`}
                                            onClick={() => !isAdded && addProduct(product)}
                                        >
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className={`w-full ${viewMode === 'grid' ? 'h-24' : 'h-32'} object-cover rounded-lg mb-2`}
                                            />
                                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                                            <p className="text-xs text-gray-600">{product.brand}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-bold text-purple-900">
                                                    ₹{product.price.toLocaleString('en-IN')}
                                                </span>
                                                {isAdded && (
                                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                                        Added
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={loadFromImage}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default SimpleTryOnInteraction;
