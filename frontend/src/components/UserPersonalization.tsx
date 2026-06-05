import React, { useState, useEffect } from 'react';
import { User, Heart, Clock, TrendingUp, Settings, Save, Star, Eye, Palette, Search, X } from 'lucide-react';
import { expandedProductCatalog, type Product } from '../data/expandedProductCatalog';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    preferences: {
        style: 'classic' | 'trendy' | 'minimalist' | 'bold';
        preferredColors: string[];
        preferredBrands: string[];
        sizes: {
            tops: string;
            bottoms: string;
            shoes: string;
        };
        budgetRanges: {
            casual: [number, number];
            formal: [number, number];
            accessories: [number, number];
        };
        occasions: string[];
        skinTone?: {
            tone: 'light' | 'medium' | 'dark';
            undertone: 'warm' | 'cool' | 'neutral';
        };
    };
    behavior: {
        recentlyViewed: Product[];
        wishlist: Product[];
        searchHistory: string[];
        clickedProducts: number[];
        purchaseHistory: {
            product: Product;
            date: Date;
            price: number;
        }[];
    };
    aiInsights: {
        styleScore: number;
        colorPreferences: { color: string; frequency: number }[];
        brandLoyalty: { brand: string; purchases: number }[];
        sizeAccuracy: { size: string; accuracy: number }[];
        recommendations: Product[];
    };
}

