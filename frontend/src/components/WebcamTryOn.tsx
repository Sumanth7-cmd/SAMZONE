import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Sparkles, User, Palette, Ruler, ShoppingBag } from 'lucide-react';
import type { Product } from '../services/api';
import { PoseDetectionService, type PoseKeypoints, type BodyMeasurements } from './PoseDetector';
import { ClothingOverlayService, type OverlayItem } from './ClothingOverlay';
import { OutfitEngine } from '../services/outfitEngine';
import { eventBus, EVENTS } from '../services/events';

interface WebcamTryOnProps {
    selectedProduct?: Product;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
}

const WebcamTryOn: React.FC<WebcamTryOnProps> = ({ selectedProduct, onClose, onAddToCart }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentPose, setCurrentPose] = useState<PoseKeypoints | null>(null);
    const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements | null>(null);
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    // Refs for DOM elements
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Load products for outfit generation
    useEffect(() => {
        fetch('http://localhost:8080/api/products')
            .then(response => response.json())
            .then(data => {
                setAllProducts(data.content || data);
            })
            .catch(console.error);
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
            if (canvasRef.current && overlayCanvasRef.current) {
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

    // Add clothing to overlay
    const addClothingToOverlay = useCallback((product: Product) => {
        if (!currentPose?.torso) return;

        const position = {
            x: currentPose.torso.x,
            y: currentPose.torso.y,
            width: currentPose.torso.width,
            height: currentPose.torso.height * 0.6
        };

        ClothingOverlayService.addClothingItem(product, position);
        ClothingOverlayService.animateItem(product.id, 'fadeIn');
        
        setOverlayItems(ClothingOverlayService.getOverlayItems());
    }, [currentPose]);

    // Generate outfit from current analysis
    const generateOutfit = useCallback(() => {
        if (!selectedProduct || !allProducts.length) return;

        const outfit = OutfitEngine.generateOutfit(selectedProduct, allProducts);
        setGeneratedOutfit(outfit);

        // Add outfit items to overlay
        if (currentPose?.torso) {
            // Add bottom
            const bottomPosition = {
                x: currentPose.torso.x,
                y: currentPose.torso.y + currentPose.torso.height * 0.7,
                width: currentPose.torso.width * 0.9,
                height: currentPose.torso.height * 0.5
            };
            ClothingOverlayService.addClothingItem(outfit.bottom.product, bottomPosition);

            // Add shoes (visual representation)
            const shoesPosition = {
                x: currentPose.torso.x,
                y: currentPose.torso.y + currentPose.torso.height,
                width: currentPose.torso.width * 0.6,
                height: currentPose.torso.height * 0.3
            };
            ClothingOverlayService.addClothingItem(outfit.shoes.product, shoesPosition);
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
                        <h2 className="text-2xl font-bold text-gray-900">AI Webcam Try-On</h2>
                        <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">Real-Time</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
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
                                        src={selectedProduct.image}
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
