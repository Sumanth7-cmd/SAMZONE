import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Shirt, ShoppingBag, X, Maximize2, Minimize2, RefreshCw, User, Sparkles, Loader2 } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface OverlayItem {
    id: string;
    product: Product;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    opacity: number;
    rotation: number;
}

interface BodyMeasurement {
    shoulderWidth: number;
    torsoHeight: number;
    hipWidth: number;
    recommendedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    confidence: number;
}

const AdvancedWebcamTryOn: React.FC = () => {
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('mens-clothing');
    const [error, setError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Categories for product selection
    const categories = [
        { id: 'mens-clothing', name: 'Men Clothing', icon: '👔' },
        { id: 'womens-clothing', name: 'Women Clothing', icon: '👗' },
        { id: 'footwear', name: 'Footwear', icon: '👟' },
        { id: 'accessories', name: 'Accessories', icon: '👒' }
    ];

    // Start webcam
    const startWebcam = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsWebcamActive(true);
                
                // Start body measurement analysis
                setTimeout(() => analyzeBodyMeasurements(), 2000);
            }
        } catch (error) {
            console.error('Error accessing webcam:', error);
            setError('Unable to access webcam. Please ensure camera permissions are granted.');
        }
    }, []);

    // Stop webcam
    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        
        setIsWebcamActive(false);
        setBodyMeasurements(null);
    }, []);

    // Analyze body measurements
    const analyzeBodyMeasurements = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setIsAnalyzing(true);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            setIsAnalyzing(false);
            return;
        }
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Simulate body measurement analysis
        // In real implementation, you'd use pose detection libraries like MediaPipe or TensorFlow.js
        const measurements: BodyMeasurement = {
            shoulderWidth: 380 + Math.random() * 100, // Simulated measurement
            torsoHeight: 450 + Math.random() * 100,
            hipWidth: 320 + Math.random() * 80,
            recommendedSize: 'M',
            confidence: 0.85
        };
        
        // Determine size based on measurements
        if (measurements.shoulderWidth < 350) {
            measurements.recommendedSize = 'S';
        } else if (measurements.shoulderWidth < 400) {
            measurements.recommendedSize = 'M';
        } else if (measurements.shoulderWidth < 450) {
            measurements.recommendedSize = 'L';
        } else {
            measurements.recommendedSize = 'XL';
        }
        
        setBodyMeasurements(measurements);
        setIsAnalyzing(false);
    }, []);

    // Add product to overlay
    const addProductToOverlay = useCallback((product: Product) => {
        const overlayItem: OverlayItem = {
            id: `overlay_${Date.now()}_${Math.random()}`,
            product,
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            scale: 1.0,
            opacity: 0.8,
            rotation: 0
        };
        
        setOverlayItems(prev => [...prev, overlayItem]);
    }, []);

    // Remove product from overlay
    const removeOverlayItem = useCallback((id: string) => {
        setOverlayItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Update overlay item position
    const updateOverlayItem = useCallback((id: string, updates: Partial<OverlayItem>) => {
        setOverlayItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    }, [overlayItems]);

    // Render overlay
    const renderOverlay = useCallback(() => {
        if (!canvasRef.current || !videoRef.current || overlayItems.length === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const video = videoRef.current;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Set canvas size
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Apply overlay items
        overlayItems.forEach(item => {
            ctx.save();
            
            // Apply transformations
            ctx.globalAlpha = item.opacity;
            ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
            ctx.rotate((item.rotation * Math.PI) / 180);
            ctx.scale(item.scale, item.scale);
            
            // Draw product image
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
                ctx.restore();
            };
            img.src = item.product.image;
        });
        
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(renderOverlay);
    }, [overlayItems]);

    // Start animation loop
    useEffect(() => {
        if (isWebcamActive && overlayItems.length > 0) {
            renderOverlay();
        }
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isWebcamActive, overlayItems.length, renderOverlay]);

    // Get products by category
    const getProductsByCategory = useCallback((category: string) => {
        return massiveProductCatalog
            .filter(p => p.category === category)
            .filter(p => p.inStock)
            .slice(0, 12);
    }, []);

    // Handle product selection
    const handleProductSelect = useCallback((product: Product) => {
        if (!isWebcamActive) {
            // Just select for later use
            setSelectedProducts(prev => {
                const exists = prev.find(p => p.id === product.id);
                if (exists) {
                    return prev.filter(p => p.id !== product.id);
                } else {
                    return [...prev, product];
                }
            });
        } else {
            // Add to overlay immediately
            addProductToOverlay(product);
        }
    }, [isWebcamActive, addProductToOverlay]);

    // Try on selected products
    const tryOnSelectedProducts = useCallback(() => {
        if (selectedProducts.length === 0) {
            setError('Please select at least one product to try on.');
            return;
        }
        
        if (!isWebcamActive) {
            setError('Please start webcam first before trying on products.');
            return;
        }
        
        // Add all selected products to overlay
        selectedProducts.forEach(product => {
            addProductToOverlay(product);
        });
        
        setSelectedProducts([]);
    }, [selectedProducts, isWebcamActive, addProductToOverlay]);

    // Clear all overlays
    const clearOverlays = useCallback(() => {
        setOverlayItems([]);
    }, []);

    return (
        <div className={`fixed inset-0 bg-black z-50 flex ${
            isMinimized ? 'items-center justify-center' : ''
        }`}>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-10 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-white text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        Advanced Virtual Try-On Studio
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                        >
                            {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {!isMinimized && (
                <div className="flex h-full">
                    {/* Left Side - Webcam */}
                    <div className="w-1/2 bg-gray-900 relative flex flex-col">
                        <div className="flex-1 relative">
                            {/* Video Element */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            
                            {/* Canvas for overlay */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full"
                            />
                            
                            {/* Body Measurement Overlay */}
                            {bodyMeasurements && (
                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg max-w-xs">
                                    <div className="text-xs space-y-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>Size: {bodyMeasurements.recommendedSize}</span>
                                        </div>
                                        <div className="text-xs text-green-400">
                                            Confidence: {Math.round(bodyMeasurements.confidence * 100)}%
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Webcam Controls */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {!isWebcamActive ? (
                                        <button
                                            onClick={startWebcam}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <Camera className="w-5 h-5" />
                                            Start Camera
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopWebcam}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <CameraOff className="w-5 h-5" />
                                            Stop Camera
                                        </button>
                                    )}
                                    
                                    {isWebcamActive && (
                                        <button
                                            onClick={analyzeBodyMeasurements}
                                            disabled={isAnalyzing}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4" />
                                                    Measure Body
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                
                                {overlayItems.length > 0 && (
                                    <button
                                        onClick={clearOverlays}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear Overlays
                                    </button>
                                )}
                            </div>
                            
                            {/* Error Display */}
                            {error && (
                                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg max-w-xs">
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Product Selection */}
                    <div className="w-1/2 bg-white border-l border-gray-300 overflow-y-auto">
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-purple-600" />
                                Select Products to Try On
                            </h3>
                            
                            {/* Category Tabs */}
                            <div className="flex gap-2 mb-4 border-b border-gray-200">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                                            selectedCategory === category.id
                                                ? 'text-purple-600 border-purple-600 bg-purple-50'
                                                : 'text-gray-600 border-transparent hover:text-purple-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="mr-2">{category.icon}</span>
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Products Grid */}
                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {getProductsByCategory(selectedCategory).map(product => {
                                    const isSelected = selectedProducts.some(p => p.id === product.id);
                                    const isInOverlay = overlayItems.some(item => item.product.id === product.id);
                                    
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductSelect(product)}
                                            className={`relative bg-white border rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
                                                isSelected 
                                                    ? 'border-purple-600 bg-purple-50' 
                                                    : isInOverlay
                                                    ? 'border-green-600 bg-green-50'
                                                    : 'border-gray-200 hover:border-purple-400'
                                            }`}
                                        >
                                            {/* Product Image */}
                                            <div className="relative mb-2">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-24 object-cover rounded"
                                                />
                                                {isInOverlay && (
                                                    <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                                        Active
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Product Info */}
                                            <div className="text-sm">
                                                <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                                                <p className="text-gray-600 text-xs">{product.brand}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-purple-900 font-bold">
                                                        ₹{product.price.toLocaleString('en-IN')}
                                                    </span>
                                                    {product.discount && (
                                                        <span className="text-xs text-red-600 bg-red-100 px-1 py-0.5 rounded">
                                                            -{product.discount}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    {product.colors.slice(0, 3).map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className="w-4 h-4 rounded-full border border-gray-300"
                                                            style={{ backgroundColor: color }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleProductSelect(product)}
                                                    className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                                                        isSelected
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : isInOverlay
                                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                                    }`}
                                                    disabled={isSelected}
                                                >
                                                    {isInOverlay ? 'Remove' : isSelected ? 'Selected' : 'Try On'}
                                                </button>
                                                
                                                {isInOverlay && (
                                                    <button
                                                        onClick={() => removeOverlayItem(
                                                            overlayItems.find(item => item.product.id === product.id)?.id || ''
                                                        )}
                                                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                                    >
                                                        Adjust
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Try On Button */}
                            {selectedProducts.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={tryOnSelectedProducts}
                                        disabled={!isWebcamActive}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Shirt className="w-5 h-5" />
                                        Try On Selected Products ({selectedProducts.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedWebcamTryOn;
