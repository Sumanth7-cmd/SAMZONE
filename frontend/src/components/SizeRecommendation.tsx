import React, { useState, useCallback } from 'react';
import { Ruler, Shirt, ShoppingBag, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { massiveProductCatalog, type Product } from '../data/massiveProductCatalog';

interface BodyMeasurements {
    height: number;
    weight: number;
    chest: number;
    waist: number;
    hips: number;
    inseam: number;
}

interface SizeRecommendation {
    size: string;
    confidence: number;
    fit: 'Perfect' | 'Good' | 'Loose' | 'Tight';
    recommendations: string[];
}

const SizeRecommendation: React.FC = () => {
    const [measurements, setMeasurements] = useState<BodyMeasurements>({
        height: 170,
        weight: 70,
        chest: 96,
        waist: 80,
        hips: 94,
        inseam: 76
    });

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const sizeCharts = {
        'XS': { chest: '84-88', waist: '68-72', hips: '88-92', height: '160-165' },
        'S': { chest: '88-94', waist: '72-78', hips: '92-98', height: '165-170' },
        'M': { chest: '94-100', waist: '78-84', hips: '98-104', height: '170-175' },
        'L': { chest: '100-106', waist: '84-90', hips: '104-110', height: '175-180' },
        'XL': { chest: '106-112', waist: '90-96', hips: '110-116', height: '180-185' },
        'XXL': { chest: '112-118', waist: '96-102', hips: '116-122', height: '185-190' }
    };

    const calculateSize = useCallback((measurements: BodyMeasurements, product: Product): SizeRecommendation => {
        const { chest, waist, hips, height } = measurements;
        
        let bestSize = 'M';
        let bestScore = 0;
        let fit: 'Perfect' | 'Good' | 'Loose' | 'Tight' = 'Good';
        
        // Calculate size based on measurements
        Object.entries(sizeCharts).forEach(([size, ranges]) => {
            let score = 0;
            
            // Check chest
            const chestRange = ranges.chest.split('-').map(Number);
            if (chest >= chestRange[0] && chest <= chestRange[1]) score += 3;
            else if (Math.abs(chest - chestRange[0]) <= 2 || Math.abs(chest - chestRange[1]) <= 2) score += 2;
            else if (Math.abs(chest - chestRange[0]) <= 4 || Math.abs(chest - chestRange[1]) <= 4) score += 1;
            
            // Check waist
            const waistRange = ranges.waist.split('-').map(Number);
            if (waist >= waistRange[0] && waist <= waistRange[1]) score += 3;
            else if (Math.abs(waist - waistRange[0]) <= 2 || Math.abs(waist - waistRange[1]) <= 2) score += 2;
            else if (Math.abs(waist - waistRange[0]) <= 4 || Math.abs(waist - waistRange[1]) <= 4) score += 1;
            
            // Check hips
            const hipsRange = ranges.hips.split('-').map(Number);
            if (hips >= hipsRange[0] && hips <= hipsRange[1]) score += 3;
            else if (Math.abs(hips - hipsRange[0]) <= 2 || Math.abs(hips - hipsRange[1]) <= 2) score += 2;
            else if (Math.abs(hips - hipsRange[0]) <= 4 || Math.abs(hips - hipsRange[1]) <= 4) score += 1;
            
            // Check height
            const heightRange = ranges.height.split('-').map(Number);
            if (height >= heightRange[0] && height <= heightRange[1]) score += 1;
            
            if (score > bestScore) {
                bestScore = score;
                bestSize = size;
            }
        });
        
        // Determine fit quality
        if (bestScore >= 9) fit = 'Perfect';
        else if (bestScore >= 7) fit = 'Good';
        else if (bestScore >= 5) fit = 'Loose';
        else fit = 'Tight';
        
        const confidence = Math.min(bestScore / 10, 0.95);
        
        const recommendations = [];
        if (fit === 'Tight') recommendations.push('Consider sizing up for better comfort');
        if (fit === 'Loose') recommendations.push('Consider sizing down for a better fit');
        if (product.material?.includes('stretch')) recommendations.push('This fabric has stretch, which may affect fit');
        if (product.category === 'footwear') recommendations.push('Check the product description for specific sizing guidelines');
        
        return {
            size: bestSize,
            confidence,
            fit,
            recommendations
        };
    }, []);

    const handleCalculate = useCallback(async () => {
        if (!selectedProduct) return;
        
        setIsCalculating(true);
        
        // Simulate calculation delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = calculateSize(measurements, selectedProduct);
        setRecommendation(result);
        setIsCalculating(false);
    }, [measurements, selectedProduct, calculateSize]);

    const handleMeasurementChange = useCallback((field: keyof BodyMeasurements, value: number) => {
        setMeasurements(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const getPopularProducts = useCallback(() => {
        return massiveProductCatalog
            .filter(p => p.inStock)
            .filter(p => p.category === 'mens-clothing' || p.category === 'womens-clothing')
            .slice(0, 6);
    }, []);

    return (
        <div className="space-y-6">
            {/* Body Measurements Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-purple-600" />
                    Enter Your Measurements
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Height (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.height}
                            onChange={(e) => handleMeasurementChange('height', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="140"
                            max="220"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weight (kg)
                        </label>
                        <input
                            type="number"
                            value={measurements.weight}
                            onChange={(e) => handleMeasurementChange('weight', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="40"
                            max="150"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chest (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.chest}
                            onChange={(e) => handleMeasurementChange('chest', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="70"
                            max="130"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Waist (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.waist}
                            onChange={(e) => handleMeasurementChange('waist', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="60"
                            max="120"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hips (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.hips}
                            onChange={(e) => handleMeasurementChange('hips', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="70"
                            max="130"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inseam (cm)
                        </label>
                        <input
                            type="number"
                            value={measurements.inseam}
                            onChange={(e) => handleMeasurementChange('inseam', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="60"
                            max="90"
                        />
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-700">
                            For accurate measurements, use a flexible measuring tape and measure over light clothing. 
                            Stand naturally and breathe normally.
                        </p>
                    </div>
                </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                    Select Product for Size Recommendation
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getPopularProducts().map((product) => (
                        <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                                selectedProduct?.id === product.id
                                    ? 'border-purple-600 bg-purple-50'
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
                                <div className="flex gap-1">
                                    {product.sizes?.slice(0, 3).map((size, index) => (
                                        <span
                                            key={index}
                                            className="text-xs bg-gray-100 px-1 py-0.5 rounded"
                                        >
                                            {size}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calculate Button */}
            {selectedProduct && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <button
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCalculating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Calculating Size...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="w-5 h-5" />
                                Get Size Recommendation
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Recommendation Results */}
            {recommendation && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Size Recommendation for {selectedProduct?.name}
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <div>
                                <div className="text-2xl font-bold text-purple-900">{recommendation.size}</div>
                                <div className="text-sm text-purple-700">Recommended Size</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-semibold text-purple-900">
                                    {Math.round(recommendation.confidence * 100)}%
                                </div>
                                <div className="text-sm text-purple-700">Confidence</div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Shirt className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-700">Fit Quality:</span>
                                <span className={`text-sm font-semibold ${
                                    recommendation.fit === 'Perfect' ? 'text-green-600' :
                                    recommendation.fit === 'Good' ? 'text-blue-600' :
                                    recommendation.fit === 'Loose' ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {recommendation.fit}
                                </span>
                            </div>
                        </div>

                        {recommendation.recommendations.length > 0 && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Additional Recommendations:</h4>
                                <ul className="space-y-1">
                                    {recommendation.recommendations.map((rec, index) => (
                                        <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                                            <div className="w-1 h-1 bg-blue-600 rounded-full mt-1.5" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2">Size Chart Reference:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                {Object.entries(sizeCharts).map(([size, ranges]) => (
                                    <div
                                        key={size}
                                        className={`p-2 rounded ${
                                            size === recommendation.size
                                                ? 'bg-purple-100 border border-purple-300'
                                                : 'bg-white border border-gray-200'
                                        }`}
                                    >
                                        <div className="font-semibold text-gray-900">{size}</div>
                                        <div className="text-xs text-gray-600">
                                            C: {ranges.chest} | W: {ranges.waist}
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

export default SizeRecommendation;
