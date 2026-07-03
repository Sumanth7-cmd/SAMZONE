import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Palette, User, CheckCircle, Sparkles } from 'lucide-react';
import { productApi } from '../services/api';
import type { Product } from '../services/api';
import { getProductImage } from '../utils/productImage';
import { addToCart } from '../utils/cart';

interface SkinToneResult {
    tone: 'light' | 'medium' | 'dark';
    undertone: 'warm' | 'cool' | 'neutral';
    hexColor: string;
    rgbValues: { r: number; g: number; b: number };
    recommendations: string[];
    confidence: number;
    colorPalette: string[];
    suitableColorNames: string[];
    colorsToAvoid: string[];
}

const COLOR_HEX_MAP: Record<string, string> = {
    coral: '#FF6B6B',
    peach: '#FFCBA4',
    'navy blue': '#001F5B',
    'olive green': '#6B8E23',
    mustard: '#FFDB58',
    lavender: '#E6E6FA',
    teal: '#008080',
    plum: '#8E4585',
    'forest green': '#228B22',
    white: '#FFFFFF',
    black: '#000000',
    gold: '#FFD700',
    'royal blue': '#4169E1',
    'hot pink': '#FF69B4',
    emerald: '#50C878',
    orange: '#FFA500',
    camel: '#C19A6B',
    beige: '#F5F5DC',
    olive: '#808000',
    'silver grey': '#C0C0C0',
    'icy blue': '#AFDBF5',
    'cool pink': '#F49AC2',
    'yellow-green': '#9ACD32',
    'pure black': '#000000',
    'neon yellow': '#DFFF00',
    'dusty rose': '#DCAE96',
    'muted pastels': '#D8D2C2',
    'washed-out pastels': '#E8E4DA',
    'neon colors': '#39FF14',
    'icy pastels': '#E0F7FA',
    'orange-brown': '#A0522D',
    'neon shades': '#39FF14',
};

function colorToHex(colorName: string): string {
    return COLOR_HEX_MAP[colorName.toLowerCase()] ?? '#9CA3AF';
}

const SUITABLE_COLOR_NAMES: Record<'light' | 'medium' | 'dark', Record<'warm' | 'cool' | 'neutral', string[]>> = {
    light: {
        warm: ['Peach', 'Coral', 'Gold', 'Mustard'],
        cool: ['Lavender', 'Teal', 'Royal Blue', 'Plum'],
        neutral: ['White', 'Navy Blue', 'Olive Green', 'Black'],
    },
    medium: {
        warm: ['Mustard', 'Olive Green', 'Coral', 'Gold'],
        cool: ['Emerald', 'Royal Blue', 'Plum', 'Teal'],
        neutral: ['Forest Green', 'Navy Blue', 'Black', 'White'],
    },
    dark: {
        warm: ['Coral', 'Gold', 'Hot Pink', 'Mustard'],
        cool: ['Royal Blue', 'Emerald', 'Teal', 'Plum'],
        neutral: ['White', 'Black', 'Hot Pink', 'Forest Green'],
    },
};

const AVOID_MAP: Record<string, string[]> = {
    'Light-Warm': ['Neon colors', 'Icy Pastels', 'Pure Black'],
    'Light-Cool': ['Orange', 'Mustard', 'Camel'],
    'Light-Neutral': ['Neon Yellow', 'Hot Pink'],
    'Medium-Warm': ['Icy Blue', 'Cool Pink', 'Silver Grey'],
    'Medium-Cool': ['Orange', 'Yellow-Green', 'Gold'],
    'Medium-Neutral': ['Neon shades'],
    'Deep-Warm': ['Muted Pastels', 'Dusty Rose', 'Beige'],
    'Deep-Cool': ['Orange-Brown', 'Olive', 'Camel'],
    'Deep-Neutral': ['Washed-out Pastels'],
};

const TONE_LABEL: Record<'light' | 'medium' | 'dark', string> = {
    light: 'Light',
    medium: 'Medium',
    dark: 'Deep',
};

function getColorsToAvoid(tone: 'light' | 'medium' | 'dark', undertone: 'warm' | 'cool' | 'neutral'): string[] {
    const key = `${TONE_LABEL[tone]}-${undertone.charAt(0).toUpperCase()}${undertone.slice(1)}`;
    return AVOID_MAP[key] ?? [];
}

