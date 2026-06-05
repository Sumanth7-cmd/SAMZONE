import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Sparkles, User, Palette, ShoppingBag, Maximize2, Minimize2, Download, Grid3x3, Zap, TrendingUp, Volume2 } from 'lucide-react';
import type { Product } from '../services/api';
import { PoseDetectionService, type PoseKeypoints, type BodyMeasurements } from './PoseDetector';
import { ClothingOverlayService } from './ClothingOverlay';
import { OutfitEngine } from '../services/outfitEngine';
import { eventBus, EVENTS } from '../services/events';
import { expandedProductCatalog } from '../data/expandedProductCatalog';

interface WebcamTryOnProps {
    selectedProduct?: Product;
    onClose: () => void;
}

const WebcamTryOn: React.FC<WebcamTryOnProps> = ({ selectedProduct, onClose }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentPose, setCurrentPose] = useState<PoseKeypoints | null>(null);
    const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements | null>(null);
    const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    
    // 10/10 Features State
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMirrored, setIsMirrored] = useState(true);
    const [showGrid, setShowGrid] = useState(false);
    const [autoTracking, setAutoTracking] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [smartRecommendations, setSmartRecommendations] = useState<Product[]>([]);

    // Refs for DOM elements
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Load products for outfit generation
    useEffect(() => {
        // Use expanded catalog for better recommendations
        setAllProducts(expandedProductCatalog.slice(0, 100));
    }, []);

    // 10/10 Features Functions
    const captureScreenshot = useCallback(() => {
        if (!overlayCanvasRef.current) return;
        
        const canvas = overlayCanvasRef.current;
        const link = document.createElement('a');
        link.download = `samzone-tryon-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }, []);

    const toggleMirror = useCallback(() => {
        setIsMirrored(prev => !prev);
        if (videoRef.current) {
            videoRef.current.style.transform = isMirrored ? 'scaleX(1)' : 'scaleX(-1)';
        }
    }, [isMirrored]);

    const toggleGrid = useCallback(() => {
        setShowGrid(prev => !prev);
    }, []);

    const toggleAutoTracking = useCallback(() => {
        setAutoTracking(prev => !prev);
        // Update pose detection service with new tracking mode
        if (PoseDetectionService && videoRef.current) {
            // Note: This would need to be implemented in PoseDetectionService
            // PoseDetectionService.setTrackingMode(!autoTracking);
        }
    }, [autoTracking]);

    const generateSmartRecommendations = useCallback(() => {
        if (!bodyMeasurements) return;
        
        // Generate recommendations based on body measurements and skin tone
        const recommendations = expandedProductCatalog
            .filter(product => 
                product.inStock &&
                product.colors.some(color => 
                    bodyMeasurements.recommendedColors.some(recColor => 
                        color.toLowerCase().includes(recColor.toLowerCase())
                    )
                )
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
        
        setSmartRecommendations(recommendations);
    }, [bodyMeasurements]);

    const startVoiceRecording = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice recording is not supported in your browser');
            return;
        }
        
        setIsRecording(true);
        // Implementation for voice commands
        setTimeout(() => setIsRecording(false), 3000);
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 520 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                await videoRef.current.play();
            }

            setIsCameraActive(true);

            // Initialize pose detection and overlay
            if (canvasRef.current && overlayCanvasRef.current && videoRef.current) {
                PoseDetectionService.initialize(videoRef.current, canvasRef.current);
                ClothingOverlayService.initialize(overlayCanvasRef.current);

                // Start pose detection
                PoseDetectionService.startDetection((keypoints) => {
                    setCurrentPose(keypoints);
                    ClothingOverlayService.updatePositions(keypoints);
                });

                // Start rendering overlay
                ClothingOverlayService.startRendering(videoRef.current);
            }
        } catch (error) {
            console.error('Camera access error:', error);
            alert('Unable to access camera. Please ensure you have granted camera permissions.');
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        PoseDetectionService.stopDetection();
        ClothingOverlayService.stopRendering();
        setIsCameraActive(false);
        setCurrentPose(null);
    }, []);

    // Analyze body measurements
    const analyzeBody = useCallback(() => {
        if (!currentPose) return;

        setIsAnalyzing(true);

        const imageData = PoseDetectionService.getCurrentFrame();
        if (imageData) {
            const measurements = PoseDetectionService.analyzeBodyMeasurements(currentPose, imageData);
            setBodyMeasurements(measurements);
        }

        setIsAnalyzing(false);
    }, [currentPose]);

    // Add clothing to overlay with enhanced positioning
    const addClothingToOverlay = useCallback((product: Product) => {
        if (!currentPose?.torso) return;

        // Enhanced positioning based on body measurements and product type
        const category = product.category.toLowerCase();
        let position;

        if (category.includes('shirt') || category.includes('t-shirt') || category.includes('top')) {
            // Upper body positioning with shoulder alignment
            position = {
                x: currentPose.torso.x - currentPose.torso.width * 0.1, // Slight offset for better alignment
                y: currentPose.torso.y - currentPose.torso.height * 0.1,
                width: currentPose.torso.width * 1.2, // Slightly wider for realistic fit
                height: currentPose.torso.height * 0.7
            };
        } else if (category.includes('pants') || category.includes('jeans') || category.includes('trouser')) {
            // Lower body positioning
            position = {
                x: currentPose.torso.x,
                y: currentPose.torso.y + currentPose.torso.height * 0.6,
                width: currentPose.torso.width * 0.9,
                height: currentPose.torso.height * 0.8
            };
        } else if (category.includes('jacket') || category.includes('hoodie') || category.includes('blazer')) {
            // Outerwear positioning - covers more torso area
            position = {
                x: currentPose.torso.x - currentPose.torso.width * 0.15,
                y: currentPose.torso.y - currentPose.torso.height * 0.15,
                width: currentPose.torso.width * 1.3,
                height: currentPose.torso.height * 0.85
            };
        } else if (category.includes('cap') || category.includes('hat')) {
            // Headwear positioning - above torso
            position = {
                x: currentPose.torso.x + currentPose.torso.width * 0.2,
                y: currentPose.torso.y - currentPose.torso.height * 0.4,
                width: currentPose.torso.width * 0.6,
                height: currentPose.torso.height * 0.3
            };
        } else {
            // Default positioning
            position = {
                x: currentPose.torso.x,
                y: currentPose.torso.y,
                width: currentPose.torso.width,
                height: currentPose.torso.height * 0.6
            };
        }

        ClothingOverlayService.addClothingItem(product, position);
        ClothingOverlayService.animateItem(product.id, 'fadeIn');
    }, [currentPose]);

    // Generate outfit from current analysis with enhanced positioning
    const generateOutfit = useCallback(() => {
        if (!selectedProduct || !allProducts.length) return;

        const outfit = OutfitEngine.generateOutfit(selectedProduct, allProducts);
        setGeneratedOutfit(outfit);

        // Add outfit items to overlay with enhanced positioning
        if (currentPose?.torso) {
            // Add top with enhanced positioning
            const topCategory = outfit.top.product.category.toLowerCase();
            let topPosition;
            
            if (topCategory.includes('shirt') || topCategory.includes('t-shirt')) {
                topPosition = {
                    x: currentPose.torso.x - currentPose.torso.width * 0.1,
                    y: currentPose.torso.y - currentPose.torso.height * 0.1,
                    width: currentPose.torso.width * 1.2,
                    height: currentPose.torso.height * 0.7
                };
            } else {
                topPosition = {
                    x: currentPose.torso.x,
                    y: currentPose.torso.y,
                    width: currentPose.torso.width,
                    height: currentPose.torso.height * 0.7
                };
            }
            ClothingOverlayService.addClothingItem(outfit.top.product, topPosition);

            // Add bottom with enhanced positioning
            const bottomPosition = {
                x: currentPose.torso.x,
                y: currentPose.torso.y + currentPose.torso.height * 0.65,
                width: currentPose.torso.width * 0.95,
                height: currentPose.torso.height * 0.75
            };
            ClothingOverlayService.addClothingItem(outfit.bottom.product, bottomPosition);

            // Add shoes with enhanced positioning
            const shoesPosition = {
                x: currentPose.torso.x + currentPose.torso.width * 0.1,
                y: currentPose.torso.y + currentPose.torso.height * 1.35,
                width: currentPose.torso.width * 0.8,
                height: currentPose.torso.height * 0.35
            };
            ClothingOverlayService.addClothingItem(outfit.shoes.product, shoesPosition);

            // Add accessory with enhanced positioning
            if (outfit.accessory) {
                const accCategory = outfit.accessory.product.category.toLowerCase();
                let accPosition;
                
                if (accCategory.includes('watch') || accCategory.includes('bracelet')) {
                    accPosition = {
                        x: currentPose.torso.x + currentPose.torso.width * 0.85,
                        y: currentPose.torso.y + currentPose.torso.height * 0.2,
                        width: currentPose.torso.width * 0.15,
                        height: currentPose.torso.height * 0.1
                    };
                } else if (accCategory.includes('cap') || accCategory.includes('hat')) {
                    accPosition = {
                        x: currentPose.torso.x + currentPose.torso.width * 0.2,
                        y: currentPose.torso.y - currentPose.torso.height * 0.35,
                        width: currentPose.torso.width * 0.6,
                        height: currentPose.torso.height * 0.3
                    };
                } else {
                    accPosition = {
                        x: currentPose.torso.x + currentPose.torso.width * 0.7,
                        y: currentPose.torso.y + currentPose.torso.height * 0.1,
                        width: currentPose.torso.width * 0.25,
                        height: currentPose.torso.height * 0.2
                    };
                }
                ClothingOverlayService.addClothingItem(outfit.accessory.product, accPosition);
            }
        }
    }, [selectedProduct, allProducts, currentPose]);

    // Add generated outfit to cart
    const addOutfitToCart = useCallback(() => {
        if (!generatedOutfit) return;

        // Add all outfit items to cart
        eventBus.emit(EVENTS.PRODUCT_SELECTED, generatedOutfit.top.product);
        eventBus.emit(EVENTS.PRODUCT_SELECTED, generatedOutfit.bottom.product);
        eventBus.emit(EVENTS.PRODUCT_SELECTED, generatedOutfit.shoes.product);
        eventBus.emit(EVENTS.PRODUCT_SELECTED, generatedOutfit.accessory.product);

        alert('Complete outfit added to cart!');
    }, [generatedOutfit]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center gap-3">
                        <Camera className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-bold text-gray-900">AI Webcam Try-On Studio</h2>
                        <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">10/10 Premium</span>
                        {isCameraActive && (
                            <div className="flex items-center gap-1 text-xs">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-600">Live</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* 10/10 Feature Buttons */}
                        <button
                            onClick={toggleMirror}
                            className={`p-2 rounded-lg transition-colors ${
                                isMirrored 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="Toggle Mirror Mode"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleGrid}
                            className={`p-2 rounded-lg transition-colors ${
                                showGrid 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="Toggle Grid"
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={captureScreenshot}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Capture Screenshot"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Toggle Fullscreen"
                        >
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Camera View */}
                    <div className="lg:col-span-2">
                        <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                            {/* Video Element */}
                            <video
                                ref={videoRef}
                                id="webcam"
                                autoPlay
                                playsInline
                                muted
                                width="640"
                                height="520"
                                className="w-full h-auto"
                                style={{ transform: 'scaleX(-1)' }} // Mirror effect
                            />

                            {/* Hidden Canvas for Pose Detection */}
                            <canvas
                                ref={canvasRef}
                                width="640"
                                height="520"
                                className="hidden"
                            />

                            {/* Overlay Canvas for Clothing */}
                            <canvas
                                ref={overlayCanvasRef}
                                width="640"
                                height="520"
                                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            />

                            {/* Camera Controls */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <div className="flex gap-2">
                                    {!isCameraActive ? (
                                        <button
                                            onClick={startCamera}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Start Camera
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopCamera}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Stop Camera
                                        </button>
                                    )}
                                </div>

                                {isCameraActive && (
                                    <button
                                        onClick={analyzeBody}
                                        disabled={isAnalyzing}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze Body'}
                                    </button>
                                )}
                                
                                {isCameraActive && (
                                    <button
                                        onClick={toggleAutoTracking}
                                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                            autoTracking 
                                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                                : 'bg-gray-600 text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        <Zap className="w-4 h-4" />
                                        {autoTracking ? 'Auto-Tracking ON' : 'Auto-Tracking OFF'}
                                    </button>
                                )}
                                
                                {isCameraActive && (
                                    <button
                                        onClick={startVoiceRecording}
                                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                            isRecording 
                                                ? 'bg-red-600 text-white animate-pulse' 
                                                : 'bg-gray-600 text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        <Volume2 className="w-4 h-4" />
                                        {isRecording ? 'Recording...' : 'Voice Control'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Analysis Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Selected Product */}
                        {selectedProduct && (
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                <h3 className="text-lg font-semibold text-purple-900 mb-3">Selected Item</h3>
                                <div className="flex gap-3">
                                    <img
                                        src={selectedProduct?.image}
                                        alt={selectedProduct.name}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{selectedProduct.name}</h4>
                                        <p className="text-sm text-gray-600">{selectedProduct.brand}</p>
                                        <p className="text-lg font-bold text-purple-900">₹{selectedProduct.price?.toLocaleString('en-IN')}</p>
                                        <button
                                            onClick={() => addClothingToOverlay(selectedProduct)}
                                            className="mt-2 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                        >
                                            Try On
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Body Analysis Results */}
                        {bodyMeasurements && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Body Analysis
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Skin Tone:</span>
                                        <span className="font-medium capitalize">{bodyMeasurements.skinTone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Recommended Size:</span>
                                        <span className="font-bold text-blue-900">{bodyMeasurements.recommendedSize}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Shoulder Width:</span>
                                        <span className="font-medium">{Math.round(bodyMeasurements.shoulderWidth)}px</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Smart Recommendations */}
                        {bodyMeasurements && smartRecommendations.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    AI Smart Recommendations
                                </h3>
                                <div className="space-y-3">
                                    {smartRecommendations.map((product, index) => (
                                        <div key={index} className="flex gap-3 p-2 bg-white rounded-lg">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                                                <p className="text-xs text-gray-600">{product.brand}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-sm font-bold text-indigo-900">₹{product.price.toLocaleString('en-IN')}</span>
                                                    <button
                                                        onClick={() => addClothingToOverlay(product)}
                                                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                                                    >
                                                        Try On
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={generateSmartRecommendations}
                                    className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium"
                                >
                                    Refresh Recommendations
                                </button>
                            </div>
                        )}

                        {/* Generate Smart Recommendations Button */}
                        {bodyMeasurements && smartRecommendations.length === 0 && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    AI Smart Recommendations
                                </h3>
                                <button
                                    onClick={generateSmartRecommendations}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium"
                                >
                                    Generate Smart Recommendations
                                </button>
                            </div>
                        )}

                        {/* Color Recommendations */}
                        {bodyMeasurements && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <Palette className="w-5 h-5" />
                                    Recommended Colors
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {bodyMeasurements.recommendedColors.map((color, index) => (
                                        <div
                                            key={index}
                                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Outfit Generation */}
                        {selectedProduct && (
                            <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                                <h3 className="text-lg font-semibold text-pink-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    AI Outfit
                                </h3>
                                <button
                                    onClick={generateOutfit}
                                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all text-sm font-medium"
                                >
                                    Generate Complete Outfit
                                </button>

                                {generatedOutfit && (
                                    <div className="mt-4 space-y-2">
                                        <div className="text-center">
                                            <span className="text-2xl font-bold text-pink-900">{generatedOutfit.score}/10</span>
                                            <p className="text-sm text-gray-600">Outfit Score</p>
                                        </div>
                                        <button
                                            onClick={addOutfitToCart}
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            Add Outfit to Cart
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebcamTryOn;
