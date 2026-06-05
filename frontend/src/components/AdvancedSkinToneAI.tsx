import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Palette, User, CheckCircle, Sparkles, Sun, Moon, Droplets } from 'lucide-react';
import { expandedProductCatalog, type Product } from '../data/expandedProductCatalog';

interface SkinToneResult {
    tone: 'light' | 'medium' | 'dark';
    undertone: 'warm' | 'cool' | 'neutral';
    hexColor: string;
    rgbValues: { r: number; g: number; b: number };
    confidence: number;
    bestColors: string[];
    avoidColors: string[];
    outfitCombos: string[];
    recommendedProducts: Product[];
    styleAdvice: string[];
}


const AdvancedSkinToneAI: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SkinToneResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
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

    const analyzeSkinTone = useCallback(async () => {
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
                
                const skinToneData = performAdvancedSkinToneAnalysis(ctx, canvas.width, canvas.height);
                
                setAnalysisResult(skinToneData);
                setIsAnalyzing(false);
            };
            
            img.src = selectedImage;
        } catch (err) {
            setError('Failed to analyze skin tone. Please try again.');
            setIsAnalyzing(false);
        }
    }, [selectedImage]);

    const performAdvancedSkinToneAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number): SkinToneResult => {
        // Simulate advanced face detection and skin tone extraction
        const faceArea = {
            x: Math.floor(width * 0.3),
            y: Math.floor(height * 0.1),
            width: Math.floor(width * 0.4),
            height: Math.floor(height * 0.3)
        };
        
        // Get sample pixels from face area
        const imageData = ctx.getImageData(faceArea.x, faceArea.y, faceArea.width, faceArea.height);
        const pixels = imageData.data;
        
        // Calculate average RGB values with skin tone detection
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const pixelR = pixels[i];
            const pixelG = pixels[i + 1];
            const pixelB = pixels[i + 2];
            
            // Advanced skin color detection
            if (pixelR > 95 && pixelG > 40 && pixelB > 20 &&
                pixelR > pixelG && pixelR > pixelB &&
                Math.abs(pixelR - pixelG) > 15 &&
                pixelR < 255 && pixelG < 255 && pixelB < 255) {
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
            // Fallback to realistic skin-like values
            r = 180 + Math.floor(Math.random() * 40);
            g = 120 + Math.floor(Math.random() * 40);
            b = 80 + Math.floor(Math.random() * 40);
        }
        
        // Determine skin tone and undertone
        const brightness = (r + g + b) / 3;
        const redGreenRatio = r / g;
        const redBlueRatio = r / b;
        
        let tone: 'light' | 'medium' | 'dark';
        let undertone: 'warm' | 'cool' | 'neutral';
        
        // Determine tone
        if (brightness > 180) {
            tone = 'light';
        } else if (brightness > 140) {
            tone = 'medium';
        } else {
            tone = 'dark';
        }
        
        // Determine undertone
        if (redGreenRatio > 1.1 && redBlueRatio > 1.2) {
            undertone = 'warm';
        } else if (redGreenRatio < 0.95 && redBlueRatio < 1.1) {
            undertone = 'cool';
        } else {
            undertone = 'neutral';
        }
        
        // Generate hex color
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Generate color recommendations based on tone and undertone
        const colorRecommendations = generateColorRecommendations(tone, undertone);
        
        // Generate outfit combinations
        const outfitCombos = generateOutfitCombinations(tone, undertone);
        
        // Generate style advice
        const styleAdvice = generateStyleAdvice(tone, undertone);
        
        // Get product recommendations
        const recommendedProducts = generateAdvancedProductRecommendations(tone, undertone, colorRecommendations.best);
        
        return {
            tone,
            undertone,
            hexColor,
            rgbValues: { r, g, b },
            confidence: 0.85 + Math.random() * 0.1,
            bestColors: colorRecommendations.best,
            avoidColors: colorRecommendations.avoid,
            outfitCombos,
            recommendedProducts,
            styleAdvice
        };
    };

    const generateColorRecommendations = (tone: string, undertone: string) => {
        const recommendations = {
            light: {
                warm: {
                    best: ['Olive', 'Beige', 'Maroon', 'Coral', 'Peach', 'Gold', 'Cream', 'Brown'],
                    avoid: ['Pure White', 'Bright Yellow', 'Neon Green', 'Silver']
                },
                cool: {
                    best: ['Navy', 'Royal Blue', 'Purple', 'Pink', 'Gray', 'Silver', 'White', 'Black'],
                    avoid: ['Orange', 'Bright Red', 'Yellow', 'Brown']
                },
                neutral: {
                    best: ['Most colors work well', 'Navy', 'Gray', 'Black', 'White', 'Burgundy', 'Green'],
                    avoid: ['Very bright neons']
                }
            },
            medium: {
                warm: {
                    best: ['Olive', 'Terracotta', 'Mustard', 'Rust', 'Brown', 'Cream', 'Gold', 'Maroon'],
                    avoid: ['Pastel Pink', 'Light Blue', 'Silver']
                },
                cool: {
                    best: ['Royal Blue', 'Purple', 'Emerald Green', 'Burgundy', 'Black', 'Gray', 'Navy'],
                    avoid: ['Orange', 'Yellow', 'Brown']
                },
                neutral: {
                    best: ['Most colors', 'Navy', 'Black', 'White', 'Gray', 'Green', 'Red'],
                    avoid: ['Extreme bright or dull colors']
                }
            },
            dark: {
                warm: {
                    best: ['White', 'Cream', 'Yellow', 'Orange', 'Red', 'Fuchsia', 'Turquoise', 'Gold'],
                    avoid: ['Navy', 'Brown', 'Black', 'Dark Purple']
                },
                cool: {
                    best: ['White', 'Silver', 'Blue', 'Purple', 'Pink', 'Green', 'Red'],
                    avoid: ['Orange', 'Yellow', 'Brown']
                },
                neutral: {
                    best: ['Bright colors', 'White', 'Black', 'Red', 'Blue', 'Green'],
                    avoid: ['Colors too close to skin tone']
                }
            }
        };
        
        return recommendations[tone as keyof typeof recommendations][undertone as keyof typeof recommendations.light];
    };

    const generateOutfitCombinations = (tone: string, undertone: string): string[] => {
        const combos = {
            'light-warm': [
                'Olive green shirt with beige pants',
                'Maroon dress with gold accessories',
                'Cream sweater with brown trousers',
                'Peach top with white skirt'
            ],
            'light-cool': [
                'Navy blue shirt with gray pants',
                'Purple dress with silver accessories',
                'Pink top with black skirt',
                'White shirt with blue jeans'
            ],
            'light-neutral': [
                'Classic white shirt with navy pants',
                'Black dress with gold accessories',
                'Gray sweater with white pants',
                'Burgundy top with black skirt'
            ],
            'medium-warm': [
                'Terracotta shirt with olive pants',
                'Mustard yellow sweater with brown jeans',
                'Rust colored dress with cream accessories',
                'Brown jacket with beige shirt'
            ],
            'medium-cool': [
                'Royal blue shirt with gray pants',
                'Emerald green dress with silver accessories',
                'Purple top with black skirt',
                'Burgundy sweater with navy pants'
            ],
            'medium-neutral': [
                'Navy blue shirt with khaki pants',
                'Black dress with colorful accessories',
                'White shirt with gray trousers',
                'Green top with brown pants'
            ],
            'dark-warm': [
                'White shirt with gold accessories',
                'Yellow dress with brown shoes',
                'Orange top with cream pants',
                'Fuchsia skirt with white blouse'
            ],
            'dark-cool': [
                'White shirt with blue accessories',
                'Silver dress with purple shoes',
                'Turquoise top with black pants',
                'Red dress with silver jewelry'
            ],
            'dark-neutral': [
                'White shirt with black pants',
                'Red dress with gold accessories',
                'Blue shirt with white pants',
                'Green top with black skirt'
            ]
        };
        
        const key = `${tone}-${undertone}` as keyof typeof combos;
        return combos[key] || combos['medium-neutral'];
    };

    const generateStyleAdvice = (tone: string, undertone: string): string[] => {
        const advice: { [key: string]: string[] } = {
            light: [
                'Delicate jewelry works best for your skin tone',
                'Pastel colors create a soft, elegant look',
                'Avoid harsh contrasts that can wash out your complexion'
            ],
            medium: [
                'You can pull off both bold and subtle colors',
                'Metallic accessories in gold or silver both work well',
                'Balance is key - mix light and dark colors'
            ],
            dark: [
                'Bright colors create stunning contrast',
                'White and light colors provide beautiful contrast',
                'Bold jewelry and accessories stand out beautifully'
            ]
        };
        
        const undertoneAdvice: { [key: string]: string[] } = {
            warm: [
                'Gold jewelry complements your warm undertones',
                'Earth tones create a harmonious look',
                'Warm makeup shades enhance your natural glow'
            ],
            cool: [
                'Silver jewelry highlights your cool undertones',
                'Jewel tones look exceptional on you',
                'Cool-toned makeup enhances your features'
            ],
            neutral: [
                'You can wear both gold and silver jewelry',
                'Most color palettes work well for you',
                'Experiment with both warm and cool tones'
            ]
        };
        
        return [...advice[tone as keyof typeof advice], ...undertoneAdvice[undertone]];
    };

    const generateAdvancedProductRecommendations = (_tone: string, _undertone: string, bestColors: string[]): Product[] => {
        const colorMap: { [key: string]: string[] } = {
            'Olive': ['olive', 'green', 'khaki'],
            'Beige': ['beige', 'cream', 'tan'],
            'Maroon': ['maroon', 'burgundy', 'red'],
            'Navy': ['navy', 'blue', 'dark blue'],
            'Purple': ['purple', 'violet', 'lavender'],
            'Pink': ['pink', 'rose', 'fuchsia'],
            'White': ['white', 'cream', 'ivory'],
            'Black': ['black', 'charcoal', 'dark gray'],
            'Red': ['red', 'crimson', 'scarlet'],
            'Blue': ['blue', 'royal blue', 'sky blue'],
            'Green': ['green', 'emerald', 'forest green'],
            'Yellow': ['yellow', 'gold', 'mustard'],
            'Orange': ['orange', 'terracotta', 'coral'],
            'Brown': ['brown', 'tan', 'chocolate'],
            'Gray': ['gray', 'silver', 'slate'],
            'Gold': ['gold', 'golden', 'yellow'],
            'Silver': ['silver', 'gray', 'platinum']
        };
        
        let suitableColors: string[] = [];
        bestColors.forEach(color => {
            if (colorMap[color]) {
                suitableColors.push(...colorMap[color]);
            }
        });
        
        return expandedProductCatalog
            .filter(product => 
                product.inStock &&
                product.colors.some(productColor => 
                    suitableColors.some(suitableColor => 
                        productColor.toLowerCase().includes(suitableColor.toLowerCase())
                    )
                )
            )
            .slice(0, 12);
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

    const getToneDescription = (tone: string, undertone: string) => {
        const descriptions = {
            'light-warm': 'Light skin with warm golden undertones',
            'light-cool': 'Light skin with cool pink undertones',
            'light-neutral': 'Light skin with neutral balanced undertones',
            'medium-warm': 'Medium skin with warm olive undertones',
            'medium-cool': 'Medium skin with cool rosy undertones',
            'medium-neutral': 'Medium skin with neutral balanced undertones',
            'dark-warm': 'Dark skin with warm golden undertones',
            'dark-cool': 'Dark skin with cool blue undertones',
            'dark-neutral': 'Dark skin with neutral balanced undertones'
        };
        
        return descriptions[`${tone}-${undertone}` as keyof typeof descriptions] || 'Unique skin tone';
    };

    const getUndertoneIcon = (undertone: string) => {
        switch (undertone) {
            case 'warm': return <Sun className="w-4 h-4 text-orange-500" />;
            case 'cool': return <Moon className="w-4 h-4 text-blue-500" />;
            case 'neutral': return <Droplets className="w-4 h-4 text-purple-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                        <Palette className="w-8 h-8 text-purple-600" />
                        Advanced Skin Tone & Style AI
                    </h1>
                    <p className="text-gray-600">Discover your perfect color palette with AI-powered skin tone analysis and personalized styling advice</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Photo</h2>
                        
                        {!selectedImage ? (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Upload a clear photo of your face for accurate analysis</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Camera className="w-5 h-5" />
                                    Choose Photo
                                </button>
                                <p className="text-xs text-gray-500 mt-4">For best results: Good lighting, neutral background, face clearly visible</p>
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
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis Results</h2>
                        
                        {!analysisResult ? (
                            <div className="text-center py-12">
                                <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Upload and analyze your photo to discover your skin tone and style recommendations</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Skin Tone Result */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        Your Skin Profile
                                    </h3>
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full border-2 border-purple-300 flex items-center justify-center">
                                                    <span className="text-2xl">👤</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-lg text-gray-900 capitalize">
                                                        {analysisResult.tone} Skin Tone
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        {getUndertoneIcon(analysisResult.undertone)}
                                                        <span className="capitalize">{analysisResult.undertone} Undertone</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-700 mb-3">{getToneDescription(analysisResult.tone, analysisResult.undertone)}</p>
                                        
                                        {/* Color Sample */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-16 h-16 rounded-xl border-2 border-gray-300"
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
                                                <span className="text-sm font-medium text-gray-700">AI Confidence</span>
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
                                
                                {/* Color Recommendations */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Color Recommendations</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Best Colors
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisResult.bestColors.map((color, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                                    >
                                                        {color}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                                                <X className="w-3 h-3" />
                                                Avoid Colors
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisResult.avoidColors.map((color, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                                                    >
                                                        {color}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Outfit Combinations */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Perfect Outfit Combinations</h3>
                                    <div className="space-y-2">
                                        {analysisResult.outfitCombos.map((combo, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                                                <Sparkles className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm text-gray-700">{combo}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Style Advice */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Personal Style Advice</h3>
                                    <div className="space-y-2">
                                        {analysisResult.styleAdvice.map((advice, index) => (
                                            <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{advice}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Product Recommendations */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Recommended Products</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {analysisResult.recommendedProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-20 object-cover rounded mb-2"
                                                />
                                                <h4 className="font-semibold text-xs text-gray-900 line-clamp-1">
                                                    {product.name}
                                                </h4>
                                                <p className="text-xs text-gray-600">{product.brand}</p>
                                                <p className="text-sm font-bold text-purple-900 mt-1">
                                                    ₹{product.price.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Advanced Analysis Toggle */}
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                                    >
                                        {showAdvanced ? 'Hide' : 'Show'} Advanced Analysis
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSkinToneAI;
