import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Palette, Sparkles, Loader2, ShoppingBag } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface ClothingDetection {
    detectedItems: string[];
    colors: string[];
    style: string;
    confidence: number;
    recommendations: Product[];
}

const EnhancedImageUpload: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detection, setDetection] = useState<ClothingDetection | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setSelectedImage(e.target?.result as string);
            setError(null);
            setDetection(null);
        };
        reader.readAsDataURL(file);
    }, []);

    const analyzeImage = useCallback(async () => {
        if (!selectedImage || !canvasRef.current) return;

        setIsAnalyzing(true);
        setError(null);

        try {
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

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Simulate clothing detection
            const detectedItems = ['shirt', 'pants', 'shoes'];
            const colors = ['blue', 'black', 'white'];
            const style = 'casual';
            
            // Get similar products
            const recommendations = massiveProductCatalog
                .filter(p => p.inStock)
                .filter(p => detectedItems.some(item => p.subcategory.includes(item)))
                .filter(p => colors.some(color => p.colors.includes(color)))
                .slice(0, 8);

            setDetection({
                detectedItems,
                colors,
                style,
                confidence: 0.85,
                recommendations
            });
        } catch (error) {
            setError('Failed to analyze image');
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedImage]);

    const clearImage = useCallback(() => {
        setSelectedImage(null);
        setDetection(null);
        setError(null);
    }, []);

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    Upload & Analyze Your Photo
                </h3>
                
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {!selectedImage ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                    >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <img
                                src={selectedImage}
                                alt="Uploaded"
                                className="w-full h-64 object-cover rounded-lg"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        <button
                            onClick={analyzeImage}
                            disabled={isAnalyzing}
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Analyze Clothing & Get Recommendations
                                </>
                            )}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>

            {/* Detection Results */}
            {detection && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-600" />
                        Clothing Analysis Results
                    </h3>

                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Detected Items:</span>
                            <div className="flex gap-2 mt-2">
                                {detection.detectedItems.map((item, index) => (
                                    <span
                                        key={index}
                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full capitalize"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Colors:</span>
                            <div className="flex gap-2 mt-2">
                                {detection.colors.map((color, index) => (
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

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Style:</span>
                            <span className="text-sm ml-2 capitalize">{detection.style}</span>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Confidence:</span>
                            <span className="text-sm ml-2">{Math.round(detection.confidence * 100)}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Recommendations */}
            {detection?.recommendations && detection.recommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                        Recommended Products
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {detection.recommendations.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded-lg mb-2"
                                />
                                <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
                                <p className="text-xs text-gray-600">{product.brand}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm font-bold text-purple-900">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full ${
                                                    i < Math.floor(product.rating)
                                                        ? 'bg-yellow-400'
                                                        : 'bg-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default EnhancedImageUpload;
