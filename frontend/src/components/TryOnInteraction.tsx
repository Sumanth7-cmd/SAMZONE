import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    Move, 
    RotateCw, 
    Plus, 
    Minus, 
    RotateCcw, 
    Save, 
    Download,
    Trash2,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Copy,
    Grid3x3,
    Layers,
    X
} from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface OverlayItem {
    id: string;
    product: Product;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
    opacity: number;
    zIndex: number;
    locked: boolean;
    visible: boolean;
}

interface TryOnSession {
    id: string;
    name: string;
    items: OverlayItem[];
    createdAt: Date;
    thumbnail?: string;
}

const TryOnInteraction: React.FC = () => {
    const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<OverlayItem | null>(null);
    const [isGridMode, setIsGridMode] = useState(false);
    const [savedSessions, setSavedSessions] = useState<TryOnSession[]>([]);
    const [showGrid, setShowGrid] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load saved sessions from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('tryOnSessions');
        if (saved) {
            setSavedSessions(JSON.parse(saved));
        }
    }, []);

    const addProductToOverlay = useCallback((product: Product) => {
        const newItem: OverlayItem = {
            id: `overlay_${Date.now()}_${Math.random()}`,
            product,
            x: 50,
            y: 50,
            width: 150,
            height: 150,
            scale: 1,
            rotation: 0,
            opacity: 0.8,
            zIndex: overlayItems.length + 1,
            locked: false,
            visible: true
        };
        
        setOverlayItems(prev => [...prev, newItem]);
    }, [overlayItems.length]);

    const removeOverlayItem = useCallback((id: string) => {
        setOverlayItems(prev => prev.filter(item => item.id !== id));
        setSelectedItem(null);
    }, []);

    const updateOverlayItem = useCallback((id: string, updates: Partial<OverlayItem>) => {
        setOverlayItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const clearAll = useCallback(() => {
        setOverlayItems([]);
        setSelectedItem(null);
    }, []);

    const duplicateItem = useCallback((item: OverlayItem) => {
        const newItem: OverlayItem = {
            ...item,
            id: `overlay_${Date.now()}_${Math.random()}`,
            x: item.x + 20,
            y: item.y + 20,
            zIndex: overlayItems.length + 1
        };
        
        setOverlayItems(prev => [...prev, newItem]);
    }, [overlayItems.length]);

    const saveSession = useCallback(() => {
        if (overlayItems.length === 0) return;
        
        const session: TryOnSession = {
            id: `session_${Date.now()}`,
            name: `Outfit ${new Date().toLocaleDateString()}`,
            items: overlayItems,
            createdAt: new Date(),
            thumbnail: canvasRef.current ? canvasRef.current.toDataURL('image/png', 0.3) : undefined
        };
        
        const updatedSessions = [...savedSessions, session];
        setSavedSessions(updatedSessions);
        localStorage.setItem('tryOnSessions', JSON.stringify(updatedSessions));
    }, [overlayItems, savedSessions]);

    const loadSession = useCallback((session: TryOnSession) => {
        setOverlayItems(session.items);
    }, []);

    const deleteSession = useCallback((sessionId: string) => {
        const updatedSessions = savedSessions.filter(session => session.id !== sessionId);
        setSavedSessions(updatedSessions);
        localStorage.setItem('tryOnSessions', JSON.stringify(updatedSessions));
    }, [savedSessions]);

    const handleMouseDown = useCallback((e: React.MouseEvent, item: OverlayItem) => {
        if (item.locked) return;
        
        setIsDragging(true);
        setSelectedItem(item);
        setDragStart({ x: e.clientX - item.x, y: e.clientY - item.y });
        
        // Bring to front
        updateOverlayItem(item.id, { zIndex: Math.max(...overlayItems.map(i => i.zIndex)) + 1 });
    }, [overlayItems, updateOverlayItem]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !selectedItem) return;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        updateOverlayItem(selectedItem.id, { x: newX, y: newY });
    }, [isDragging, selectedItem, dragStart, updateOverlayItem]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setSelectedItem(null);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (!selectedItem) return;
        
        switch(e.key) {
            case 'Delete':
            case 'Backspace':
                removeOverlayItem(selectedItem.id);
                break;
            case 'd':
                duplicateItem(selectedItem);
                break;
            case 'ArrowUp':
                updateOverlayItem(selectedItem.id, { y: selectedItem.y - 5 });
                break;
            case 'ArrowDown':
                updateOverlayItem(selectedItem.id, { y: selectedItem.y + 5 });
                break;
            case 'ArrowLeft':
                updateOverlayItem(selectedItem.id, { x: selectedItem.x - 5 });
                break;
            case 'ArrowRight':
                updateOverlayItem(selectedItem.id, { x: selectedItem.x + 5 });
                break;
            case '+':
            case '=':
                updateOverlayItem(selectedItem.id, { scale: Math.min(selectedItem.scale + 0.1, 3) });
                break;
            case '-':
            case '_':
                updateOverlayItem(selectedItem.id, { scale: Math.max(selectedItem.scale - 0.1, 0.3) });
                break;
            case 'r':
                updateOverlayItem(selectedItem.id, { rotation: selectedItem.rotation + 15 });
                break;
            case 'l':
                updateOverlayItem(selectedItem.id, { rotation: selectedItem.rotation - 15 });
                break;
            case 'o':
                updateOverlayItem(selectedItem.id, { opacity: Math.min(selectedItem.opacity + 0.1, 1) });
                break;
            case 'i':
                updateOverlayItem(selectedItem.id, { opacity: Math.max(selectedItem.opacity - 0.1, 0.1) });
                break;
            case ' ':
                updateOverlayItem(selectedItem.id, { locked: !selectedItem.locked });
                break;
            case 'v':
                updateOverlayItem(selectedItem.id, { visible: !selectedItem.visible });
                break;
        }
    }, [selectedItem, removeOverlayItem, duplicateItem, updateOverlayItem]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    const exportAsImage = useCallback(() => {
        if (!canvasRef.current) return;
        
        const link = document.createElement('a');
        link.download = `try-on-outfit-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    }, []);

    const getPopularProducts = useCallback(() => {
        return massiveProductCatalog
            .filter(p => p.inStock)
            .filter(p => p.category === 'mens-clothing' || p.category === 'womens-clothing')
            .slice(0, 12);
    }, []);

    return (
        <div className="h-screen bg-gray-50">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-900">Try-On Studio</h2>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsGridMode(!isGridMode)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    isGridMode 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {isGridMode ? <Layers className="w-4 h-4" /> : <Move className="w-4 h-4" />}
                                {isGridMode ? 'Grid Mode' : 'Free Mode'}
                            </button>
                            
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear All
                            </button>
                            
                            <button
                                onClick={saveSession}
                                disabled={overlayItems.length === 0}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Save Outfit
                            </button>
                            
                            <button
                                onClick={() => setShowGrid(!showGrid)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Grid3x3 className="w-4 h-4" />
                                {showGrid ? 'Hide' : 'Show'} Saved
                            </button>
                            
                            <button
                                onClick={exportAsImage}
                                disabled={overlayItems.length === 0}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex h-full">
                {/* Product Selection Panel */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Select Products</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {getPopularProducts().map((product) => {
                                const isInOverlay = overlayItems.some(item => item.product.id === product.id);
                                
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => !isInOverlay && addProductToOverlay(product)}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                                            isInOverlay
                                                ? 'border-green-600 bg-green-50 cursor-not-allowed'
                                                : 'border-gray-200 hover:border-purple-400'
                                        }`}
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-24 object-cover rounded-lg mb-2"
                                        />
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h4>
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
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-4 bg-white rounded-lg shadow-xl overflow-hidden"
                        width={800}
                        height={600}
                    >
                        {overlayItems.map((item) => (
                            <div
                                key={item.id}
                                onMouseDown={(e) => handleMouseDown(e, item)}
                                className={`absolute cursor-move transition-all ${
                                    selectedItem?.id === item.id ? 'ring-2 ring-purple-600' : ''
                                } ${item.locked ? 'cursor-not-allowed' : ''}`}
                                style={{
                                    left: `${item.x}px`,
                                    top: `${item.y}px`,
                                    width: `${item.width * item.scale}px`,
                                    height: `${item.height * item.scale}px`,
                                    transform: `rotate(${item.rotation}deg)`,
                                    opacity: item.visible ? item.opacity : 0,
                                    zIndex: item.zIndex
                                }}
                            >
                                <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="w-full h-full object-contain pointer-events-none"
                                    draggable={false}
                                />
                                
                                {/* Item Controls */}
                                {selectedItem?.id === item.id && (
                                    <div className="absolute -top-10 -right-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-2">
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { scale: item.scale - 0.1 })}
                                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                            title="Decrease size"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        
                                        <span className="text-xs font-medium px-2">
                                            {Math.round(item.scale * 100)}%
                                        </span>
                                        
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { scale: item.scale + 0.1 })}
                                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                            title="Increase size"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { rotation: item.rotation - 15 })}
                                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                            title="Rotate left"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { rotation: item.rotation + 15 })}
                                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                            title="Rotate right"
                                        >
                                            <RotateCw className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { opacity: item.opacity - 0.1 })}
                                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                            title="Decrease opacity"
                                        >
                                            <EyeOff className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { opacity: item.opacity + 0.1 })}
                                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                            title="Increase opacity"
                                        >
                                            <Eye className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => updateOverlayItem(item.id, { locked: !item.locked })}
                                            className={`p-1 rounded ${
                                                item.locked 
                                                    ? 'bg-red-100 hover:bg-red-200' 
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                            title={item.locked ? 'Unlock' : 'Lock'}
                                        >
                                            {item.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                        
                                        <button
                                            onClick={() => removeOverlayItem(item.id)}
                                            className="p-1 bg-red-100 hover:bg-red-200 rounded"
                                            title="Remove"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        
                                        <button
                                            onClick={() => duplicateItem(item)}
                                            className="p-1 bg-blue-100 hover:bg-blue-200 rounded"
                                            title="Duplicate"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </canvas>
                    
                    {/* Instructions */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 max-w-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Controls</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><strong>Click & Drag:</strong> Move items</p>
                            <p><strong>Arrow Keys:</strong> Move selected</p>
                            <p><strong>+/-:</strong> Scale up/down</p>
                            <p><strong>R/L:</strong> Rotate</p>
                            <p><strong>O/I:</strong> Opacity</p>
                            <p><strong>Space:</strong> Lock/unlock</p>
                            <p><strong>V:</strong> Toggle visibility</p>
                            <p><strong>D:</strong> Duplicate</p>
                            <p><strong>Delete:</strong> Remove</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Sessions Modal */}
            {showGrid && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-96 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Saved Outfits</h3>
                                <button
                                    onClick={() => setShowGrid(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                                {savedSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => {
                                            loadSession(session);
                                            setShowGrid(false);
                                        }}
                                    >
                                        {session.thumbnail && (
                                            <img
                                                src={session.thumbnail}
                                                alt={session.name}
                                                className="w-full h-24 object-cover rounded-lg mb-2"
                                            />
                                        )}
                                        <h4 className="font-semibold text-sm text-gray-900">{session.name}</h4>
                                        <p className="text-xs text-gray-600">
                                            {session.createdAt.toLocaleDateString()} • {session.items.length} items
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    loadSession(session);
                                                    setShowGrid(false);
                                                }}
                                                className="flex-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                                            >
                                                Load
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TryOnInteraction;
