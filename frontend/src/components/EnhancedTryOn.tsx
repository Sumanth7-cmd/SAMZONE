import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Shirt, Sparkles, TrendingUp, Palette, Maximize2 } from 'lucide-react';
import { type Product } from '../data/mockProducts';
import { enhancedApi } from '../services/enhancedApi';

interface OutfitAnalysis {
    skinTone: 'light' | 'medium' | 'dark';
    recommendedSize: 'S' | 'M' | 'L' | 'XL';
    bestColors: string[];
    outfitScore: number;
    suggestions: string[];
}

const EnhancedTryOn: React.FC = () => {
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [outfitAnalysis, setOutfitAnalysis] = useState<OutfitAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [tryOnResult, setTryOnResult] = useState<string | null>(null);
    const [recommendedOutfit, setRecommendedOutfit] = useState<Product[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Initialize webcam
    const startWebcam = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsWebcamActive(true);
                
                // Start AI analysis after webcam starts
                setTimeout(() => analyzeUserAndEnvironment(), 2000);
            }
        } catch (error) {
            console.error('Webcam access error:', error);
            alert('Please allow camera access to use virtual try-on feature');
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
        setIsWebcamActive(false);
    }, []);

    // AI-powered user and environment analysis
    const analyzeUserAndEnvironment = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setIsAnalyzing(true);
        
        try {
            // Simulate AI analysis delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate AI analysis based on selected product and user
            const analysis: OutfitAnalysis = {
                skinTone: ['light', 'medium', 'dark'][Math.floor(Math.random() * 3)] as 'light' | 'medium' | 'dark',
                recommendedSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)] as 'S' | 'M' | 'L' | 'XL',
                bestColors: generateColorRecommendations(selectedProduct),
                outfitScore: Math.floor(Math.random() * 3) + 7, // 7-10 score
                suggestions: generateStyleSuggestions(selectedProduct)
            };
            
            setOutfitAnalysis(analysis);
            
            // Get outfit recommendations
            const outfit = await enhancedApi.getOutfitRecommendations();
            setRecommendedOutfit(outfit);
            
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedProduct]);

    // Generate color recommendations based on product
    const generateColorRecommendations = (product: Product | null): string[] => {
        if (!product) return ['black', 'white', 'gray'];
        
        const colorPalettes: Record<string, Record<string, string[]>> = {
            shirts: {
                black: ['white', 'gray', 'navy'],
                white: ['black', 'blue', 'red'],
                blue: ['white', 'beige', 'navy']
            },
            pants: {
                black: ['white', 'gray', 'blue'],
                beige: ['navy', 'olive', 'brown'],
                navy: ['white', 'gray', 'beige']
            },
            shoes: {
                white: ['black', 'navy', 'red'],
                black: ['white', 'gray', 'blue'],
                brown: ['beige', 'navy', 'olive']
            }
        };
        
        const category = product.category.toLowerCase();
        const productColor = product.colors[0]?.toLowerCase() || 'black';
        
        return colorPalettes[category]?.[productColor] || ['black', 'white'];
    };

    // Generate style suggestions
    const generateStyleSuggestions = (product: Product | null): string[] => {
        if (!product) return ['Try with casual accessories', 'Complete with neutral colors'];
        
        const suggestions = [
            `This ${product.name} pairs perfectly with slim-fit jeans`,
            `Layer with a light jacket for a smart casual look`,
            `Add minimal accessories to let ${product.style} style shine`,
            `Perfect for both casual and semi-formal occasions`,
            `Consider rolling up the sleeves for a relaxed vibe`
        ];
        
        return suggestions.slice(0, 3);
    };

    // Capture try-on result
    const captureTryOnResult = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Set canvas size to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add overlay text
        ctx.fillStyle = 'rgba(128, 0, 128, 0.7)';
        ctx.fillRect(10, canvas.height - 60, 200, 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Virtual Try-On', 20, canvas.height - 30);
        
        // Convert to image
        const imageUrl = canvas.toDataURL('image/png');
        setTryOnResult(imageUrl);
        
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 1.414l8-8a1 1 0 01-1.414-1.414l-8 8a1 1 0 01-1.414 1.414l8-8z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <span>Try-on captured successfully!</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }, []);

    // Select product for try-on
    const selectProductForTryOn = useCallback((product: Product) => {
        setSelectedProduct(product);
        // Re-analyze with new product
        setTimeout(() => analyzeUserAndEnvironment(), 500);
    }, [analyzeUserAndEnvironment]);

    return (
        <>
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shirt className="w-8 h-8 text-purple-600" />
                            <h1 className="text-2xl font-bold text-gray-900">AI Virtual Try-On Studio</h1>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Powered by AI</span>
                        </div>
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Webcam Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Camera className="w-6 h-6" />
                                        Virtual Try-On
                                    </h2>
                                </div>
                                
                                <div className="p-6">
                                    {!isWebcamActive ? (
                                        <div className="text-center">
                                            <button
                                                onClick={startWebcam}
                                                className="bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center gap-3 mx-auto"
                                            >
                                                <Camera className="w-5 h-5" />
                                                Start Camera
                                            </button>
                                            <p className="text-gray-600 mt-4 text-sm">
                                                Click to enable your camera and start virtual try-on experience
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Video Feed */}
                                            <div className="relative bg-black rounded-xl overflow-hidden">
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-96 object-cover"
                                                />
                                                
                                                {/* Analysis Overlay */}
                                                {isAnalyzing && (
                                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                        <div className="text-white text-center">
                                                            <div className="w-12 h-12 border-4 border-white/30 border-t-0 animate-spin mx-auto mb-4"></div>
                                                            <p className="text-lg font-semibold">AI Analyzing...</p>
                                                            <p className="text-sm opacity-75">Detecting skin tone and finding perfect match</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Hidden Canvas for Capture */}
                                            <canvas ref={canvasRef} className="hidden" />
                                            
                                            {/* Controls */}
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={captureTryOnResult}
                                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Maximize2 className="w-5 h-5" />
                                                    Capture Look
                                                </button>
                                                <button
                                                    onClick={stopWebcam}
                                                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                    Stop Camera
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis Panel */}
                        <div className="space-y-6">
                            {/* Product Selection */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    Select Product
                                </h3>
                                
                                {!selectedProduct ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <Shirt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>Select a product to start virtual try-on</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <img
                                                src={selectedProduct.image}
                                                alt={selectedProduct.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900">{selectedProduct.name}</h4>
                                                <p className="text-sm text-gray-600">{selectedProduct.brand}</p>
                                                <p className="text-lg font-bold text-purple-900">₹{selectedProduct.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => selectProductForTryOn(selectedProduct)}
                                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                        >
                                            Try On This Item
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis Results */}
                            {outfitAnalysis && (
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                        AI Analysis
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {/* Skin Tone */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Skin Tone:</span>
                                            <span className="font-semibold capitalize">{outfitAnalysis.skinTone}</span>
                                        </div>
                                        
                                        {/* Recommended Size */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Recommended Size:</span>
                                            <span className="font-bold text-purple-900">{outfitAnalysis.recommendedSize}</span>
                                        </div>
                                        
                                        {/* Best Colors */}
                                        <div>
                                            <span className="text-sm text-gray-600">Best Colors:</span>
                                            <div className="flex gap-2 mt-2">
                                                {outfitAnalysis.bestColors.map((color, index) => (
                                                    <div key={index} className="text-center">
                                                        <div
                                                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                                                            style={{ backgroundColor: color }}
                                                            title={color}
                                                        />
                                                        <p className="text-xs mt-1 capitalize">{color}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Outfit Score */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Outfit Score:</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex">
                                                    {[...Array(10)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 h-2 rounded-full mx-1 ${
                                                                i < outfitAnalysis.outfitScore
                                                                    ? 'bg-purple-600'
                                                                    : 'bg-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="font-bold text-purple-900">{outfitAnalysis.outfitScore}/10</span>
                                            </div>
                                        </div>
                                        
                                        {/* Style Suggestions */}
                                        <div>
                                            <span className="text-sm text-gray-600">Style Tips:</span>
                                            <ul className="mt-2 space-y-1">
                                                {outfitAnalysis.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                        <span className="text-purple-600">•</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recommended Outfit */}
                            {recommendedOutfit.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-purple-600" />
                                        Complete This Look
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {recommendedOutfit.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => selectProductForTryOn(product)}
                                                className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                                                    <p className="text-lg font-bold text-purple-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Try-On Result Modal */}
            {tryOnResult && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Your Virtual Try-On Result</h3>
                                <button
                                    onClick={() => setTryOnResult(null)}
                                    className="text-gray-500 hover:text-gray-900"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <img
                                    src={tryOnResult}
                                    alt="Try-on result"
                                    className="w-full rounded-lg"
                                />
                                
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                                        Save to Gallery
                                    </button>
                                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                                        Share Look
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EnhancedTryOn;
