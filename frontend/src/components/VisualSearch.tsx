import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Sparkles } from 'lucide-react';
import type { Product } from '../services/api';

interface ImageFeatures {
    dominantColor: string;
    category: string;
    style: string;
    confidence: number;
}

interface SimilarityResult {
    product: Product;
    score: number;
    reasons: string[];
}

const VisualSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageFeatures, setImageFeatures] = useState<ImageFeatures | null>(null);
    const [similarProducts, setSimilarProducts] = useState<SimilarityResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Analyze uploaded image
    const analyzeImage = useCallback(() => {
        if (!uploadedImage || !canvasRef.current || !imageRef.current) return;

        setIsAnalyzing(true);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        if (!ctx || !img) return;

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze color histogram
        const colorCounts: { [key: string]: number } = {};
        let totalPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Skip transparent or very dark pixels
            if (a < 50) continue;

            // Quantize color
            const quantizedR = Math.floor(r / 51) * 51;
            const quantizedG = Math.floor(g / 51) * 51;
            const quantizedB = Math.floor(b / 51) * 51;

            const color = `${quantizedR},${quantizedG},${quantizedB}`;
            colorCounts[color] = (colorCounts[color] || 0) + 1;
            totalPixels++;
        }

        // Find dominant color
        const dominantColor = Object.keys(colorCounts).reduce((a, b) => 
            colorCounts[a] > colorCounts[b] ? a : b, ''
        );

        // Determine color category
        let colorCategory = '';
        let confidence = 0;

        const rgb = dominantColor.split(',').map(Number);
        if (rgb.length === 3) {
            const [r, g, b] = rgb;
            const brightness = (r + g + b) / 3;
            
            if (brightness < 100) {
                colorCategory = 'black';
                confidence = 0.9;
            } else if (brightness < 180) {
                colorCategory = 'gray';
                confidence = 0.8;
            } else if (r > g && r > b) {
                colorCategory = 'brown';
                confidence = 0.7;
            } else if (g > b && b > r) {
                colorCategory = 'blue';
                confidence = 0.8;
            } else if (r > 200 && g > 200 && b > 200) {
                colorCategory = 'white';
                confidence = 0.9;
            } else if (r > 150 && g > 150 && b < 150) {
                colorCategory = 'yellow';
                confidence = 0.7;
            } else if (r > 150 && b > 150 && b > 150) {
                colorCategory = 'green';
                confidence = 0.6;
            } else {
                colorCategory = 'unknown';
                confidence = 0.5;
            }
        }

        // Guess category based on image patterns
        let categoryGuess = 'unknown';
        if (canvas.width && canvas.height) {
            const aspectRatio = canvas.width / canvas.height;
            
            // Hoodie/Jacket: wider aspect ratio
            if (aspectRatio > 0.8) {
                categoryGuess = 'hoodie';
            }
            // Pants: tall aspect ratio
            else if (aspectRatio < 0.6) {
                categoryGuess = 'pants';
            }
            // Shirt: square aspect ratio
            else if (aspectRatio >= 0.6 && aspectRatio <= 0.8) {
                categoryGuess = 'shirt';
            }
            // Shoes: wide aspect ratio
            else if (aspectRatio > 1.2) {
                categoryGuess = 'shoes';
            }
        }

        setTimeout(() => {
            const mockFeatures: ImageFeatures = {
            dominantColor: dominantColor,
            category: categoryGuess,
            style: 'casual',
            confidence: 0.85
        };

        setImageFeatures(mockFeatures);
        setIsAnalyzing(false);
        }, 2000);
    }, [uploadedImage, canvasRef, imageRef]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedImage(result);
            
            setTimeout(() => {
                // Simulate image analysis for analysis
                if (imageRef.current) {
                    imageRef.current.onload = () => analyzeImage();
                    imageRef.current.src = result;
                }
            }, 0);
        };
        reader.readAsDataURL(file);
    };

    const handleClose = () => {
        setIsOpen(false);
        setUploadedImage(null);
        setImageFeatures(null);
        setSimilarProducts([]);
    };

    return (
        <>
            {/* Search Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 z-50 flex items-center gap-2"
            >
                <Camera className="w-6 h-6" />
                <span className="font-medium">Visual Search</span>
            </button>

            {/* Visual Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <h2 className="text-2xl font-bold text-gray-900">Visual Search</h2>
                                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">AI-Powered</span>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                            {/* Upload Section */}
                            <div className="lg:col-span-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Clothing Image</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 p-8 rounded-xl transition-colors"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                        <span className="text-lg font-medium text-gray-700">Choose an image</span>
                                        <p className="text-sm text-gray-500">Upload a photo of clothing to find similar items</p>
                                    </label>
                                </div>

                                {uploadedImage && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Uploaded Image</h4>
                                        <div className="relative rounded-lg overflow-hidden">
                                            <img 
                                                src={uploadedImage} 
                                                alt="Uploaded clothing" 
                                                className="w-full h-48 object-cover"
                                            />
                                            {isAnalyzing && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="text-white text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                                        <p className="text-sm">Analyzing image...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {imageFeatures && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Detected Features</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Category:</span>
                                                <span className="text-lg font-bold text-gray-900 capitalize">{imageFeatures.category}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Dominant Color:</span>
                                                <span className={`text-lg font-bold capitalize ${
                                                    imageFeatures.dominantColor === 'black' ? 'text-gray-900' :
                                                    imageFeatures.dominantColor === 'white' ? 'text-gray-100' :
                                                    imageFeatures.dominantColor === 'gray' ? 'text-gray-600' :
                                                    'text-gray-700'
                                                }`}>
                                                    {imageFeatures.dominantColor}
                                                </span>
                                                <span className="text-sm text-gray-500">({Math.round(imageFeatures.confidence * 100)}% confidence)</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Detected Style:</span>
                                                <span className="text-lg font-bold text-gray-900 capitalize">{imageFeatures.style}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Results Section */}
                            {similarProducts.length > 0 && (
                                <div className="lg:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Products</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {similarProducts.map((result) => (
                                            <div key={result.product.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                                                <div className="flex gap-4">
                                                    <img 
                                                        src={result.product.image}
                                                        alt={result.product.name}
                                                        className="w-24 h-24 object-cover rounded-lg"
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900">{result.product.name}</h4>
                                                        <p className="text-sm text-gray-600">{result.product.brand}</p>
                                                        <p className="text-lg font-bold text-purple-900">₹{result.product.price?.toLocaleString('en-IN')}</p>
                                                        
                                                        {/* Score */}
                                                        <div className="mt-2">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm font-medium text-gray-600">Match Score:</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${(result.score / 10) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-lg font-bold text-purple-900">{result.score}/10</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Match Reasons */}
                                                            <div className="text-xs text-gray-500">
                                                                {result.reasons.join(' • ')}
                                                            </div>
                                                            
                                                            {/* Actions */}
                                                            <div className="mt-4 flex gap-2">
                                                                <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                                                                    View Details
                                                                </button>
                                                                <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                                                                    Add to Cart
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VisualSearch;
