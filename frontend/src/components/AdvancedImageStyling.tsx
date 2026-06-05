import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Sparkles, Search, Palette, TrendingUp, Eye } from 'lucide-react';
import { expandedProductCatalog, type Product } from '../data/expandedProductCatalog';

interface DetectedItem {
    id: string;
    type: 'shirt' | 'pants' | 'dress' | 'shoes' | 'accessory' | 'jacket' | 'unknown';
    color: string;
    style: string;
    confidence: number;
    position: { x: number; y: number };
    boundingBox: { width: number; height: number };
}

interface StyleAnalysis {
    detectedItems: DetectedItem[];
    overallStyle: 'casual' | 'formal' | 'sporty' | 'trendy' | 'classic';
    colorPalette: string[];
    styleScore: number;
    recommendations: {
        betterAlternatives: Product[];
        matchingItems: Product[];
        complementaryItems: Product[];
    };
    improvements: string[];
}

const AdvancedImageStyling: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<StyleAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDetection, setShowDetection] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size should be less than 10MB');
                return;
            }
            
            setError(null);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setSelectedImage(result);
                setAnalysisResult(null);
            };
            
            reader.readAsDataURL(file);
        }
    }, []);

    const analyzeImage = useCallback(async () => {
        if (!selectedImage || !canvasRef.current) return;
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;
            
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const analysis = performAdvancedStyleAnalysis(ctx, canvas.width, canvas.height);
                
                setAnalysisResult(analysis);
                setIsAnalyzing(false);
            };
            
            img.src = selectedImage;
        } catch (err) {
            setError('Failed to analyze image. Please try again.');
            setIsAnalyzing(false);
        }
    }, [selectedImage]);

    const performAdvancedStyleAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number): StyleAnalysis => {
        // Simulate advanced AI clothing detection
        const detectedItems = simulateClothingDetection(width, height);
        const overallStyle = determineOverallStyle(detectedItems);
        const colorPalette = extractColorPalette(ctx, width, height);
        const styleScore = calculateStyleScore(detectedItems, overallStyle);
        
        return {
            detectedItems,
            overallStyle,
            colorPalette,
            styleScore,
            recommendations: generateStyleRecommendations(detectedItems, overallStyle, colorPalette),
            improvements: generateStyleImprovements(detectedItems, overallStyle)
        };
    };

    const simulateClothingDetection = (width: number, height: number): DetectedItem[] => {
        const items: DetectedItem[] = [];
        const clothingTypes = ['shirt', 'pants', 'dress', 'shoes', 'accessory', 'jacket'];
        const colors = ['Black', 'White', 'Blue', 'Gray', 'Red', 'Green', 'Brown', 'Navy'];
        const styles = ['casual', 'formal', 'sporty', 'trendy', 'classic'];
        
        // Simulate detecting 3-6 items
        const numItems = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numItems; i++) {
            items.push({
                id: `item_${i}`,
                type: clothingTypes[Math.floor(Math.random() * clothingTypes.length)] as DetectedItem['type'],
                color: colors[Math.floor(Math.random() * colors.length)],
                style: styles[Math.floor(Math.random() * styles.length)],
                confidence: 0.7 + Math.random() * 0.3,
                position: {
                    x: Math.floor(Math.random() * width),
                    y: Math.floor(Math.random() * height)
                },
                boundingBox: {
                    width: 50 + Math.floor(Math.random() * 100),
                    height: 50 + Math.floor(Math.random() * 100)
                }
            });
        }
        
        return items;
    };

    const determineOverallStyle = (items: DetectedItem[]): StyleAnalysis['overallStyle'] => {
        const styles = items.map(item => item.style);
        const styleCounts: { [key: string]: number } = {};
        
        styles.forEach(style => {
            styleCounts[style] = (styleCounts[style] || 0) + 1;
        });
        
        let maxCount = 0;
        let dominantStyle: StyleAnalysis['overallStyle'] = 'casual';
        
        Object.entries(styleCounts).forEach(([style, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantStyle = style as StyleAnalysis['overallStyle'];
            }
        });
        
        return dominantStyle;
    };

    const extractColorPalette = (_ctx: CanvasRenderingContext2D, _width: number, _height: number): string[] => {
        // Simulate color extraction
        const sampleColors = ['Black', 'White', 'Navy', 'Gray', 'Blue', 'Brown', 'Beige', 'Red'];
        const numColors = 3 + Math.floor(Math.random() * 3);
        
        return sampleColors.slice(0, numColors);
    };

    const calculateStyleScore = (items: DetectedItem[], _style: string): number => {
        const baseScore = 0.6;
        const itemBonus = Math.min(items.length * 0.1, 0.3);
        const confidenceBonus = items.reduce((sum, item) => sum + item.confidence, 0) / items.length * 0.1;
        
        return Math.min(baseScore + itemBonus + confidenceBonus, 1.0);
    };

    const generateStyleRecommendations = (
        detectedItems: DetectedItem[], 
        overallStyle: string, 
        colorPalette: string[]
    ): StyleAnalysis['recommendations'] => {
        const betterAlternatives = findBetterAlternatives(detectedItems, overallStyle);
        const matchingItems = findMatchingItems(detectedItems, colorPalette);
        const complementaryItems = findComplementaryItems(detectedItems, overallStyle);
        
        return {
            betterAlternatives,
            matchingItems,
            complementaryItems
        };
    };

    const findBetterAlternatives = (detectedItems: DetectedItem[], _style: string): Product[] => {
        const alternatives: Product[] = [];
        
        detectedItems.forEach(item => {
            const categoryMap: { [key: string]: string } = {
                'shirt': 'mens-clothing',
                'pants': 'mens-clothing',
                'dress': 'womens-clothing',
                'shoes': 'footwear',
                'accessory': 'accessories',
                'jacket': 'mens-clothing'
            };
            
            const category = categoryMap[item.type] || 'mens-clothing';
            
            const matches = expandedProductCatalog.filter(product => 
                product.category === category &&
                product.subcategory === item.type &&
                product.colors.some(color => color.toLowerCase().includes(item.color.toLowerCase())) &&
                product.price > 2000 // Better alternatives are usually more expensive
            );
            
            alternatives.push(...matches.slice(0, 2));
        });
        
        return alternatives.slice(0, 6);
    };

    const findMatchingItems = (_detectedItems: DetectedItem[], colorPalette: string[]): Product[] => {
        const matches: Product[] = [];
        
        colorPalette.forEach(color => {
            const colorMatches = expandedProductCatalog.filter(product => 
                product.colors.some(productColor => 
                    productColor.toLowerCase().includes(color.toLowerCase())
                ) &&
                product.inStock &&
                product.rating > 4.0
            );
            
            matches.push(...colorMatches.slice(0, 2));
        });
        
        return matches.slice(0, 8);
    };

    const findComplementaryItems = (detectedItems: DetectedItem[], _style: string): Product[] => {
        const complementary: Product[] = [];
        
        // Add complementary items based on detected items
        detectedItems.forEach(item => {
            let complementaryCategory = '';
            
            switch (item.type) {
                case 'shirt':
                    complementaryCategory = 'accessories';
                    break;
                case 'pants':
                    complementaryCategory = 'footwear';
                    break;
                case 'dress':
                    complementaryCategory = 'accessories';
                    break;
                case 'shoes':
                    complementaryCategory = 'accessories';
                    break;
                default:
                    complementaryCategory = 'accessories';
            }
            
            const matches = expandedProductCatalog.filter(product => 
                product.category === complementaryCategory &&
                product.inStock &&
                product.rating > 3.5
            );
            
            complementary.push(...matches.slice(0, 2));
        });
        
        return complementary.slice(0, 6);
    };

    const generateStyleImprovements = (detectedItems: DetectedItem[], style: string): string[] => {
        const improvements: string[] = [];
        
        if (detectedItems.length < 3) {
            improvements.push('Add more layers to create a complete look');
        }
        
        if (style === 'casual') {
            improvements.push('Consider adding a blazer for a more polished look');
            improvements.push('Upgrade your footwear for better style impact');
        }
        
        if (style === 'formal') {
            improvements.push('Add a statement watch or accessory');
            improvements.push('Consider subtle color variations');
        }
        
        if (detectedItems.some(item => item.confidence < 0.8)) {
            improvements.push('Some items could be better fitted');
        }
        
        improvements.push('Consider the occasion and setting');
        improvements.push('Balance colors and patterns carefully');
        
        return improvements.slice(0, 4);
    };

    const clearImage = () => {
        setSelectedImage(null);
        setAnalysisResult(null);
        setError(null);
        setShowDetection(false);
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

    const getStyleIcon = (style: string) => {
        switch (style) {
            case 'casual': return '👕';
            case 'formal': return '🤵';
            case 'sporty': return '🏃';
            case 'trendy': return '✨';
            case 'classic': return '🎩';
            default: return '👔';
        }
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'shirt': return '👔';
            case 'pants': return '👖';
            case 'dress': return '👗';
            case 'shoes': return '👟';
            case 'accessory': return '⌚';
            case 'jacket': return '🧥';
            default: return '👕';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                        <Eye className="w-8 h-8 text-blue-600" />
                        Advanced Image-Based Styling AI
                    </h1>
                    <p className="text-gray-600">Upload your photo and get AI-powered fashion analysis, recommendations, and styling suggestions</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Photo</h2>
                        
                        {!selectedImage ? (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Upload a photo of your outfit for AI analysis</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Upload className="w-5 h-5" />
                                    Choose Photo
                                </button>
                                <p className="text-xs text-gray-500 mt-4">For best results: Full body shot, good lighting, clear outfit visible</p>
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
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Analyze Style
                                            </>
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowDetection(!showDetection)}
                                        className={`px-4 py-3 rounded-lg transition-colors ${
                                            showDetection 
                                                ? 'bg-purple-600 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        <Search className="w-4 h-4" />
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
                        
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Analysis Results */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Style Analysis</h2>
                        
                        {!analysisResult ? (
                            <div className="text-center py-12">
                                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Upload and analyze your photo to get AI-powered style recommendations</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Overall Style */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-blue-600" />
                                        Overall Style Analysis
                                    </h3>
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{getStyleIcon(analysisResult.overallStyle)}</span>
                                                <div>
                                                    <div className="font-semibold text-lg text-gray-900 capitalize">
                                                        {analysisResult.overallStyle} Style
                                                    </div>
                                                    <div className="text-sm text-gray-600">AI Confidence</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {Math.round(analysisResult.styleScore * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                                style={{ width: `${analysisResult.styleScore * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Detected Items */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Detected Items</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {analysisResult.detectedItems.map((item) => (
                                            <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-2xl">{getItemIcon(item.type)}</span>
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        {Math.round(item.confidence * 100)}%
                                                    </span>
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900 capitalize">{item.type}</div>
                                                    <div className="text-gray-600">{item.color} • {item.style}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Palette */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Color Palette</h3>
                                    <div className="flex gap-3">
                                        {analysisResult.colorPalette.map((color, index) => (
                                            <div key={index} className="text-center">
                                                <div
                                                    className="w-12 h-12 rounded-lg border-2 border-gray-300 mb-1"
                                                    style={{ backgroundColor: color.toLowerCase() }}
                                                />
                                                <span className="text-xs text-gray-600">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Style Improvements */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Style Improvements</h3>
                                    <div className="space-y-2">
                                        {analysisResult.improvements.map((improvement, index) => (
                                            <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                                                <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{improvement}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Product Recommendations */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">AI Recommendations</h3>
                                    
                                    {/* Better Alternatives */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Better Alternatives</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {analysisResult.recommendations.betterAlternatives.map((product) => (
                                                <div key={product.id} className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-16 object-cover rounded mb-1"
                                                    />
                                                    <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                                                    <p className="text-xs font-bold text-blue-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Matching Items */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Matching Items</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {analysisResult.recommendations.matchingItems.map((product) => (
                                                <div key={product.id} className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-16 object-cover rounded mb-1"
                                                    />
                                                    <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                                                    <p className="text-xs font-bold text-green-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Complementary Items */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Complementary Items</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {analysisResult.recommendations.complementaryItems.map((product) => (
                                                <div key={product.id} className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-16 object-cover rounded mb-1"
                                                    />
                                                    <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                                                    <p className="text-xs font-bold text-purple-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
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

export default AdvancedImageStyling;
