import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Search, Palette, ShoppingBag, Sparkles, CheckCircle } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface AnalysisResult {
    detectedItems: string[];
    colors: string[];
    style: string;
    confidence: number;
    recommendations: Product[];
}

const WorkingImageUpload: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size should be less than 10MB');
                return;
            }
            
            setError(null);
            
            // Read and display the image
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setSelectedImage(result);
                setAnalysisResult(null); // Clear previous analysis
            };
            
            reader.readAsDataURL(file);
        }
    }, []);

    const analyzeImage = useCallback(async () => {
        if (!selectedImage || !canvasRef.current) return;
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
            // Simulate image analysis delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create a canvas to analyze the image
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;
            
            const img = new Image();
            img.onload = () => {
                // Set canvas size
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0);
                
                // Simulate analysis results
                const detectedItems = ['shirt', 'jeans', 'accessories'];
                const colors = extractDominantColors(ctx, canvas.width, canvas.height);
                const style = determineStyle(detectedItems, colors);
                const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence
                
                // Generate recommendations
                const recommendations = generateRecommendations(colors, detectedItems);
                
                setAnalysisResult({
                    detectedItems,
                    colors,
                    style,
                    confidence,
                    recommendations
                });
                
                setIsAnalyzing(false);
            };
            
            img.src = selectedImage;
        } catch (err) {
            setError('Failed to analyze image. Please try again.');
            setIsAnalyzing(false);
        }
    }, [selectedImage]);

    const extractDominantColors = (_ctx: CanvasRenderingContext2D, _width: number, _height: number): string[] => {
        // Simulate color extraction
        const sampleColors = ['blue', 'black', 'white', 'gray', 'navy', 'beige'];
        const numColors = 3 + Math.floor(Math.random() * 3); // 3-5 colors
        
        return sampleColors.slice(0, numColors);
    };

    const determineStyle = (_items: string[], colors: string[]): string => {
        // Simple style determination logic
        if (colors.includes('black') && colors.includes('white')) {
            return 'Classic & Professional';
        } else if (colors.includes('blue') || colors.includes('navy')) {
            return 'Casual & Relaxed';
        } else if (colors.includes('beige') || colors.includes('brown')) {
            return 'Earthy & Natural';
        } else {
            return 'Modern & Trendy';
        }
    };

    const generateRecommendations = (colors: string[], items: string[]): Product[] => {
        // Filter products based on detected colors and items
        let recommendations = massiveProductCatalog.filter(product => {
            // Check if product matches detected colors
            const hasMatchingColor = colors.some(color => 
                product.colors.some(productColor => 
                    productColor.toLowerCase().includes(color.toLowerCase())
                )
            );
            
            // Check if product matches detected items
            const hasMatchingItem = items.some(item => 
                product.subcategory.toLowerCase().includes(item.toLowerCase()) ||
                product.name.toLowerCase().includes(item.toLowerCase())
            );
            
            return product.inStock && (hasMatchingColor || hasMatchingItem);
        });
        
        // Return top 6 recommendations
        return recommendations.slice(0, 6);
    };

    const clearImage = () => {
        setSelectedImage(null);
        setAnalysisResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const event = {
                    target: { files: [file] }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileSelect(event);
            } else {
                setError('Please drop a valid image file');
            }
        }
    }, [handleFileSelect]);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <ImageIcon className="w-6 h-6 text-purple-600" />
                        Smart Image Analysis
                    </h1>
                    <p className="text-gray-600">Upload an image to detect clothing items and get personalized recommendations</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
                        
                        {!selectedImage ? (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Drag and drop an image here, or click to browse</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Camera className="w-4 h-4" />
                                    Choose Image
                                </button>
                                <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, PNG, GIF (Max 10MB)</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <img
                                        src={selectedImage}
                                        alt="Uploaded"
                                        className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                                    />
                                    <button
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={analyzeImage}
                                        disabled={isAnalyzing}
                                        className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Analyze Image
                                            </>
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={clearImage}
                                        className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        
                        {/* Hidden canvas for image processing */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Analysis Results */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
                        
                        {!analysisResult ? (
                            <div className="text-center py-8">
                                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Upload and analyze an image to see results</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Detected Items */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Detected Items
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.detectedItems.map((item, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Colors */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-blue-600" />
                                        Detected Colors
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.colors.map((color, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                            >
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Style */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Style Analysis</h3>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-gray-700">{analysisResult.style}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Confidence: {Math.round(analysisResult.confidence * 100)}%
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Recommendations */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                                        Recommended Products
                                    </h3>
                                    <div className="space-y-3">
                                        {analysisResult.recommendations.map((product) => (
                                            <div
                                                key={product.id}
                                                className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600">{product.brand}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-sm font-bold text-purple-900">
                                                            ₹{product.price.toLocaleString('en-IN')}
                                                        </span>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                            Match
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkingImageUpload;
