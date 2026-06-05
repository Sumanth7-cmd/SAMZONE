import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Sparkles, Brain, TrendingUp, User } from 'lucide-react';
import type { Product } from '../services/api';
import { AIEmbeddingsService, type OutfitFromImage } from '../services/aiEmbeddings';
import OutfitRecommendationComponent from './OutfitRecommendation';

interface SimilarProduct {
    product: Product;
    similarity: number;
    reasons: string[];
}

const VisualSearchAI: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
    const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
    const [generatedOutfit, setGeneratedOutfit] = useState<OutfitFromImage | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize AI embeddings service
    useEffect(() => {
        AIEmbeddingsService.loadUserProfile();
        AIEmbeddingsService.loadCachedEmbeddings();
    }, []);

    // Process uploaded image with AI
    const processImageWithAI = useCallback(async () => {
        if (!uploadedImage) return;

        setIsAnalyzing(true);
        
        try {
            // Generate image embedding
            const embedding = await AIEmbeddingsService.generateImageEmbedding(uploadedImage);
            setImageEmbedding(embedding);
            
            // Find similar products using vector search
            const similar = AIEmbeddingsService.findSimilarProducts(embedding, 6);
            
            // Convert to display format
            const formattedSimilar = similar.map(item => ({
                product: item.productData,
                similarity: item.similarity || 0,
                reasons: generateMatchReasons(item.productData, item.similarity || 0)
            }));
            
            setSimilarProducts(formattedSimilar);
        } catch (error) {
            console.error('AI processing error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [uploadedImage]);

    // Generate outfit from image
    const generateOutfitFromImage = useCallback(async () => {
        if (!imageEmbedding) return;

        setIsGeneratingOutfit(true);
        
        try {
            // Get all products for outfit generation
            const response = await fetch('http://localhost:8080/api/products');
            const allProducts = await response.json();
            
            // Generate outfit using AI embeddings
            const outfit = await AIEmbeddingsService.generateOutfitFromEmbedding(
                imageEmbedding, 
                allProducts.content || allProducts
            );
            
            setGeneratedOutfit(outfit);
        } catch (error) {
            console.error('Outfit generation error:', error);
        } finally {
            setIsGeneratingOutfit(false);
        }
    }, [imageEmbedding]);

    // Generate match reasons for products
    const generateMatchReasons = (product: Product, similarity: number): string[] => {
        const reasons: string[] = [];
        
        if (similarity > 0.8) reasons.push('Very high similarity');
        else if (similarity > 0.6) reasons.push('High similarity');
        else if (similarity > 0.4) reasons.push('Moderate similarity');
        
        if (product.rating >= 4.5) reasons.push('Excellent rating');
        else if (product.rating >= 4.0) reasons.push('Good rating');
        
        const userProfile = AIEmbeddingsService.getUserProfile();
        if (userProfile.favoriteBrands.includes(product.brand)) {
            reasons.push('Your favorite brand');
        }
        
        if (product.colors?.some(color => 
            userProfile.favoriteColors.includes(color.toLowerCase())
        )) {
            reasons.push('Your preferred color');
        }
        
        return reasons;
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedImage(result);
            setSimilarProducts([]);
            setGeneratedOutfit(null);
        };
        reader.readAsDataURL(file);
    };

    const handleClose = () => {
        setIsOpen(false);
        setUploadedImage(null);
        setImageEmbedding(null);
        setSimilarProducts([]);
        setGeneratedOutfit(null);
    };

    const handleAddToCart = (product: Product) => {
        // Emit cart event
        const event = new CustomEvent('addToCart', { detail: product });
        window.dispatchEvent(event);
    };

    return (
        <>
            {/* AI Visual Search Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center gap-2"
            >
                <Brain className="w-6 h-6" />
                <span className="font-medium">AI Visual Search</span>
            </button>

            {/* AI Visual Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <h2 className="text-2xl font-bold text-gray-900">AI Visual Search</h2>
                                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">Powered by AI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowUserProfile(true)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <User className="w-5 h-5 text-gray-500" />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
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
                                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 p-8 rounded-xl transition-colors"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                        <span className="text-lg font-medium text-gray-700">Choose an image</span>
                                        <p className="text-sm text-gray-500">AI will analyze and find similar items</p>
                                    </label>
                                </div>

                                {/* Image Preview */}
                                {uploadedImage && (
                                    <div className="mt-6">
                                        <h4 className="text-md font-semibold text-gray-900 mb-3">Uploaded Image</h4>
                                        <div className="relative rounded-lg overflow-hidden">
                                            <img 
                                                src={uploadedImage}
                                                alt="Uploaded clothing"
                                                className="w-full h-64 object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                                                AI Analyzed
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <button
                                                onClick={processImageWithAI}
                                                disabled={isAnalyzing}
                                                className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Brain className="w-5 h-5" />
                                                {isAnalyzing ? 'Analyzing...' : 'Find Similar'}
                                            </button>
                                            <button
                                                onClick={generateOutfitFromImage}
                                                disabled={!imageEmbedding || isGeneratingOutfit}
                                                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <TrendingUp className="w-5 h-5" />
                                                {isGeneratingOutfit ? 'Generating...' : 'Generate Outfit'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Results Section */}
                            <div className="lg:col-span-1">
                                {similarProducts.length > 0 && (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Similarity Results</h3>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {similarProducts.map((result) => (
                                                <div key={result.product.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                                                    <div className="flex gap-4">
                                                        <img 
                                                            src={result.product.image}
                                                            alt={result.product.name}
                                                            className="w-20 h-20 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-900">{result.product.name}</h4>
                                                            <p className="text-sm text-gray-600">{result.product.brand}</p>
                                                            <p className="text-lg font-bold text-purple-900">₹{result.product.price?.toLocaleString('en-IN')}</p>
                                                            
                                                            {/* AI Similarity Score */}
                                                            <div className="mt-2">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm font-medium text-gray-600">AI Match:</span>
                                                                    <span className="text-lg font-bold text-purple-900">
                                                                        {Math.round(result.similarity * 100)}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                                                                        style={{ width: `${result.similarity * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Match Reasons */}
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                {result.reasons.join(' • ')}
                                                            </div>
                                                            
                                                            {/* Actions */}
                                                            <div className="mt-3 flex gap-2">
                                                                <button 
                                                                    onClick={() => handleAddToCart(result.product)}
                                                                    className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                                                >
                                                                    Add to Cart
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Outfit Modal */}
            {generatedOutfit && (
                <OutfitRecommendationComponent
                    outfit={{
                        top: { product: generatedOutfit.top, category: 'top', reason: 'AI selected based on image analysis' },
                        bottom: { product: generatedOutfit.bottom, category: 'bottom', reason: 'AI selected for style compatibility' },
                        shoes: { product: generatedOutfit.shoes, category: 'shoes', reason: 'AI selected for outfit harmony' },
                        accessory: { product: generatedOutfit.accessory, category: 'accessory', reason: 'AI selected as perfect complement' },
                        score: generatedOutfit.score,
                        totalPrice: (generatedOutfit.top.price || 0) + (generatedOutfit.bottom.price || 0) + (generatedOutfit.shoes.price || 0) + (generatedOutfit.accessory.price || 0),
                        explanation: generatedOutfit.explanation
                    }}
                    onClose={() => setGeneratedOutfit(null)}
                    onAddToCart={handleAddToCart}
                />
            )}

            {/* User Profile Modal */}
            {showUserProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">AI Style Preferences</h3>
                        <p className="text-gray-600 mb-6">Personalize your AI recommendations</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Colors</label>
                                <input
                                    type="text"
                                    placeholder="black, white, blue..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    defaultValue={AIEmbeddingsService.getUserProfile().favoriteColors.join(', ')}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Brands</label>
                                <input
                                    type="text"
                                    placeholder="Nike, Adidas, Urban Street..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    defaultValue={AIEmbeddingsService.getUserProfile().favoriteBrands.join(', ')}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        defaultValue={AIEmbeddingsService.getUserProfile().budgetRange.min}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        defaultValue={AIEmbeddingsService.getUserProfile().budgetRange.max}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowUserProfile(false)}
                                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Save Preferences
                            </button>
                            <button
                                onClick={() => setShowUserProfile(false)}
                                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VisualSearchAI;
