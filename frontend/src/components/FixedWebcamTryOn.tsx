import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, CameraOff, X, Plus, Minus, RotateCw, Shirt, Maximize2, Minimize2, Download, RefreshCw, ShoppingCart, Sparkles, Upload } from 'lucide-react';
import type { Product } from '../data/massiveProductCatalog';
import { productApi } from '../services/api';
import type { Product as ApiProduct } from '../services/api';
import { getProductImage, PLACEHOLDER } from '../utils/productImage';
import { addToCart } from '../utils/cart';

const mapApiProduct = (p: ApiProduct): Product => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: getProductImage(p),
    category: 'mens-clothing',
    subcategory: 'shirts',
    brand: p.brand,
    rating: p.rating,
    colors: p.colors || [],
    sizes: p.sizes,
    description: p.description || '',
    inStock: true,
    discount: p.discount,
    tags: [],
});

interface OverlayItem {
    id: string;
    product: Product;
    x: number;
    y: number;
    scale: number;
    baseScale: number;
    baseX: number;
    baseY: number;
    opacity: number;
    rotation: number;
    selectedSize?: string;
}

interface Placement {
    isPants: boolean;
    isShoes: boolean;
    baseScale: number;
    x: number;
    y: number;
}

const SIZE_SCALE_FACTOR: Record<string, number> = { S: 0.85, M: 1.0, L: 1.15, XL: 1.3 };

const getPlacement = (product: Product, canvasW: number, canvasH: number): Placement => {
    const lowerName = product.name?.toLowerCase() || '';
    const isPants = /pant|jean|trouser|short|skirt/.test(lowerName);
    const isShoes = product.category === 'footwear' || /shoe|boot|sandal|sneaker|slipper/.test(lowerName);

    if (isPants) {
        // Lower half of the body
        return { isPants, isShoes, baseScale: 0.45, x: canvasW * 0.3, y: canvasH * 0.48 };
    }
    if (isShoes) {
        // Near the bottom of the frame
        return { isPants, isShoes, baseScale: 0.25, x: canvasW * 0.35, y: canvasH * 0.82 };
    }
    // Default: shirt/top on the upper torso
    return { isPants, isShoes, baseScale: 0.45, x: canvasW * 0.28, y: canvasH * 0.20 };
};

const HOW_IT_WORKS_STEPS = [
    { icon: '📸', text: 'Upload a full-body photo or start your webcam' },
    { icon: '👕', text: 'Select a product to try on' },
    { icon: '✨', text: 'Generate your preview' },
];

