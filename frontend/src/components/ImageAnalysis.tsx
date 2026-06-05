import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Palette, Sparkles, Loader2, ShoppingBag } from 'lucide-react';
import { realisticProducts, type Product } from '../data/realisticProducts';

interface SkinToneAnalysis {
    skinTone: 'light' | 'medium' | 'dark';
    undertones: string[];
    bestColors: string[];
    avoidColors: string[];
    confidence: number;
    recommendations: string[];
}

interface ImageAnalysisProps {
    onAnalysisComplete?: (analysis: SkinToneAnalysis) => void;
    onProductSuggestions?: (products: Product[]) => void;
}

const ImageAnalysis: React.FC<ImageAnalysisProps> = ({
    onAnalysisComplete,
    onProductSuggestions
}) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<SkinToneAnalysis | null>(null);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Handle image upload
    const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('Image size should be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setSelectedImage(result);
            setError(null);
            setAnalysis(null);
            setSuggestedProducts([]);
        };
        reader.readAsDataURL(file);
    }, []);

    // Trigger file input
    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Remove selected image
    const removeImage = useCallback(() => {
        setSelectedImage(null);
        setAnalysis(null);
        setSuggestedProducts([]);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Analyze image for skin tone
    const analyzeImage = useCallback(async () => {
        if (!selectedImage || !canvasRef.current) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // Load image to canvas
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = selectedImage;
            });

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Set canvas size
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Get image data for analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Simulate skin tone analysis (in real implementation, you'd use ML models)
            const analysisResult = performSkinToneAnalysis(data);
            
            setAnalysis(analysisResult);
            onAnalysisComplete?.(analysisResult);

            // Get product suggestions based on analysis
            const products = getProductSuggestions(analysisResult);
            setSuggestedProducts(products);
            onProductSuggestions?.(products);

        } catch (error) {
            console.error('Analysis error:', error);
            setError('Failed to analyze image. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedImage, onAnalysisComplete, onProductSuggestions]);

    // Perform skin tone analysis (simulated)
    const performSkinToneAnalysis = (imageData: Uint8ClampedArray): SkinToneAnalysis => {
        // Sample pixels from center region (where face is likely to be)
        const width = Math.sqrt(imageData.length / 4);
        const height = width;
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const sampleSize = 50;

        let totalR = 0, totalG = 0, totalB = 0;
        let sampleCount = 0;

        // Sample pixels from center region
        for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
            for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const index = (y * width + x) * 4;
                    totalR += imageData[index];
                    totalG += imageData[index + 1];
                    totalB += imageData[index + 2];
                    sampleCount++;
                }
            }
        }

        // Calculate average color
        const avgR = totalR / sampleCount;
        const avgG = totalG / sampleCount;
        const avgB = totalB / sampleCount;

        // Determine skin tone based on color values
        const brightness = (avgR + avgG + avgB) / 3;
        const warmth = avgR - avgB;

        let skinTone: 'light' | 'medium' | 'dark';
        let undertones: string[];
        let bestColors: string[];
        let avoidColors: string[];
        let confidence: number;

        if (brightness > 180) {
            skinTone = 'light';
            undertones = ['cool', 'neutral'];
            bestColors = ['navy', 'burgundy', 'emerald', 'plum', 'charcoal'];
            avoidColors = ['beige', 'light brown', 'pale yellow'];
            confidence = 0.85;
        } else if (brightness > 120) {
            skinTone = 'medium';
            undertones = warmth > 10 ? ['warm', 'neutral'] : ['cool', 'neutral'];
            bestColors = ['olive', 'navy', 'maroon', 'forest green', 'royal blue'];
            avoidColors = ['neon colors', 'pastels'];
            confidence = 0.90;
        } else {
            skinTone = 'dark';
            undertones = ['warm', 'deep'];
            bestColors = ['white', 'cream', 'gold', 'bright blue', 'emerald'];
            avoidColors = ['black', 'dark brown', 'charcoal'];
            confidence = 0.88;
        }

        const recommendations = [
            `Your ${skinTone} skin tone pairs beautifully with ${bestColors.slice(0, 3).join(', ')}`,
            `Consider ${undertones.join(' and ')} undertones for best color matching`,
            `Avoid ${avoidColors.slice(0, 2).join(' and ')} as they may wash you out`,
            `Metallic tones like ${skinTone === 'dark' ? 'gold' : 'silver'} complement your complexion`
        ];

        return {
            skinTone,
            undertones,
            bestColors,
            avoidColors,
            confidence,
            recommendations
        };
    };

    // Get product suggestions based on skin tone analysis
    const getProductSuggestions = (analysis: SkinToneAnalysis): Product[] => {
        const suggestions: Product[] = [];
        
        // Find products in recommended colors
        analysis.bestColors.forEach(color => {
            const colorProducts = realisticProducts.filter(product =>
                product.colors.some(productColor =>
                    productColor.toLowerCase().includes(color.toLowerCase())
                ) && product.inStock
            );
            
            // Add top rated products for each color
            colorProducts
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 2)
                .forEach(product => {
                    if (!suggestions.find(p => p.id === product.id)) {
                        suggestions.push(product);
                    }
                });
        });

        // Limit to 8 products
        return suggestions.slice(0, 8);
    };

    // Product card component
    const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
        const hasDiscount = product.discount && product.discount > 0;
        const discountedPrice = hasDiscount ? product.price * (1 - (product.discount || 0) / 100) : product.price;

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex gap-3">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
                        <p className="text-xs text-gray-600">{product.brand}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {hasDiscount && (
                                <span className="text-xs text-gray-500 line-through">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                            )}
                            <span className="text-sm font-bold text-purple-900">
                                ₹{discountedPrice.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    Upload Your Photo
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                    Upload a clear photo of yourself to get personalized color recommendations and product suggestions.
                </p>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {/* Upload area */}
                {!selectedImage ? (
                    <div
                        onClick={triggerFileInput}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                    >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Image preview */}
                        <div className="relative">
                            <img
                                src={selectedImage}
                                alt="Uploaded"
                                className="w-full h-64 object-cover rounded-lg"
                            />
                            <button
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Analyze button */}
                        <button
                            onClick={analyzeImage}
                            disabled={isAnalyzing}
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Analyze Skin Tone & Get Recommendations
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-600" />
                        Your Color Analysis
                    </h3>

                    <div className="space-y-4">
                        {/* Skin Tone */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Skin Tone:</span>
                            <span className="text-sm font-bold capitalize">{analysis.skinTone}</span>
                        </div>

                        {/* Undertones */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Undertones:</span>
                            <div className="flex gap-2 mt-2">
                                {analysis.undertones.map((undertone, index) => (
                                    <span
                                        key={index}
                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                    >
                                        {undertone}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Best Colors */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Best Colors:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {analysis.bestColors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border border-gray-300"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-xs capitalize">{color}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Confidence */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Analysis Confidence:</span>
                            <span className="text-sm font-bold">{Math.round(analysis.confidence * 100)}%</span>
                        </div>

                        {/* Recommendations */}
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-purple-700">Recommendations:</span>
                            <ul className="mt-2 space-y-1">
                                {analysis.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-purple-600 flex items-start gap-2">
                                        <span className="text-purple-500">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Suggestions */}
            {suggestedProducts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                        Recommended Products
                    </h3>

                    <div className="space-y-3">
                        {suggestedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}

            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ImageAnalysis;
