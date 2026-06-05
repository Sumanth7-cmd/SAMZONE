import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, X, Plus, Minus, Shirt, Download, Maximize2, Minimize2, Grid3x3, Zap } from 'lucide-react';
import { expandedProductCatalog, type Product } from '../data/expandedProductCatalog';

interface OverlayItem {
    id: string;
    product: Product;
    x: number;
    y: number;
    scale: number;
    opacity: number;
    rotation: number;
    bodyPart: 'head' | 'chest' | 'waist' | 'legs' | 'feet' | 'accessory';
    autoPosition: boolean;
    mirrorMode: boolean;
}

interface BodyTrackingData {
    headPosition: { x: number; y: number };
    chestPosition: { x: number; y: number };
    waistPosition: { x: number; y: number };
    legsPosition: { x: number; y: number };
    feetPosition: { x: number; y: number };
    bodyWidth: number;
    bodyHeight: number;
}

const RealisticTryOn: React.FC = () => {
    const [isWebcamOn, setIsWebcamOn] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMirrored, setIsMirrored] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [autoTracking, setAutoTracking] = useState(true);
    const [bodyData, setBodyData] = useState<BodyTrackingData | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);

    // Filter products for try-on
    const tryOnProducts = expandedProductCatalog.filter(p => 
        p.inStock && 
        (p.category === 'mens-clothing' || p.category === 'womens-clothing' || p.category === 'accessories')
    ).slice(0, 20);

    const startWebcam = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsWebcamOn(true);
                
                // Start body tracking simulation
                startBodyTracking();
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
        setBodyData(null);
    }, []);

    const startBodyTracking = () => {
        // Simulate body tracking data
        const simulateBodyData = () => {
            const video = videoRef.current;
            if (!video || !isWebcamOn) return;

            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            // Simulate body detection (in real app, this would use ML/pose detection)
            const bodyWidth = videoWidth * 0.3;
            const bodyHeight = videoHeight * 0.7;
            const centerX = videoWidth / 2;
            const centerY = videoHeight / 2;

            setBodyData({
                headPosition: { x: centerX, y: centerY - bodyHeight * 0.4 },
                chestPosition: { x: centerX, y: centerY - bodyHeight * 0.1 },
                waistPosition: { x: centerX, y: centerY + bodyHeight * 0.1 },
                legsPosition: { x: centerX, y: centerY + bodyHeight * 0.3 },
                feetPosition: { x: centerX, y: centerY + bodyHeight * 0.5 },
                bodyWidth,
                bodyHeight
            });
        };

        // Update body data every 100ms
        const interval = setInterval(simulateBodyData, 100);
        return () => clearInterval(interval);
    };

    const getBodyPartPosition = (bodyPart: OverlayItem['bodyPart']) => {
        if (!bodyData) return { x: 200, y: 150 };

        switch (bodyPart) {
            case 'head':
                return bodyData.headPosition;
            case 'chest':
                return bodyData.chestPosition;
            case 'waist':
                return bodyData.waistPosition;
            case 'legs':
                return bodyData.legsPosition;
            case 'feet':
                return bodyData.feetPosition;
            case 'accessory':
                return { x: bodyData.chestPosition.x + 100, y: bodyData.chestPosition.y };
            default:
                return { x: 200, y: 150 };
        }
    };

    const determineBodyPart = (product: Product): OverlayItem['bodyPart'] => {
        const subcategory = product.subcategory.toLowerCase();
        
        if (subcategory.includes('cap') || subcategory.includes('hat')) return 'head';
        if (subcategory.includes('shirt') || subcategory.includes('tshirt') || subcategory.includes('top')) return 'chest';
        if (subcategory.includes('jeans') || subcategory.includes('pants') || subcategory.includes('trousers')) return 'legs';
        if (subcategory.includes('shoes') || subcategory.includes('sandals')) return 'feet';
        if (subcategory.includes('belt')) return 'waist';
        if (subcategory.includes('watch') || subcategory.includes('jewelry')) return 'accessory';
        
        return 'chest'; // Default
    };

    const calculateOptimalScale = (bodyPart: OverlayItem['bodyPart'], product: Product): number => {
        if (!bodyData) return 0.5;

        const baseScales = {
            head: 0.3,
            chest: 0.8,
            waist: 0.6,
            legs: 0.7,
            feet: 0.4,
            accessory: 0.3
        };

        const categoryMultiplier = {
            'mens-clothing': 1.0,
            'womens-clothing': 0.9,
            'accessories': 0.7
        };

        const baseScale = baseScales[bodyPart];
        const multiplier = categoryMultiplier[product.category as keyof typeof categoryMultiplier] || 1.0;
        
        return baseScale * multiplier * (bodyData.bodyWidth / 640);
    };

    const addProductToOverlay = useCallback((product: Product) => {
        if (!bodyData && autoTracking) {
            setError('Please enable webcam and wait for body detection');
            return;
        }

        const bodyPart = determineBodyPart(product);
        const position = getBodyPartPosition(bodyPart);
        const scale = calculateOptimalScale(bodyPart, product);

        const newItem: OverlayItem = {
            id: `overlay_${Date.now()}`,
            product,
            x: position.x,
            y: position.y,
            scale,
            opacity: 0.85,
            rotation: 0,
            bodyPart,
            autoPosition: autoTracking,
            mirrorMode: isMirrored
        };
        
        setOverlayItems(prev => [...prev, newItem]);
        setSelectedProducts(prev => [...prev, product]);
    }, [bodyData, autoTracking, isMirrored]);

    const updateOverlayPositions = useCallback(() => {
        if (!autoTracking || !bodyData) return;

        setOverlayItems(prev => prev.map(item => {
            if (item.autoPosition) {
                const position = getBodyPartPosition(item.bodyPart);
                const scale = calculateOptimalScale(item.bodyPart, item.product);
                
                return {
                    ...item,
                    x: position.x,
                    y: position.y,
                    scale
                };
            }
            return item;
        }));
    }, [autoTracking, bodyData]);

    const startOverlayRender = () => {
        const render = () => {
            if (!videoRef.current || !canvasRef.current || !isWebcamOn) return;
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;
            
            // Set canvas size to match video
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply mirror effect
            ctx.save();
            if (isMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            
            // Draw video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Draw grid if enabled
            if (showGrid) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                
                // Vertical lines
                for (let x = 0; x < canvas.width; x += canvas.width / 10) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
                
                // Horizontal lines
                for (let y = 0; y < canvas.height; y += canvas.height / 10) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
            }
            
            // Draw body tracking indicators
            if (bodyData && autoTracking) {
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.lineWidth = 2;
                
                // Draw body outline
                ctx.strokeRect(
                    bodyData.chestPosition.x - bodyData.bodyWidth / 2,
                    bodyData.headPosition.y - 20,
                    bodyData.bodyWidth,
                    bodyData.bodyHeight
                );
                
                // Draw body part indicators
                const bodyParts = [
                    { pos: bodyData.headPosition },
                    { pos: bodyData.chestPosition },
                    { pos: bodyData.waistPosition },
                    { pos: bodyData.legsPosition },
                    { pos: bodyData.feetPosition }
                ];
                
                bodyParts.forEach(({ pos }) => {
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                    ctx.fill();
                });
            }
            
            // Draw overlay items
            overlayItems.forEach(item => {
                const img = new Image();
                img.src = item.product.image;
                
                img.onload = () => {
                    ctx.save();
                    
                    // Apply mirror effect to overlay items
                    if (isMirrored && item.mirrorMode) {
                        const centerX = item.x;
                        ctx.translate(centerX * 2, 0);
                        ctx.scale(-1, 1);
                    }
                    
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
            
            ctx.restore();
            
            // Update overlay positions for tracking
            updateOverlayPositions();
            
            animationRef.current = requestAnimationFrame(render);
        };
        
        render();
    };

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

    const captureScreenshot = useCallback(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `samzone-tryon-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }, []);

    const toggleMirror = () => {
        setIsMirrored(prev => !prev);
        setOverlayItems(prev => prev.map(item => ({ ...item, mirrorMode: !item.mirrorMode })));
    };

    // Update body tracking when webcam starts
    useEffect(() => {
        if (isWebcamOn && autoTracking) {
            const cleanup = startBodyTracking();
            return cleanup;
        }
    }, [isWebcamOn, autoTracking]);

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
                        <Zap className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Realistic Virtual Try-On Studio</h2>
                        {bodyData && (
                            <div className="flex items-center gap-1 text-xs">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Body Tracking Active</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoTracking(!autoTracking)}
                            className={`p-2 rounded transition-colors ${
                                autoTracking 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                            title="Toggle Auto Tracking"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleMirror}
                            className={`p-2 rounded transition-colors ${
                                isMirrored 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                            title="Toggle Mirror Mode"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={`p-2 rounded transition-colors ${
                                showGrid 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                            title="Toggle Grid"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={captureScreenshot}
                            className="p-2 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                            title="Capture Screenshot"
                        >
                            <Download className="w-4 h-4" />
                        </button>
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
                                <p className="text-white mb-4">Start webcam for realistic try-on with body tracking</p>
                                <button
                                    onClick={startWebcam}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Camera className="w-5 h-5" />
                                    Start Webcam
                                </button>
                                <p className="text-gray-400 text-sm mt-4">Enable camera permissions for best experience</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
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
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="font-medium">{item.product.name}</span>
                                        <button
                                            onClick={() => removeOverlayItem(item.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 mb-2">
                                        Body Part: {item.bodyPart}
                                    </div>
                                    
                                    {/* Size Control */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { 
                                                scale: Math.max(0.3, item.scale - 0.1),
                                                autoPosition: false
                                            })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs">{Math.round(item.scale * 100)}%</span>
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { 
                                                scale: Math.min(2, item.scale + 0.1),
                                                autoPosition: false
                                            })}
                                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {/* Auto Position Toggle */}
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { autoPosition: !item.autoPosition })}
                                        className={`w-full px-2 py-1 rounded text-xs ${
                                            item.autoPosition 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {item.autoPosition ? 'Auto-Position ON' : 'Auto-Position OFF'}
                                    </button>
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

export default RealisticTryOn;