const FixedWebcamTryOn: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [isWebcamOn, setIsWebcamOn] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preselectedProduct, setPreselectedProduct] = useState<Product | null>(null);
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
    const preselectHandled = useRef(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoImgRef = useRef<HTMLImageElement | null>(null);
    const overlayImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const draggingIdRef = useRef<string | null>(null);
    const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

    const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
    const [pickerLoading, setPickerLoading] = useState(true);

    // Product picker thumbnails come from the real catalog (previously a
    // hardcoded demo list with fake "Nike"/"Adidas"/"Puma" shirt entries
    // whose image URLs didn't resolve to anything, showing broken icons).
    useEffect(() => {
        productApi.getProducts(0, 12, { category: "Men's Clothing", sortBy: 'rating', sortDir: 'desc' })
            .then((res) => setPickerProducts(res.content.map(mapApiProduct)))
            .catch(() => setPickerProducts([]))
            .finally(() => setPickerLoading(false));
    }, []);

    const displayProducts = preselectedProduct
        ? [preselectedProduct, ...pickerProducts.filter(p => p.id !== preselectedProduct.id)]
        : pickerProducts;

    const startWebcam = useCallback(async () => {
        try {
            setError(null);
            setUploadedPhoto(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                // Some browsers don't reliably autoplay a freshly attached
                // srcObject; without this the camera light turns on but the
                // <video> element never actually starts rendering frames.
                await videoRef.current.play();
                setIsWebcamOn(true);
            }
        } catch (err) {
            setError('Unable to access webcam. Please check permissions.');
            console.error('Webcam error:', err);
        }
    }, []);

    const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        setError(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setUploadedPhoto(ev.target?.result as string);
            stopWebcam();
        };
        reader.readAsDataURL(file);
    }, []);

    const removePhoto = useCallback(() => {
        setUploadedPhoto(null);
        setPreviewDataUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        
        setIsWebcamOn(false);
    }, []);

    const drawOverlayItems = useCallback((ctx: CanvasRenderingContext2D) => {
        overlayItems.forEach(item => {
            const img = overlayImagesRef.current.get(item.id);
            if (!img || !img.complete || img.naturalWidth === 0) return;

            ctx.save();
            ctx.globalAlpha = item.opacity;
            ctx.translate(item.x + (img.naturalWidth * item.scale) / 2, item.y + (img.naturalHeight * item.scale) / 2);
            ctx.rotate((item.rotation * Math.PI) / 180);
            ctx.scale(item.scale, item.scale);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            ctx.restore();
        });
    }, [overlayItems]);

    // Continuously composites the live video frame + overlay items onto the
    // canvas. Driven by an effect (not a one-off function call) so it never
    // closes over a stale `isWebcamOn`/`overlayItems` value - each change
    // tears down the previous rAF loop and starts a fresh one.
    useEffect(() => {
        if (!isWebcamOn) return;

        let animId: number;
        const render = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    drawOverlayItems(ctx);
                }
            }
            animId = requestAnimationFrame(render);
        };

        render();
        animationRef.current = animId;
        return () => cancelAnimationFrame(animId);
    }, [isWebcamOn, drawOverlayItems]);

    const drawPhotoFrame = useCallback(() => {
        const canvas = canvasRef.current;
        const img = photoImgRef.current;
        if (!canvas || !img || !img.complete) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOverlayItems(ctx);
    }, [drawOverlayItems]);

    // Load the uploaded photo into an offscreen Image, then draw it (+ overlays) to the canvas.
    // Static photo mode redraws on demand instead of the webcam's continuous rAF loop.
    useEffect(() => {
        if (!uploadedPhoto) return;
        const img = new Image();
        img.onload = () => {
            photoImgRef.current = img;
            drawPhotoFrame();
        };
        img.src = uploadedPhoto;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedPhoto]);

    useEffect(() => {
        if (uploadedPhoto) {
            drawPhotoFrame();
        }
    }, [uploadedPhoto, overlayItems, drawPhotoFrame]);

    const addProductToOverlay = useCallback((product: Product) => {
        const W = canvasRef.current?.width || videoRef.current?.videoWidth || photoImgRef.current?.naturalWidth || 640;
        const H = canvasRef.current?.height || videoRef.current?.videoHeight || photoImgRef.current?.naturalHeight || 480;

        const placement = getPlacement(product, W, H);
        const id = `overlay_${Date.now()}`;

        const newItem: OverlayItem = {
            id,
            product,
            x: placement.x,
            y: placement.y,
            scale: placement.baseScale,
            baseScale: placement.baseScale,
            baseX: placement.x,
            baseY: placement.y,
            opacity: 0.85,
            rotation: 0,
            selectedSize: 'M',
        };

        const img = new Image();
        // Photo mode only redraws on-demand (no continuous rAF loop like the
        // webcam), so if this image is still loading when the next draw
        // happens, force a re-render once it's ready so the effect re-runs
        // with fresh state instead of silently never showing this item.
        img.onload = () => setOverlayItems(prev => [...prev]);
        img.src = product.image;
        overlayImagesRef.current.set(id, img);

        setOverlayItems(prev => [...prev, newItem]);
        setSelectedProducts(prev => [...prev, product]);
    }, []);

    const removeOverlayItem = useCallback((id: string) => {
        overlayImagesRef.current.delete(id);
        setOverlayItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const updateOverlayItem = useCallback((id: string, updates: Partial<OverlayItem>) => {
        setOverlayItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const clearAll = useCallback(() => {
        overlayImagesRef.current.clear();
        setOverlayItems([]);
        setSelectedProducts([]);
        setPreviewDataUrl(null);
    }, []);

    const resetItemPosition = useCallback((id: string) => {
        setOverlayItems(prev => prev.map(item =>
            item.id === id ? { ...item, x: item.baseX, y: item.baseY } : item
        ));
    }, []);

    const setItemSize = useCallback((id: string, size: string) => {
        setOverlayItems(prev => prev.map(item =>
            item.id === id
                ? { ...item, selectedSize: size, scale: item.baseScale * (SIZE_SCALE_FACTOR[size] ?? 1) }
                : item
        ));
    }, []);

    // Maps a pointer event's screen position to canvas-pixel coordinates,
    // accounting for the canvas being CSS-scaled to fill its container.
    const canvasPointFromEvent = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    }, []);

    const findItemAt = useCallback((x: number, y: number): OverlayItem | null => {
        for (let i = overlayItems.length - 1; i >= 0; i--) {
            const item = overlayItems[i];
            const img = overlayImagesRef.current.get(item.id);
            const w = (img?.naturalWidth || 200) * item.scale;
            const h = (img?.naturalHeight || 200) * item.scale;
            if (x >= item.x && x <= item.x + w && y >= item.y && y <= item.y + h) {
                return item;
            }
        }
        return null;
    }, [overlayItems]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const point = canvasPointFromEvent(e.clientX, e.clientY);
        if (!point) return;
        const hit = findItemAt(point.x, point.y);
        if (hit) {
            draggingIdRef.current = hit.id;
            dragOffsetRef.current = { dx: point.x - hit.x, dy: point.y - hit.y };
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    }, [canvasPointFromEvent, findItemAt]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const id = draggingIdRef.current;
        if (!id) return;
        const point = canvasPointFromEvent(e.clientX, e.clientY);
        if (!point) return;
        updateOverlayItem(id, {
            x: point.x - dragOffsetRef.current.dx,
            y: point.y - dragOffsetRef.current.dy,
        });
    }, [canvasPointFromEvent, updateOverlayItem]);

    const handlePointerUp = useCallback(() => {
        draggingIdRef.current = null;
    }, []);

    const generatePreview = useCallback(() => {
        if (!canvasRef.current) return;
        setPreviewDataUrl(canvasRef.current.toDataURL('image/png'));
    }, []);

    const downloadPreview = useCallback(() => {
        if (!previewDataUrl) return;
        const link = document.createElement('a');
        link.href = previewDataUrl;
        link.download = 'samzone-try-on-preview.png';
        link.click();
    }, [previewDataUrl]);

    const tryAnotherSize = useCallback(() => {
        setOverlayItems(prev => prev.map(item => ({ ...item, selectedSize: undefined })));
        setPreviewDataUrl(null);
    }, []);

    const addPreviewToCart = useCallback(() => {
        overlayItems.forEach(item => {
            addToCart({
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.image,
                size: item.selectedSize,
            });
        });
    }, [overlayItems]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam();
        };
    }, [stopWebcam]);

    // Preselect a product passed in via ?productId= (e.g. from the product details page)
    useEffect(() => {
        const productId = searchParams.get('productId');
        if (!productId || preselectHandled.current) return;
        preselectHandled.current = true;

        productApi.getProductById(Number(productId)).then((p) => {
            const mapped = mapApiProduct(p);
            setPreselectedProduct(mapped);
            addProductToOverlay(mapped);
        }).catch(() => {
            // ignore - product just won't be preselected
        });
    }, [searchParams, addProductToOverlay]);

    const containerClass = isMaximized
        ? "fixed inset-0 bg-black z-50 flex flex-col overflow-y-auto"
        : "bg-white rounded-lg shadow-lg overflow-hidden";

    const mainContentClass = isMaximized
        ? "flex-1 flex flex-col md:flex-row gap-4 p-4"
        : "flex flex-col md:flex-row gap-4 p-4";

    return (
        <div className={containerClass}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Virtual Try-On Studio</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-2 hover:bg-white/20 rounded transition-colors"
                        >
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        {!isMaximized && (
                            <button
                                onClick={() => {/* Close handler */}}
                                className="p-2 hover:bg-white/20 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={mainContentClass}>
                {/* Left Side - Webcam */}
                <div className="flex-1 min-w-0">
                <div
                    className="relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-xl overflow-hidden"
                    style={{ touchAction: overlayItems.length > 0 ? 'none' : 'auto' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                    />
                    {!isWebcamOn && !uploadedPhoto ? (
                        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto py-6">
                            <div className="text-center px-4">
                                <div className="bg-white/10 rounded-xl p-4 mb-6 max-w-sm mx-auto">
                                    <h3 className="text-white font-semibold mb-3">How it works</h3>
                                    <div className="space-y-2 text-left">
                                        {HOW_IT_WORKS_STEPS.map((step, i) => (
                                            <div key={i} className="flex items-center gap-3 text-gray-200 text-sm">
                                                <span className="text-xl">{step.icon}</span>
                                                <span>{step.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-white mb-4">Start your webcam or upload a photo to try on products</p>
                                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                                    <button
                                        onClick={startWebcam}
                                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                    >
                                        <Camera className="w-5 h-5" />
                                        Start Webcam
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Upload Photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isWebcamOn && (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-contain"
                                />
                            )}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-contain"
                            />

                            {/* Controls */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                {isWebcamOn && (
                                    <button
                                        onClick={stopWebcam}
                                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <CameraOff className="w-4 h-4" />
                                    </button>
                                )}
                                {uploadedPhoto && (
                                    <button
                                        onClick={removePhoto}
                                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                                        title="Remove photo"
                                    >
                                        <CameraOff className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                                    title="Clear try-on items"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {overlayItems.length > 0 && !previewDataUrl && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full shadow max-w-[90%] text-center">
                                    Drag the clothing to position it on your body. Use the slider to resize.
                                </div>
                            )}

                            {overlayItems.length > 0 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap gap-2 justify-center px-4">
                                    {!previewDataUrl ? (
                                        <button
                                            onClick={generatePreview}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate Preview
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={downloadPreview}
                                                className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Preview
                                            </button>
                                            <button
                                                onClick={tryAnotherSize}
                                                className="bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Try Another Size
                                            </button>
                                            <button
                                                onClick={addPreviewToCart}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Add to Cart
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {previewDataUrl && overlayItems.some(item => item.selectedSize) && (
                                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full shadow">
                                    Based on standard sizing, size{' '}
                                    {overlayItems.filter(item => item.selectedSize).map(item => item.selectedSize).join(', ')}{' '}
                                    is a good starting point.
                                </div>
                            )}
                        </>
                    )}
                    
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                            <div className="bg-white rounded-lg p-6 max-w-sm">
                                <p className="text-red-600 text-center">{error}</p>
                                <button
                                    onClick={startWebcam}
                                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-full"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Per-item controls now sit below the video instead of floating on
                    top of it, where they used to block the view of the feed. */}
                {overlayItems.length > 0 && (
                    <div className="max-w-2xl mx-auto mt-4 space-y-3">
                        {overlayItems.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium flex-1 truncate">{item.product.name}</span>
                                    <button
                                        onClick={() => resetItemPosition(item.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                        title="Reset position"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => removeOverlayItem(item.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Size Control */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { scale: Math.max(0.2, item.scale - 0.1) })}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs w-10 text-center">{Math.round(item.scale * 100)}%</span>
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { scale: Math.min(2, item.scale + 0.1) })}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <input
                                        type="range"
                                        min={0.2}
                                        max={0.8}
                                        step={0.02}
                                        value={Math.min(0.8, Math.max(0.2, item.scale))}
                                        onChange={(e) => updateOverlayItem(item.id, { scale: parseFloat(e.target.value) })}
                                        className="flex-1"
                                        title="Resize"
                                    />
                                </div>

                                {/* Opacity Control */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { opacity: Math.max(0.3, item.opacity - 0.1) })}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs w-10 text-center">{Math.round(item.opacity * 100)}%</span>
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { opacity: Math.min(1, item.opacity + 0.1) })}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs text-gray-500">opacity</span>
                                </div>

                                {/* Rotation Control */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { rotation: item.rotation - 15 })}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        <RotateCw className="w-3 h-3" style={{ transform: 'scaleX(-1)' }} />
                                    </button>
                                    <span className="text-xs w-10 text-center">{item.rotation}°</span>
                                    <button
                                        onClick={() => updateOverlayItem(item.id, { rotation: item.rotation + 15 })}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        <RotateCw className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs text-gray-500">rotation</span>
                                </div>

                                {item.product.sizes && item.product.sizes.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                                        {item.product.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setItemSize(item.id, size)}
                                                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                                    item.selectedSize === size
                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                        : 'border border-gray-300 text-gray-700 hover:border-purple-400'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                </div>

                {/* Right Side - Product Selection */}
                <div className={`${isMaximized ? 'md:w-80' : 'md:w-1/2'} bg-gray-50 border-l border-gray-200 overflow-y-auto rounded-lg`}>
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shirt className="w-5 h-5" />
                            Select Products to Try On
                        </h3>

                        {pickerLoading ? (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-40" />
                                ))}
                            </div>
                        ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {displayProducts.map((product) => {
                                const isInOverlay = overlayItems.some(item => item.product.id === product.id);
                                const isPreselected = preselectedProduct?.id === product.id;

                                return (
                                    <div
                                        key={product.id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                                            isInOverlay
                                                ? 'border-green-600 bg-green-50'
                                                : isPreselected
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-400'
                                        }`}
                                        onClick={() => !isInOverlay && addProductToOverlay(product)}
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-24 object-cover rounded-lg mb-2"
                                            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                                        />
                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                                        <p className="text-xs text-gray-600">{product.brand}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-bold text-purple-900">
                                                ₹{product.price.toLocaleString('en-IN')}
                                            </span>
                                            {isInOverlay && (
                                                <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                                    Added
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        )}

                        {selectedProducts.length > 0 && (
                            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                <h4 className="font-semibold text-purple-900 mb-2">Currently Trying On:</h4>
                                <div className="space-y-1">
                                    {selectedProducts.map((product) => (
                                        <div key={product.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{product.name}</span>
                                            <button
                                                onClick={() => {
                                                    const item = overlayItems.find(item => item.product.id === product.id);
                                                    if (item) removeOverlayItem(item.id);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixedWebcamTryOn;
