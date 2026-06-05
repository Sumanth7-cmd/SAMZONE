import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, X, Plus, Minus, RotateCw, Shirt, Maximize2, Minimize2 } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface OverlayItem {
    id: string;
    product: Product;
    x: number;
    y: number;
    scale: number;
    opacity: number;
    rotation: number;
}

const FixedWebcamTryOn: React.FC = () => {
    const [isWebcamOn, setIsWebcamOn] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);

    // Filter products for try-on
    const tryOnProducts = massiveProductCatalog.filter(p => 
        p.inStock && 
        (p.category === 'mens-clothing' || p.category === 'womens-clothing') &&
        (p.subcategory === 'shirts' || p.subcategory === 'tshirts' || p.subcategory === 'dresses')
    ).slice(0, 12);

    const startWebcam = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsWebcamOn(true);
                
                // Start rendering overlay
                startOverlayRender();
            }
        } catch (err) {
            setError('Unable to access webcam. Please check permissions.');
            console.error('Webcam error:', err);
        }
    }, []);

    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        
        setIsWebcamOn(false);
    }, []);

    const startOverlayRender = () => {
        const render = () => {
            if (!videoRef.current || !canvasRef.current || !isWebcamOn) return;
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;
            
            // Set canvas size to match video
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Draw overlay items
            overlayItems.forEach(item => {
                const img = new Image();
                img.src = item.product.image;
                
                img.onload = () => {
                    ctx.save();
                    
                    // Apply transformations
                    ctx.globalAlpha = item.opacity;
                    ctx.translate(item.x + (img.width * item.scale) / 2, item.y + (img.height * item.scale) / 2);
                    ctx.rotate((item.rotation * Math.PI) / 180);
                    ctx.scale(item.scale, item.scale);
                    
                    // Draw image centered
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    
                    ctx.restore();
                };
            });
            
            animationRef.current = requestAnimationFrame(render);
        };
        
        render();
    };

    const addProductToOverlay = useCallback((product: Product) => {
        const newItem: OverlayItem = {
            id: `overlay_${Date.now()}`,
            product,
            x: 200, // Center horizontally
            y: 150, // Upper torso area
            scale: 0.5, // Appropriate size
            opacity: 0.8,
            rotation: 0
        };
        
        setOverlayItems(prev => [...prev, newItem]);
        setSelectedProducts(prev => [...prev, product]);
    }, []);

    const removeOverlayItem = useCallback((id: string) => {
        setOverlayItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const updateOverlayItem = useCallback((id: string, updates: Partial<OverlayItem>) => {
        setOverlayItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const clearAll = useCallback(() => {
        setOverlayItems([]);
        setSelectedProducts([]);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam();
        };
    }, [stopWebcam]);

    const containerClass = isMaximized 
        ? "fixed inset-0 bg-black z-50 flex flex-col"
        : "bg-white rounded-lg shadow-lg overflow-hidden";

    const videoContainerClass = isMaximized
        ? "flex-1 flex"
        : "h-96 flex";

    return (
        <div className={containerClass}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Virtual Try-On Studio</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-2 hover:bg-white/20 rounded transition-colors"
                        >
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        {!isMaximized && (
                            <button
                                onClick={() => {/* Close handler */}}
                                className="p-2 hover:bg-white/20 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={videoContainerClass}>
                {/* Left Side - Webcam */}
                <div className="flex-1 relative bg-black">
                    {!isWebcamOn ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-white mb-4">Start your webcam to try on products</p>
                                <button
                                    onClick={startWebcam}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Camera className="w-5 h-5" />
                                    Start Webcam
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            
                            {/* Webcam Controls */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <button
                                    onClick={stopWebcam}
                                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <CameraOff className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Overlay Controls */}
                            {overlayItems.map((item) => (
                                <div key={item.id} className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 mb-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">{item.product.name}</span>
                                        <button
                                            onClick={() => removeOverlayItem(item.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {/* Size Control */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { scale: Math.max(0.3, item.scale - 0.1) })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs">{Math.round(item.scale * 100)}%</span>
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { scale: Math.min(2, item.scale + 0.1) })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {/* Opacity Control */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { opacity: Math.max(0.3, item.opacity - 0.1) })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs">{Math.round(item.opacity * 100)}%</span>
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { opacity: Math.min(1, item.opacity + 0.1) })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {/* Rotation Control */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { rotation: item.rotation - 15 })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <RotateCw className="w-3 h-3" style={{ transform: 'scaleX(-1)' }} />
                                        </button>
                                        <span className="text-xs">{item.rotation}°</span>
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { rotation: item.rotation + 15 })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <RotateCw className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="bg-white rounded-lg p-6 max-w-sm">
                                <p className="text-red-600 text-center">{error}</p>
                                <button
                                    onClick={startWebcam}
                                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-full"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Product Selection */}
                <div className={`${isMaximized ? 'w-80' : 'w-1/2'} bg-gray-50 border-l border-gray-200 overflow-y-auto`}>
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shirt className="w-5 h-5" />
                            Select Products to Try On
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {tryOnProducts.map((product) => {
                                const isInOverlay = overlayItems.some(item => item.product.id === product.id);
                                
                                return (
                                    <div
                                        key={product.id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                                            isInOverlay
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-200 hover:border-purple-400'
                                        }`}
                                        onClick={() => !isInOverlay && addProductToOverlay(product)}
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-24 object-cover rounded-lg mb-2"
                                        />
                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                                        <p className="text-xs text-gray-600">{product.brand}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-bold text-purple-900">
                                                ₹{product.price.toLocaleString('en-IN')}
                                            </span>
                                            {isInOverlay && (
                                                <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                                    Added
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {selectedProducts.length > 0 && (
                            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                <h4 className="font-semibold text-purple-900 mb-2">Currently Trying On:</h4>
                                <div className="space-y-1">
                                    {selectedProducts.map((product) => (
                                        <div key={product.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{product.name}</span>
                                            <button
                                                onClick={() => {
                                                    const item = overlayItems.find(item => item.product.id === product.id);
                                                    if (item) removeOverlayItem(item.id);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixedWebcamTryOn;