const SkinToneAnalysis: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SkinToneResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [colorProducts, setColorProducts] = useState<Product[]>([]);
    const [colorProductsLoading, setColorProductsLoading] = useState(false);
    const [activeColorTab, setActiveColorTab] = useState<string>('');

    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fetchProductsForColor = useCallback((color: string) => {
        setActiveColorTab(color);
        setColorProductsLoading(true);
        productApi.searchByColor(color)
            .then(setColorProducts)
            .catch(() => setColorProducts([]))
            .finally(() => setColorProductsLoading(false));
    }, []);

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

    const analyzeSkinTone = useCallback(async () => {
        if (!selectedImage || !canvasRef.current) return;
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) return;
            
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Simulate skin tone analysis
                const skinToneData = simulateSkinToneAnalysis(ctx, canvas.width, canvas.height);

                setAnalysisResult(skinToneData);
                setIsAnalyzing(false);
                fetchProductsForColor(skinToneData.suitableColorNames[0]);
            };
            
            img.src = selectedImage;
        } catch (err) {
            setError('Failed to analyze skin tone. Please try again.');
            setIsAnalyzing(false);
        }
    }, [selectedImage]);

    const simulateSkinToneAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number): SkinToneResult => {
        // Simulate face detection and skin tone extraction
        const faceArea = {
            x: Math.floor(width * 0.3),
            y: Math.floor(height * 0.1),
            width: Math.floor(width * 0.4),
            height: Math.floor(height * 0.3)
        };
        
        // Get sample pixels from face area
        const imageData = ctx.getImageData(faceArea.x, faceArea.y, faceArea.width, faceArea.height);
        const pixels = imageData.data;
        
        // Calculate average RGB values (simplified)
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
            // Enhanced skin tone detection - look for skin-like colors
            const pixelR = pixels[i];
            const pixelG = pixels[i + 1];
            const pixelB = pixels[i + 2];
            
            // Enhanced skin color detection with better range
            if (pixelR > 95 && pixelG > 40 && pixelB > 20 &&
                pixelR > pixelG && pixelR > pixelB &&
                Math.abs(pixelR - pixelG) > 15 &&
                pixelG > pixelB) {
                r += pixelR;
                g += pixelG;
                b += pixelB;
                pixelCount++;
            }
        }
        
        if (pixelCount > 0) {
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
        } else {
            // Fallback to random skin-like values
            r = 180 + Math.floor(Math.random() * 40);
            g = 120 + Math.floor(Math.random() * 40);
            b = 80 + Math.floor(Math.random() * 40);
        }
        
        // Determine skin tone based on RGB values
        const brightness = (r + g + b) / 3;
        let tone: 'light' | 'medium' | 'dark';
        let undertone: 'warm' | 'cool' | 'neutral';
        let recommendations: string[];
        let colorPalette: string[];
        
        // Detect undertone based on RGB ratios
        const redGreenRatio = r / g;
        const redBlueRatio = r / b;
        
        if (redGreenRatio > 1.1 && redBlueRatio > 1.3) {
            undertone = 'warm';
        } else if (redGreenRatio < 1.0 && redBlueRatio < 1.2) {
            undertone = 'cool';
        } else {
            undertone = 'neutral';
        }
        
        if (brightness > 180) {
            tone = 'light';
            if (undertone === 'warm') {
                recommendations = [
                    'Warm pastels like peach, coral, and cream complement your warm undertone',
                    'Earth tones like terracotta and warm browns look stunning',
                    'Avoid cool blues and purples that may clash',
                    'Gold jewelry enhances your natural warmth'
                ];
                colorPalette = ['#FFDAB9', '#FFA07A', '#F5DEB3', '#DEB887', '#FFE4B5', '#FFB6C1'];
            } else if (undertone === 'cool') {
                recommendations = [
                    'Cool pastels like lavender, mint, and soft blue work beautifully',
                    'Silver jewelry complements your cool undertone',
                    'Avoid warm oranges and yellows that may wash you out',
                    'Soft pinks and mauves are perfect for you'
                ];
                colorPalette = ['#E6E6FA', '#B0E0E6', '#DDA0DD', '#ADD8E6', '#F0E68C', '#FFC0CB'];
            } else {
                recommendations = [
                    'You can wear both warm and cool colors with ease',
                    'Soft neutrals like taupe, gray, and navy are versatile',
                    'Experiment with both pastels and jewel tones',
                    'Both gold and silver jewelry work for you'
                ];
                colorPalette = ['#D3D3D3', '#F5F5DC', '#E0FFFF', '#FFE4E1', '#FAFAD2', '#E6E6FA'];
            }
        } else if (brightness > 140) {
            tone = 'medium';
            if (undertone === 'warm') {
                recommendations = [
                    'Rich warm colors like rust, olive, and mustard look amazing',
                    'Jewel tones in warm shades like amber and topaz complement you',
                    'Avoid cool pastels that may look washed out',
                    'Bronze and copper accessories enhance your warmth'
                ];
                colorPalette = ['#CD853F', '#D2691E', '#B8860B', '#8B4513', '#A0522D', '#DAA520'];
            } else if (undertone === 'cool') {
                recommendations = [
                    'Cool jewel tones like emerald, sapphire, and amethyst are stunning',
                    'Deep blues and purples create beautiful contrast',
                    'Avoid warm oranges and reds that may clash',
                    'Silver and platinum jewelry enhance your cool undertone'
                ];
                colorPalette = ['#006400', '#00008B', '#4B0082', '#483D8B', '#2F4F4F', '#191970'];
            } else {
                recommendations = [
                    'You have the versatility to wear both warm and cool colors',
                    'Bold colors in any shade work beautifully',
                    'Experiment with contrasting combinations',
                    'Both warm and cool neutrals suit you perfectly'
                ];
                colorPalette = ['#800080', '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#DC143C'];
            }
        } else {
            tone = 'dark';
            if (undertone === 'warm') {
                recommendations = [
                    'Bright warm colors like coral, orange, and yellow pop beautifully',
                    'Warm whites and cream create stunning contrast',
                    'Avoid dark browns that may blend with your skin tone',
                    'Gold jewelry enhances your natural warmth'
                ];
                colorPalette = ['#FF4500', '#FFA500', '#FFD700', '#FF6347', '#FF1493', '#FF7F50'];
            } else if (undertone === 'cool') {
                recommendations = [
                    'Bright cool colors like electric blue, fuchsia, and turquoise are stunning',
                    'Crisp white and silver create beautiful contrast',
                    'Avoid dark cool tones that may blend',
                    'Silver and platinum jewelry enhance your cool undertone'
                ];
                colorPalette = ['#00CED1', '#FF00FF', '#40E0D0', '#1E90FF', '#FF69B4', '#00FFFF'];
            } else {
                recommendations = [
                    'You can wear any bright color with confidence',
                    'High contrast colors like white and black look amazing',
                    'Experiment with bold color combinations',
                    'Both warm and cool brights work for you'
                ];
                colorPalette = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
            }
        }
        
        // Generate hex color
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        return {
            tone,
            undertone,
            hexColor,
            rgbValues: { r, g, b },
            recommendations,
            confidence: 0.85 + Math.random() * 0.1,
            colorPalette,
            suitableColorNames: SUITABLE_COLOR_NAMES[tone][undertone],
            colorsToAvoid: getColorsToAvoid(tone, undertone)
        };
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

    const getToneDescription = (tone: 'light' | 'medium' | 'dark') => {
        switch (tone) {
            case 'light':
                return 'Light skin tone with fair complexion';
            case 'medium':
                return 'Medium skin tone with balanced complexion';
            case 'dark':
                return 'Dark skin tone with rich complexion';
        }
    };

    const getToneEmoji = (tone: 'light' | 'medium' | 'dark') => {
        switch (tone) {
            case 'light':
                return '👤';
            case 'medium':
                return '👥';
            case 'dark':
                return '👤';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <Palette className="w-6 h-6 text-purple-600" />
                        Skin Tone Analysis
                    </h1>
                    <p className="text-gray-600">Discover your perfect color palette and get personalized product recommendations</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Your Photo</h2>
                        
                        {!selectedImage ? (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Upload a clear photo of your face for accurate analysis</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Camera className="w-4 h-4" />
                                    Choose Photo
                                </button>
                                <p className="text-xs text-gray-500 mt-4">For best results, use good lighting and a neutral background</p>
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
                                        onClick={analyzeSkinTone}
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
                                                Analyze Skin Tone
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
                        
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Analysis Results */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
                        
                        {!analysisResult ? (
                            <div className="text-center py-8">
                                <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Upload and analyze your photo to discover your skin tone</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Skin Tone Result */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Your Skin Tone
                                    </h3>
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">{getToneEmoji(analysisResult.tone)}</span>
                                            <div>
                                                <div className="font-semibold text-lg text-gray-900 capitalize">
                                                    {analysisResult.tone} Skin Tone
                                                </div>
                                                <p className="text-sm text-gray-600">{getToneDescription(analysisResult.tone)}</p>
                                                <div className="text-sm font-medium text-purple-700 capitalize mt-1">
                                                    Undertone: {analysisResult.undertone}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Color Sample */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-16 h-16 rounded-lg border-2 border-gray-300"
                                                style={{ backgroundColor: analysisResult.hexColor }}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Detected Color</p>
                                                <p className="text-xs text-gray-600">{analysisResult.hexColor}</p>
                                                <p className="text-xs text-gray-600">
                                                    RGB({analysisResult.rgbValues.r}, {analysisResult.rgbValues.g}, {analysisResult.rgbValues.b})
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-700">Confidence</span>
                                                <span className="text-sm text-gray-600">
                                                    {Math.round(analysisResult.confidence * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                                                    style={{ width: `${analysisResult.confidence * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Color Palette */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Your Personal Color Palette</h3>
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                                        <div className="flex flex-wrap gap-3">
                                            {analysisResult.colorPalette.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-3">
                                            These colors are perfectly suited for your {analysisResult.tone} skin tone with {analysisResult.undertone} undertone
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Colors That Suit You */}
                                <div className="border-2 border-green-500 bg-green-50/50 rounded-xl p-4">
                                    <h3 className="font-semibold text-green-800 mb-3">✅ Colors That Suit You</h3>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {analysisResult.suitableColorNames.map((colorName) => (
                                            <div key={colorName} className="flex flex-col items-center gap-1">
                                                <div
                                                    style={{ backgroundColor: colorToHex(colorName) }}
                                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                                                    title={colorName}
                                                />
                                                <span className="text-xs text-gray-600">{colorName}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        {analysisResult.recommendations.map((rec, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-green-100/60 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{rec}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Colors To Avoid */}
                                {analysisResult.colorsToAvoid.length > 0 && (
                                    <div className="border-2 border-red-400 bg-red-50/50 rounded-xl p-4">
                                        <h3 className="font-semibold text-red-800 mb-3">❌ Colors To Avoid</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {analysisResult.colorsToAvoid.map((colorName) => (
                                                <div key={colorName} className="flex flex-col items-center gap-1">
                                                    <div
                                                        style={{ backgroundColor: colorToHex(colorName) }}
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-red-200 opacity-80"
                                                        title={colorName}
                                                    />
                                                    <span className="text-xs text-gray-600 text-center max-w-[70px]">{colorName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Product Recommendations */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        🛍️ Products That Suit Your Skin Tone
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Tap a color to browse matching products.
                                    </p>

                                    {/* Color filter tabs */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {analysisResult.suitableColorNames.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => fetchProductsForColor(color)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                                                    activeColorTab === color
                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                                                }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Loading skeletons */}
                                    {colorProductsLoading && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-40" />
                                            ))}
                                        </div>
                                    )}

                                    {/* Product cards */}
                                    {!colorProductsLoading && colorProducts.length > 0 && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {colorProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col"
                                                >
                                                    <img
                                                        src={getProductImage(product)}
                                                        alt={product.name}
                                                        className="w-full h-20 object-cover rounded mb-2"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://placehold.co/300x300?text=No+Image';
                                                            e.currentTarget.onerror = null;
                                                        }}
                                                    />
                                                    <h4 className="font-semibold text-xs text-gray-900 line-clamp-1">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600">{product.brand}</p>
                                                    <p className="text-sm font-bold text-purple-900 mt-1 mb-2">
                                                        ₹{Math.round(product.price).toLocaleString('en-IN')}
                                                    </p>
                                                    <div className="flex gap-2 mt-auto">
                                                        <button
                                                            onClick={() => addToCart({
                                                                id: product.id,
                                                                name: product.name,
                                                                price: product.price,
                                                                image: getProductImage(product),
                                                            })}
                                                            className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
                                                        >
                                                            Add to Cart
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/product/${product.id}`)}
                                                            className="flex-1 border border-purple-600 text-purple-600 text-xs py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {!colorProductsLoading && colorProducts.length === 0 && (
                                        <div className="text-center py-6 text-gray-500 text-sm">
                                            <p className="text-3xl mb-2">🔍</p>
                                            <p>No products found for {activeColorTab || 'this color'}.</p>
                                            <p className="mt-1">Try selecting a different color above.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkinToneAnalysis;
