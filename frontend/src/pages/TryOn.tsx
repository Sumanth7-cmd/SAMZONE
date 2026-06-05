import React, { useState, useEffect, useRef } from 'react';
import { Upload, Camera, RefreshCw, X, Sparkles, Star, ShoppingBag, ShieldCheck, Search, Filter, Palette } from 'lucide-react';
import { productApi } from '../services/api';
import type { Product } from '../services/api';
import { eventBus, EVENTS } from '../services/events';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-cpu';

const FALLBACK_PRODUCTS: Product[] = [
    { id: 101, name: "Classic White T-Shirt", brand: "Zara", price: 1299, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", category: "Shirts", rating: 4.5, description: "Classic white tee" },
    { id: 102, name: "Slim Fit Denim Jacket", brand: "Levi's", price: 4599, image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500", category: "Outerwear", rating: 4.8, description: "Blue denim jacket" },
    { id: 103, name: "Air Max Running Shoes", brand: "Nike", price: 8999, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", category: "Footwear", rating: 4.9, description: "Running shoes" },
    { id: 104, name: "Modern Fit Chinos", brand: "Peter England", price: 2499, image: "https://images.unsplash.com/photo-1473966968600-fa804b86829b?w=500", category: "Pants", rating: 4.3, description: "Cotton chinos" },
    { id: 105, name: "Floral Summer Dress", brand: "H&M", price: 3499, image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500", category: "Dresses", rating: 4.4, description: "Summer dress" },
    { id: 106, name: "Aviator Sunglasses", brand: "Ray-Ban", price: 12499, image: "https://images.unsplash.com/photo-1511499767350-a1590fdb28bf?w=500", category: "Accessories", rating: 4.9, description: "Classic shades" },
];

const CATEGORIES = ["All", "Shirts", "Pants", "Dresses", "Footwear", "Accessories", "Outerwear", "Gadgets", "Lifestyle"];

const TryOn: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [priceRange, setPriceRange] = useState(25000);
    const [isLoading, setIsLoading] = useState(true);
    const [tryOnResult, setTryOnResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);
    const [skinToneAnalysis, setSkinToneAnalysis] = useState<string | null>(null);
    const [colorRecommendations, setColorRecommendations] = useState<string[]>([]);
    const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null);
    const [currentPose, setCurrentPose] = useState<any>(null);
    const [bodyWidth, setBodyWidth] = useState<number>(0);
    const [recommendedSize, setRecommendedSize] = useState<string>('');
    const [outfitScore, setOutfitScore] = useState<number>(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        productApi.getAllProducts()
            .then(data => setProducts(data.length > 0 ? data : FALLBACK_PRODUCTS))
            .catch(() => setProducts(FALLBACK_PRODUCTS))
            .finally(() => setIsLoading(false));

        // Initialize TensorFlow Pose Detection
        const initializePoseDetection = async () => {
            try {
                const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
                setPoseDetector(detector);
            } catch (error) {
                console.error('Failed to initialize pose detection:', error);
            }
        };

        initializePoseDetection();
    }, []);

    // Draw clothing overlay based on pose keypoints
    const drawClothingOverlay = (ctx: CanvasRenderingContext2D, pose: any, canvasWidth: number, canvasHeight: number) => {
        if (!selectedProduct) return;

        const productImg = new Image();
        productImg.crossOrigin = "anonymous";
        
        productImg.onload = () => {
            const cat = (selectedProduct.category || '').toLowerCase();
            
            // Get body keypoints for positioning
            const leftShoulder = pose.keypoints?.find((p: any) => p.name === "left_shoulder");
            const rightShoulder = pose.keypoints?.find((p: any) => p.name === "right_shoulder");
            const leftHip = pose.keypoints?.find((p: any) => p.name === "left_hip");
            const rightHip = pose.keypoints?.find((p: any) => p.name === "right_hip");

            if (leftShoulder && rightShoulder) {
                let x = 0, y = 0, width = 0, height = 0;

                if (cat.includes('shirt') || cat.includes('outerwear') || cat.includes('dress')) {
                    // Position based on shoulder width and torso height
                    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
                    width = shoulderWidth * 1.4; // Make shirt slightly wider than shoulders
                    x = leftShoulder.x - (width * 0.2);
                    
                    if (leftHip && rightHip) {
                        const hipY = (leftHip.y + rightHip.y) / 2;
                        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                        height = (hipY - shoulderY) * 1.2; // Extend to hip level
                        y = shoulderY;
                    }
                } else if (cat.includes('pant') || cat.includes('jean')) {
                    // Position based on hip width and leg length
                    if (leftHip && rightHip) {
                        const hipWidth = Math.abs(rightHip.x - leftHip.x);
                        width = hipWidth * 1.1;
                        x = leftHip.x - (width * 0.05);
                        height = canvasHeight * 0.4; // Extend down from hips
                        y = leftHip.y;
                    }
                } else if (cat.includes('shoe') || cat.includes('sneaker')) {
                    // Position at bottom of frame
                    width = canvasWidth * 0.15;
                    height = canvasHeight * 0.1;
                    x = canvasWidth / 2 - width / 2;
                    y = canvasHeight * 0.85;
                }

                // Draw the clothing item
                ctx.globalAlpha = 0.9;
                ctx.drawImage(productImg, x, y, width, height);
            }
        };

        productImg.src = selectedProduct?.image;
    };

    // Enhanced pose detection with body size estimation
    const detectPose = async () => {
        if (!poseDetector || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === 4) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx?.drawImage(video, 0, 0);

            try {
                const poses = await poseDetector.estimatePoses(video);
                if (poses.length > 0) {
                    const pose = poses[0];
                    setCurrentPose(pose);
                    
                    // Estimate body width from shoulders
                    const leftShoulder = pose.keypoints?.find((p: any) => p.name === "left_shoulder");
                    const rightShoulder = pose.keypoints?.find((p: any) => p.name === "right_shoulder");
                    
                    if (leftShoulder && rightShoulder) {
                        const estimatedWidth = Math.abs(rightShoulder.x - leftShoulder.x);
                        setBodyWidth(estimatedWidth);
                        
                        // Calculate recommended size
                        const size = calculateRecommendedSize(estimatedWidth);
                        setRecommendedSize(size);
                    }

                    // Draw overlay with pose tracking
                    if (selectedProduct && ctx) {
                        drawClothingOverlay(ctx, pose, canvas.width, canvas.height);
                    }
                }
            } catch (error) {
                console.error('Pose detection error:', error);
            }
        }
    };

    // Calculate recommended clothing size based on body width
    const calculateRecommendedSize = (width: number): string => {
        if (width < 150) return "XS";
        if (width < 200) return "S";
        if (width < 250) return "M";
        if (width < 300) return "L";
        return "XL";
    };

    // Calculate outfit compatibility score
    const calculateOutfitScore = (product: Product, skinTone?: string): number => {
        let score = 0;
        
        if (skinTone) {
            // Color compatibility
            const productColors = product.colors || [];
            const toneColors = getColorsForTone(skinTone);
            const colorMatch = productColors.some(color => toneColors.includes(color));
            if (colorMatch) score += 4;
            
            // Style compatibility
            if (product.category.toLowerCase().includes('shirt') && skinTone.includes('Light')) score += 3;
            if (product.category.toLowerCase().includes('pant') && skinTone.includes('Medium')) score += 3;
        }
        
        // Size compatibility
        if (recommendedSize && product.sizes?.includes(recommendedSize)) score += 3;
        
        return Math.min(score, 10);
    };

    // Get recommended colors for skin tone
    const getColorsForTone = (tone: string): string[] => {
        if (tone.includes('Deep') || tone.includes('Dark')) {
            return ["Royal Blue", "Emerald Green", "Burgundy", "Mustard Yellow"];
        } else if (tone.includes('Medium')) {
            return ["Navy Blue", "Olive Green", "Wine Red", "Terracotta"];
        } else {
            return ["Pastel Blue", "Soft Pink", "Lavender", "Mint Green"];
        }
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsWebcamActive(true);
                setUserImage(null);
                setTryOnResult(null);

                // Start continuous pose detection loop
                const poseDetectionLoop = () => {
                    detectPose();
                    if (isWebcamActive) {
                        requestAnimationFrame(poseDetectionLoop);
                    }
                };
                requestAnimationFrame(poseDetectionLoop);
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Could not access webcam. Please check permissions.");
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsWebcamActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/png');
                setUserImage(dataUrl);
                stopWebcam();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUserImage(event.target?.result as string);
                setTryOnResult(null);
                setIsWebcamActive(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const selectProduct = (p: Product) => {
        setSelectedProduct(p);
        setTryOnResult(null);
        eventBus.emit(EVENTS.PRODUCT_SELECTED, p);
    };

    const analyzeSkinTone = (imageData: ImageData): { tone: string; recommendations: string[] } => {
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;

        // Sample pixels from center face region (avoid hair and background)
        const startX = Math.floor(imageData.width * 0.3);
        const endX = Math.floor(imageData.width * 0.7);
        const startY = Math.floor(imageData.height * 0.2);
        const endY = Math.floor(imageData.height * 0.4);

        for (let y = startY; y < endY; y += 3) {
            for (let x = startX; x < endX; x += 3) {
                const index = (y * imageData.width + x) * 4;
                r += data[index];
                g += data[index + 1];
                b += data[index + 2];
                pixelCount++;
            }
        }

        r = Math.floor(r / pixelCount);
        g = Math.floor(g / pixelCount);
        b = Math.floor(b / pixelCount);

        // Enhanced skin tone classification
        const brightness = (r + g + b) / 3;
        
        let tone = '';
        let recommendations: string[] = [];

        if (brightness < 80) {
            tone = "Dark";
            recommendations = getColorsForTone("Dark");
        } else if (brightness < 160) {
            tone = "Medium";
            recommendations = getColorsForTone("Medium");
        } else {
            tone = "Light";
            recommendations = getColorsForTone("Light");
        }

        return { tone, recommendations: recommendations.slice(0, 4) };
    };

    const getColorRecommendations = (skinTone: string, productColor?: string): string[] => {
        const recommendations: string[] = [];
        
        if (skinTone === "Deep" || skinTone === "Medium-Dark") {
            recommendations.push("Royal Blue", "Emerald Green", "Burgundy", "Mustard Yellow");
        } else if (skinTone === "Medium" || skinTone === "Medium-Light") {
            recommendations.push("Navy", "Olive", "Wine Red", "Terracotta");
        } else {
            recommendations.push("Pastel Blue", "Soft Pink", "Lavender", "Mint Green");
        }

        // Add complementary colors based on product color
        if (productColor) {
            if (productColor.toLowerCase().includes('blue')) {
                recommendations.push("Beige", "White", "Gray");
            } else if (productColor.toLowerCase().includes('red')) {
                recommendations.push("Navy", "Black", "White");
            } else if (productColor.toLowerCase().includes('black')) {
                recommendations.push("White", "Gray", "Navy");
            }
        }

        return [...new Set(recommendations)].slice(0, 4);
    };

    const finalizeTryOn = () => {
        if (!selectedProduct || !userImage) return;

        setIsProcessing(true);

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const userImg = new Image();
            const productImg = new Image();

            userImg.crossOrigin = "anonymous";
            productImg.crossOrigin = "anonymous";

            userImg.onload = () => {
                canvas.width = userImg.width;
                canvas.height = userImg.height;
                ctx?.drawImage(userImg, 0, 0);

                // Analyze skin tone and calculate outfit score
                if (ctx) {
                    const imageData = ctx.getImageData(
                        Math.floor(canvas.width * 0.3),
                        Math.floor(canvas.height * 0.2),
                        Math.floor(canvas.width * 0.4),
                        Math.floor(canvas.height * 0.2)
                    );
                    const skinAnalysis = analyzeSkinTone(imageData);
                    setSkinToneAnalysis(skinAnalysis.tone);
                    
                    const productColor = selectedProduct.colors?.[0];
                    const recommendations = getColorRecommendations(skinAnalysis.tone, productColor);
                    setColorRecommendations(recommendations);
                    
                    // Calculate outfit score
                    const score = calculateOutfitScore(selectedProduct, skinAnalysis.tone);
                    setOutfitScore(score);
                }

                productImg.onload = () => {
                    if (!ctx) return;

                    const cat = (selectedProduct.category || '').toLowerCase();
                    let scale = 0.5;
                    let xOffset = 0.5; // Center
                    let yOffset = 0.25; // Top/Torso

                    if (cat.includes('shirt') || cat.includes('outerwear') || cat.includes('dress')) {
                        scale = (canvas.width * 0.6) / productImg.width;
                        yOffset = 0.2;
                    } else if (cat.includes('pant')) {
                        scale = (canvas.width * 0.5) / productImg.width;
                        yOffset = 0.55;
                    } else if (cat.includes('footwear') || cat.includes('shoe')) {
                        scale = (canvas.width * 0.3) / productImg.width;
                        yOffset = 0.8;
                    } else if (cat.includes('access') || cat.includes('gadget')) {
                        scale = (canvas.width * 0.25) / productImg.width;
                        yOffset = 0.1;
                    }

                    const w = productImg.width * scale;
                    const h = productImg.height * scale;
                    const x = (canvas.width * xOffset) - (w / 2);
                    const y = canvas.height * yOffset;

                    ctx.globalAlpha = 0.95;
                    ctx.drawImage(productImg, x, y, w, h);

                    setTryOnResult(canvas.toDataURL('image/png'));
                    setIsProcessing(false);
                };
                productImg.src = selectedProduct?.image;
            };
            userImg.src = userImage;
        }, 1500);
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = p.price <= priceRange;
        return matchesCategory && matchesSearch && matchesPrice;
    });

    const displayedProducts = filteredProducts.slice(0, visibleCount);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            setVisibleCount(prev => prev + 12);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-[1400px] mx-auto px-6">
                {/* Header & Controls */}
                <div className="mb-8 p-6 bg-white rounded-3xl premium-shadow border border-gray-100 backdrop-blur-xl bg-white/80 sticky top-24 z-30">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-1 tracking-tight">Try-On Studio</h1>
                            <p className="text-sm text-gray-500 font-medium">AI-powered virtual wardrobe • {filteredProducts.length} items available</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 flex-grow max-w-4xl">
                            <div className="relative w-full group flex-grow">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search brands, styles, or categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 min-w-[240px]">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <Filter className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Price</span>
                                </div>
                                <input
                                    type="range"
                                    min="500"
                                    max="25000"
                                    step="500"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                    className="flex-grow h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-[11px] font-black text-gray-900 min-w-[50px] text-right">₹{priceRange.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setVisibleCount(12); }}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Content: Product Grid */}
                    <div className="lg:col-span-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-40 space-y-4">
                                <div className="relative">
                                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-indigo-400 animate-pulse" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest text-gray-400">Loading Catalog</p>
                            </div>
                        ) : (
                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto max-h-[850px] custom-scrollbar pr-2 pb-40"
                            >
                                {displayedProducts.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => selectProduct(product)}
                                        className={`group relative bg-white rounded-3xl premium-shadow border p-4 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${selectedProduct?.id === product.id ? 'ring-2 ring-indigo-600 bg-indigo-50/10 shadow-indigo-100' : 'hover:border-indigo-100'
                                            }`}
                                    >
                                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gray-50">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black tracking-tight uppercase border border-white shadow-sm text-gray-800">
                                                {product.category}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{product.brand}</p>
                                            <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{product.name}</h3>

                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-sm font-black text-gray-900 tracking-tight">₹{product.price.toLocaleString()}</span>
                                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                                                    <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                                    <span className="text-[9px] text-yellow-700 font-black">{product.rating}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedProduct?.id === product.id && (
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isLoading && filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-32 bg-white rounded-3xl border border-dashed text-gray-400">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
                                <p className="text-sm font-medium">Try adjusting your search or category filters.</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setActiveCategory("All"); setPriceRange(25000); }}
                                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Preview Panel */}
                    <div className="lg:col-span-4 sticky top-44">
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                <div className="relative z-10">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">AI VirtuLab</h2>
                                    <p className="text-lg font-bold">Studio Preview</p>
                                </div>
                                <ShieldCheck className="w-8 h-8 text-indigo-400 relative z-10" />
                            </div>

                            <div className="p-8">
                                {selectedProduct ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8 group cursor-default">
                                            <img src={selectedProduct?.image} className="w-14 h-14 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" alt="" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter mb-0.5">{selectedProduct.brand}</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">{selectedProduct.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-gray-900">₹{selectedProduct.price.toLocaleString()}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedProduct.category}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative aspect-[3/4] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 mb-8 flex items-center justify-center group shadow-inner">
                                            {tryOnResult ? (
                                                <div className="w-full h-full relative group">
                                                    <img src={tryOnResult} className="w-full h-full object-cover animate-in fade-in duration-700" alt="Try-On Result" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-indigo-600/90 text-white p-4 text-[11px] font-black text-center flex items-center justify-center gap-2 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform">
                                                        <Sparkles className="w-4 h-4" /> REFRESH LOOK
                                                    </div>
                                                </div>
                                            ) : userImage && !isWebcamActive ? (
                                                <div className="relative w-full h-full group">
                                                    <img src={userImage} className="w-full h-full object-cover" alt="User" />
                                                    <button
                                                        onClick={() => { setUserImage(null); setTryOnResult(null); }}
                                                        className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md text-gray-900 rounded-2xl hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-gray-100"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : isWebcamActive ? (
                                                <div className="relative w-full h-full">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                                    <div className="absolute inset-8 border-2 border-indigo-400/30 rounded-[2rem] pointer-events-none border-dashed" />
                                                    <button
                                                        onClick={capturePhoto}
                                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 p-6 bg-white text-indigo-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                                                    >
                                                        <Camera className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center p-12 space-y-6">
                                                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-gray-200 border border-gray-50">
                                                        <Camera className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-widest text-gray-900 mb-2">Initialize Canvas</p>
                                                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed px-4">Upload a clear portrait or use live webcam for the AI overlay.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {isProcessing && (
                                                <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-8 text-center z-10">
                                                    <div className="relative mb-6">
                                                        <RefreshCw className="w-16 h-16 text-indigo-400 animate-spin" />
                                                        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-white animate-pulse" />
                                                    </div>
                                                    <p className="text-lg font-black uppercase tracking-[0.2em] mb-2 leading-none">Mapping Style</p>
                                                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest opacity-80">Synchronizing item geometry...</p>
                                                </div>
                                            )}

                                            {/* Color Recommendations */}
                                            {colorRecommendations.length > 0 && (
                                                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Palette className="w-4 h-4 text-indigo-600" />
                                                        <h4 className="text-sm font-bold text-gray-900">Color Match for {skinToneAnalysis} Skin Tone</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {colorRecommendations.map((color, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200 shadow-sm"
                                                            >
                                                                {color}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-3 italic">These colors complement your skin tone and the selected item perfectly!</p>
                                                </div>
                                            )}

                                            {/* Outfit Analysis Panel */}
                                            {(skinToneAnalysis || recommendedSize || outfitScore > 0) && (
                                                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                                                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                                        Outfit Analysis
                                                    </h4>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {skinToneAnalysis && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-600">Skin Tone</p>
                                                                <p className="text-lg font-bold text-gray-900">{skinToneAnalysis}</p>
                                                            </div>
                                                        )}
                                                        
                                                        {recommendedSize && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-600">Suggested Size</p>
                                                                <p className="text-lg font-bold text-gray-900">{recommendedSize}</p>
                                                            </div>
                                                        )}
                                                        
                                                        {outfitScore > 0 && (
                                                            <div className="md:col-span-2">
                                                                <p className="text-sm font-medium text-gray-600">Outfit Match Score</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${(outfitScore / 10) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-lg font-bold text-gray-900">{outfitScore} / 10</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex flex-col items-center justify-center p-5 rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-gray-500 group"
                                            >
                                                <Upload className="w-6 h-6 mb-2 group-hover:text-indigo-600 group-hover:-translate-y-1 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-600">Upload</span>
                                            </button>
                                            <button
                                                onClick={startWebcam}
                                                className="flex flex-col items-center justify-center p-5 rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-gray-500 group"
                                            >
                                                <Camera className="w-6 h-6 mb-2 group-hover:text-indigo-600 group-hover:-translate-y-1 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-600">Webcam</span>
                                            </button>
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                                        <button
                                            onClick={finalizeTryOn}
                                            disabled={!userImage || isProcessing}
                                            className="group w-full py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:grayscale text-[12px] tracking-[0.1em] uppercase shadow-2xl shadow-indigo-200 active:scale-[0.98]"
                                        >
                                            {isProcessing ? (
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                                    Generate Outfit
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-24 px-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Initialize Outfit</h3>
                                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed px-4">Select any of our 550+ premium items from the catalog to start your virtual fitting.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center gap-8">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">TLS Secure</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">AI Engine V2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default TryOn;
