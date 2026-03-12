import React from 'react';
import { User, Palette, Ruler, Star, TrendingUp } from 'lucide-react';
import type { BodyMeasurements } from './PoseDetector';

interface OutfitAnalysisProps {
    measurements: BodyMeasurements | null;
    outfitScore: number;
    recommendedOutfit: any;
    onAddToCart: () => void;
}

const OutfitAnalysis: React.FC<OutfitAnalysisProps> = ({ 
    measurements, 
    outfitScore, 
    recommendedOutfit, 
    onAddToCart 
}) => {
    const getScoreColor = (score: number): string => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        if (score >= 4) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number): string => {
        if (score >= 8) return 'bg-green-100';
        if (score >= 6) return 'bg-yellow-100';
        if (score >= 4) return 'bg-orange-100';
        return 'bg-red-100';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    Outfit Analysis
                </h3>
                <p className="text-sm text-gray-600">AI-powered styling recommendations</p>
            </div>

            {/* Body Analysis */}
            {measurements && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Body Analysis
                    </h4>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Skin Tone:</span>
                            <span className="font-bold text-blue-900 capitalize">{measurements.skinTone}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Recommended Size:</span>
                            <span className="font-bold text-lg text-blue-900">{measurements.recommendedSize}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Body Measurements:</span>
                            <span className="text-sm text-gray-600">
                                {Math.round(measurements.shoulderWidth)}px × {Math.round(measurements.torsoHeight)}px
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Color Recommendations */}
            {measurements && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-green-600" />
                        Best Colors for You
                    </h4>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex flex-wrap gap-3">
                            {measurements.recommendedColors.map((color, index) => (
                                <div key={index} className="text-center">
                                    <div
                                        className="w-12 h-12 rounded-full border-2 border-gray-300 mb-2"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                    </div>
                                ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            These colors complement your {measurements.skinTone} skin tone perfectly
                        </p>
                    </div>
                </div>
            )}

            {/* Outfit Score */}
            <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Outfit Score
                </h4>
                
                <div className={`p-6 rounded-lg border-2 ${getScoreBg(outfitScore)}`}>
                    <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(outfitScore)}`}>
                            {outfitScore}/10
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {outfitScore >= 8 ? 'Excellent Match!' : 
                             outfitScore >= 6 ? 'Great Match!' : 
                             outfitScore >= 4 ? 'Good Match!' : 'Consider Alternatives'}
                        </p>
                    </div>
                    
                    {/* Score Breakdown */}
                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Color Compatibility:</span>
                            <span className="font-medium">4/4 points</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Style Compatibility:</span>
                            <span className="font-medium">3/3 points</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Price Balance:</span>
                            <span className="font-medium">2/2 points</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Rating Quality:</span>
                            <span className="font-medium">1/1 point</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommended Outfit */}
            {recommendedOutfit && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-purple-600" />
                        Recommended Outfit
                    </h4>
                    
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
                        {/* Top */}
                        <div className="flex items-center gap-3">
                            <img
                                src={recommendedOutfit.top.product.image}
                                alt={recommendedOutfit.top.product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h5 className="font-bold text-gray-900">{recommendedOutfit.top.product.name}</h5>
                                <p className="text-sm text-gray-600">{recommendedOutfit.top.product.brand}</p>
                                <p className="text-lg font-bold text-purple-900">₹{recommendedOutfit.top.product.price?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Bottom */}
                        <div className="flex items-center gap-3">
                            <img
                                src={recommendedOutfit.bottom.product.image}
                                alt={recommendedOutfit.bottom.product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h5 className="font-bold text-gray-900">{recommendedOutfit.bottom.product.name}</h5>
                                <p className="text-sm text-gray-600">{recommendedOutfit.bottom.product.brand}</p>
                                <p className="text-lg font-bold text-purple-900">₹{recommendedOutfit.bottom.product.price?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Shoes */}
                        <div className="flex items-center gap-3">
                            <img
                                src={recommendedOutfit.shoes.product.image}
                                alt={recommendedOutfit.shoes.product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h5 className="font-bold text-gray-900">{recommendedOutfit.shoes.product.name}</h5>
                                <p className="text-sm text-gray-600">{recommendedOutfit.shoes.product.brand}</p>
                                <p className="text-lg font-bold text-purple-900">₹{recommendedOutfit.shoes.product.price?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Accessory */}
                        {recommendedOutfit.accessory && (
                            <div className="flex items-center gap-3">
                                <img
                                    src={recommendedOutfit.accessory.product.image}
                                    alt={recommendedOutfit.accessory.product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <h5 className="font-bold text-gray-900">{recommendedOutfit.accessory.product.name}</h5>
                                    <p className="text-sm text-gray-600">{recommendedOutfit.accessory.product.brand}</p>
                                    <p className="text-lg font-bold text-purple-900">₹{recommendedOutfit.accessory.product.price?.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        )}

                        {/* Total Price */}
                        <div className="mt-4 pt-4 border-t border-purple-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">Total Outfit Price:</span>
                                <span className="text-2xl font-bold text-purple-900">
                                    ₹{(
                                        (recommendedOutfit.top.product.price || 0) + 
                                        (recommendedOutfit.bottom.product.price || 0) + 
                                        (recommendedOutfit.shoes.product.price || 0) + 
                                        (recommendedOutfit.accessory.product.price || 0)
                                    ).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Button */}
            {recommendedOutfit && (
                <div className="mt-6">
                    <button
                        onClick={onAddToCart}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold text-lg flex items-center justify-center gap-3"
                    >
                        <TrendingUp className="w-5 h-5" />
                        Add Complete Outfit to Cart
                    </button>
                </div>
            )}
        </div>
    );
};

export default OutfitAnalysis;