const UserPersonalization: React.FC = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'preferences' | 'behavior' | 'insights' | 'recommendations'>('preferences');
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const styles = [
        { id: 'classic', name: 'Classic', description: 'Timeless and elegant' },
        { id: 'trendy', name: 'Trendy', description: 'Fashion-forward and bold' },
        { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple' },
        { id: 'bold', name: 'Bold', description: 'Statement-making' }
    ];

    const colors = [
        'Black', 'White', 'Navy', 'Gray', 'Beige', 'Brown', 
        'Blue', 'Red', 'Green', 'Pink', 'Purple', 'Yellow', 'Orange'
    ];

    const brands = [
        'Nike', 'Adidas', 'Puma', 'Levis', 'Tommy Hilfiger', 'Calvin Klein',
        'Zara', 'H&M', 'Gap', 'Apple', 'Samsung', 'Sony', 'HP', 'Dell'
    ];

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const occasions = [
        'Casual', 'Work', 'Party', 'Date', 'Interview', 'Wedding', 'Gym', 'Travel'
    ];

    useEffect(() => {
        // Load user profile from localStorage
        const savedProfile = localStorage.getItem('samzone_user_profile');
        if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
        } else {
            // Create default profile
            const defaultProfile: UserProfile = {
                id: 'user_' + Date.now(),
                name: 'Guest User',
                email: 'guest@samzone.com',
                preferences: {
                    style: 'classic',
                    preferredColors: ['Black', 'White', 'Navy'],
                    preferredBrands: ['Nike', 'Adidas'],
                    sizes: {
                        tops: 'M',
                        bottoms: 'M',
                        shoes: '9'
                    },
                    budgetRanges: {
                        casual: [1000, 5000],
                        formal: [3000, 10000],
                        accessories: [500, 3000]
                    },
                    occasions: ['Casual', 'Work']
                },
                behavior: {
                    recentlyViewed: [],
                    wishlist: [],
                    searchHistory: [],
                    clickedProducts: [],
                    purchaseHistory: []
                },
                aiInsights: {
                    styleScore: 0.75,
                    colorPreferences: [],
                    brandLoyalty: [],
                    sizeAccuracy: [],
                    recommendations: []
                }
            };
            setUserProfile(defaultProfile);
            localStorage.setItem('samzone_user_profile', JSON.stringify(defaultProfile));
        }
    }, []);

    const generateAIInsights = (profile: UserProfile): UserProfile['aiInsights'] => {
        // Analyze color preferences
        const colorFrequency: { [key: string]: number } = {};
        profile.behavior.recentlyViewed.forEach(product => {
            product.colors.forEach(color => {
                colorFrequency[color] = (colorFrequency[color] || 0) + 1;
            });
        });
        
        const colorPreferences = Object.entries(colorFrequency)
            .map(([color, frequency]) => ({ color, frequency }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        // Analyze brand loyalty
        const brandFrequency: { [key: string]: number } = {};
        profile.behavior.purchaseHistory.forEach(purchase => {
            brandFrequency[purchase.product.brand] = (brandFrequency[purchase.product.brand] || 0) + 1;
        });
        
        const brandLoyalty = Object.entries(brandFrequency)
            .map(([brand, purchases]) => ({ brand, purchases }))
            .sort((a, b) => b.purchases - a.purchases)
            .slice(0, 5);

        // Generate recommendations based on preferences
        const recommendations = expandedProductCatalog
            .filter(product => 
                product.inStock &&
                product.colors.some(color => 
                    profile.preferences.preferredColors.some(prefColor => 
                        color.toLowerCase().includes(prefColor.toLowerCase())
                    )
                ) &&
                profile.preferences.preferredBrands.some(brand => 
                    product.brand.toLowerCase().includes(brand.toLowerCase())
                )
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 12);

        return {
            styleScore: 0.7 + Math.random() * 0.3,
            colorPreferences,
            brandLoyalty,
            sizeAccuracy: [
                { size: profile.preferences.sizes.tops, accuracy: 0.85 + Math.random() * 0.15 },
                { size: profile.preferences.sizes.bottoms, accuracy: 0.85 + Math.random() * 0.15 },
                { size: profile.preferences.sizes.shoes, accuracy: 0.85 + Math.random() * 0.15 }
            ],
            recommendations
        };
    };

    const handleSaveProfile = async () => {
        if (!tempProfile) return;
        
        setIsSaving(true);
        
        // Simulate saving to backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate AI insights
        const updatedProfile = {
            ...tempProfile,
            aiInsights: generateAIInsights(tempProfile)
        };
        
        setUserProfile(updatedProfile);
        localStorage.setItem('samzone_user_profile', JSON.stringify(updatedProfile));
        setIsEditing(false);
        setTempProfile(null);
        setIsSaving(false);
    };

    const handleStartEdit = () => {
        if (userProfile) {
            setTempProfile(JSON.parse(JSON.stringify(userProfile)));
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setTempProfile(null);
        setIsEditing(false);
    };

    const updatePreference = (path: string, value: any) => {
        if (!tempProfile) return;
        
        const keys = path.split('.');
        const updated = { ...tempProfile };
        let current: any = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        setTempProfile(updated);
    };

    const toggleColor = (color: string) => {
        if (!tempProfile) return;
        
        const colors = tempProfile.preferences.preferredColors;
        const updated = colors.includes(color)
            ? colors.filter(c => c !== color)
            : [...colors, color];
        
        updatePreference('preferences.preferredColors', updated);
    };

    const toggleBrand = (brand: string) => {
        if (!tempProfile) return;
        
        const brands = tempProfile.preferences.preferredBrands;
        const updated = brands.includes(brand)
            ? brands.filter(b => b !== brand)
            : [...brands, brand];
        
        updatePreference('preferences.preferredBrands', updated);
    };

    const toggleOccasion = (occasion: string) => {
        if (!tempProfile) return;
        
        const occasions = tempProfile.preferences.occasions;
        const updated = occasions.includes(occasion)
            ? occasions.filter(o => o !== occasion)
            : [...occasions, occasion];
        
        updatePreference('preferences.occasions', updated);
    };

    const addToWishlist = (product: Product) => {
        if (!userProfile) return;
        
        const updated = {
            ...userProfile,
            behavior: {
                ...userProfile.behavior,
                wishlist: [...userProfile.behavior.wishlist, product]
            }
        };
        
        setUserProfile(updated);
        localStorage.setItem('samzone_user_profile', JSON.stringify(updated));
    };

    const removeFromWishlist = (productId: number) => {
        if (!userProfile) return;
        
        const updated = {
            ...userProfile,
            behavior: {
                ...userProfile.behavior,
                wishlist: userProfile.behavior.wishlist.filter(p => p.id !== productId)
            }
        };
        
        setUserProfile(updated);
        localStorage.setItem('samzone_user_profile', JSON.stringify(updated));
    };

    const currentProfile = tempProfile || userProfile;

    if (!currentProfile) {
        return <div className="text-center py-12">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Personalization Center</h1>
                                <p className="text-gray-600">{currentProfile.name} • {currentProfile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleStartEdit}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex gap-2 border-b border-gray-200">
                        {[
                            { id: 'preferences', label: 'Preferences', icon: Settings },
                            { id: 'behavior', label: 'Behavior', icon: Eye },
                            { id: 'insights', label: 'AI Insights', icon: TrendingUp },
                            { id: 'recommendations', label: 'Recommendations', icon: Star }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Style Preferences</h2>
                            
                            {/* Style */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Style</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {styles.map(style => (
                                        <button
                                            key={style.id}
                                            disabled={!isEditing}
                                            onClick={() => isEditing && updatePreference('preferences.style', style.id)}
                                            className={`p-3 rounded-lg border-2 transition-colors ${
                                                currentProfile.preferences.style === style.id
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            <h3 className="font-medium text-gray-900">{style.name}</h3>
                                            <p className="text-xs text-gray-600">{style.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Colors ({currentProfile.preferences.preferredColors.length}/5)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            disabled={!isEditing}
                                            onClick={() => isEditing && toggleColor(color)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                currentProfile.preferences.preferredColors.includes(color)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brands */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Brands ({currentProfile.preferences.preferredBrands.length}/5)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {brands.map(brand => (
                                        <button
                                            key={brand}
                                            disabled={!isEditing}
                                            onClick={() => isEditing && toggleBrand(brand)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                currentProfile.preferences.preferredBrands.includes(brand)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {brand}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sizes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Tops</label>
                                        <select
                                            value={currentProfile.preferences.sizes.tops}
                                            onChange={(e) => isEditing && updatePreference('preferences.sizes.tops', e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                        >
                                            {sizes.map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Bottoms</label>
                                        <select
                                            value={currentProfile.preferences.sizes.bottoms}
                                            onChange={(e) => isEditing && updatePreference('preferences.sizes.bottoms', e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                        >
                                            {sizes.map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Shoes</label>
                                        <select
                                            value={currentProfile.preferences.sizes.shoes}
                                            onChange={(e) => isEditing && updatePreference('preferences.sizes.shoes', e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                        >
                                            {sizes.map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Occasions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Occasions</label>
                                <div className="flex flex-wrap gap-2">
                                    {occasions.map(occasion => (
                                        <button
                                            key={occasion}
                                            disabled={!isEditing}
                                            onClick={() => isEditing && toggleOccasion(occasion)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                currentProfile.preferences.occasions.includes(occasion)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {occasion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Behavior Tab */}
                    {activeTab === 'behavior' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Shopping Behavior</h2>
                            
                            {/* Recently Viewed */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Recently Viewed ({currentProfile.behavior.recentlyViewed.length})
                                </h3>
                                {currentProfile.behavior.recentlyViewed.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {currentProfile.behavior.recentlyViewed.slice(0, 8).map(product => (
                                            <div key={product.id} className="text-center">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-20 object-cover rounded-lg mb-2"
                                                />
                                                <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                                                <p className="text-xs font-bold text-indigo-900">₹{product.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No recently viewed items</p>
                                )}
                            </div>

                            {/* Wishlist */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    Wishlist ({currentProfile.behavior.wishlist.length})
                                </h3>
                                {currentProfile.behavior.wishlist.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {currentProfile.behavior.wishlist.map(product => (
                                            <div key={product.id} className="relative">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-20 object-cover rounded-lg mb-2"
                                                />
                                                <button
                                                    onClick={() => removeFromWishlist(product.id)}
                                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                                                <p className="text-xs font-bold text-indigo-900">₹{product.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No items in wishlist</p>
                                )}
                            </div>

                            {/* Search History */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Search History
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentProfile.behavior.searchHistory.slice(0, 20).map((query, index) => (
                                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                            {query}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Insights Tab */}
                    {activeTab === 'insights' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Insights</h2>
                            
                            {/* Style Score */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Your Style Score</h3>
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-lg font-medium text-gray-900">Overall Style Score</span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                            {Math.round(currentProfile.aiInsights.styleScore * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full"
                                            style={{ width: `${currentProfile.aiInsights.styleScore * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color Preferences */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Your Color Preferences
                                </h3>
                                <div className="space-y-2">
                                    {currentProfile.aiInsights.colorPreferences.map((pref, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-6 h-6 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: pref.color.toLowerCase() }}
                                                />
                                                <span className="text-sm font-medium text-gray-900">{pref.color}</span>
                                            </div>
                                            <span className="text-sm text-gray-600">{pref.frequency} views</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Loyalty */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Brand Loyalty</h3>
                                <div className="space-y-2">
                                    {currentProfile.aiInsights.brandLoyalty.map((loyalty, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-900">{loyalty.brand}</span>
                                            <span className="text-sm text-gray-600">{loyalty.purchases} purchases</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Size Accuracy */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Size Accuracy</h3>
                                <div className="space-y-2">
                                    {currentProfile.aiInsights.sizeAccuracy.map((accuracy, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-900">Size {accuracy.size}</span>
                                            <span className="text-sm text-gray-600">{Math.round(accuracy.accuracy * 100)}% accuracy</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recommendations Tab */}
                    {activeTab === 'recommendations' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personalized Recommendations</h2>
                            
                            <div className="grid grid-cols-4 gap-4">
                                {currentProfile.aiInsights.recommendations.map(product => (
                                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-24 object-cover rounded-lg mb-2"
                                        />
                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                                        <p className="text-xs text-gray-600">{product.brand}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-bold text-indigo-900">₹{product.price.toLocaleString('en-IN')}</span>
                                            <button
                                                onClick={() => addToWishlist(product)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Heart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPersonalization;
