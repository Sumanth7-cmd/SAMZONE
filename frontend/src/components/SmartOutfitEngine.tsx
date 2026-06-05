import React, { useState, useCallback } from 'react';
import { Sparkles, Calendar, Heart, Briefcase, Coffee, Music, Gamepad2, Users, Award, ShoppingBag, Clock } from 'lucide-react';
import { expandedProductCatalog, type Product } from '../data/expandedProductCatalog';

interface OutfitSuggestion {
    id: string;
    occasion: string;
    title: string;
    description: string;
    items: Product[];
    colorScheme: string[];
    styleTips: string[];
    confidence: number;
    priceRange: {
        min: number;
        max: number;
    };
    weather: 'warm' | 'cold' | 'any';
    formality: 'casual' | 'formal' | 'semi-formal';
}

interface UserPreferences {
    style: 'classic' | 'trendy' | 'minimalist' | 'bold';
    preferredColors: string[];
    budget: number;
    size: string;
    gender: 'men' | 'women' | 'unisex';
}

const SmartOutfitEngine: React.FC = () => {
    const [selectedOccasion, setSelectedOccasion] = useState<string>('');
    const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({
        style: 'classic',
        preferredColors: ['Black', 'White', 'Navy'],
        budget: 5000,
        size: 'M',
        gender: 'men'
    });
    const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null);

    const occasions = [
        { id: 'casual', name: 'Casual Day Out', icon: Coffee, description: 'Comfortable everyday wear' },
        { id: 'date', name: 'Date Night', icon: Heart, description: 'Romantic and stylish' },
        { id: 'interview', name: 'Job Interview', icon: Briefcase, description: 'Professional and confident' },
        { id: 'party', name: 'Party/Club', icon: Music, description: 'Fun and trendy' },
        { id: 'wedding', name: 'Wedding', icon: Award, description: 'Elegant and appropriate' },
        { id: 'gaming', name: 'Gaming Session', icon: Gamepad2, description: 'Comfortable and cool' },
        { id: 'meeting', name: 'Business Meeting', icon: Users, description: 'Professional and polished' },
        { id: 'birthday', name: 'Birthday Party', icon: Calendar, description: 'Celebratory and fun' }
    ];

    const styles = [
        { id: 'classic', name: 'Classic', description: 'Timeless and elegant' },
        { id: 'trendy', name: 'Trendy', description: 'Fashion-forward and bold' },
        { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple' },
        { id: 'bold', name: 'Bold', description: 'Statement-making' }
    ];

    const colors = [
        'Black', 'White', 'Navy', 'Gray', 'Beige', 'Brown', 
        'Blue', 'Red', 'Green', 'Pink', 'Purple', 'Yellow'
    ];

    const generateOutfitSuggestions = useCallback(async (occasion: string) => {
        setIsGenerating(true);
        setSelectedOutfit(null);
        
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const suggestions = generateProOutfits(occasion, userPreferences);
        setOutfitSuggestions(suggestions);
        setIsGenerating(false);
    }, [userPreferences]);

    const generateProOutfits = (occasion: string, preferences: UserPreferences): OutfitSuggestion[] => {
        const outfitTemplates = {
            casual: [
                {
                    occasion: 'casual',
                    title: 'Relaxed Weekend Look',
                    description: 'Perfect for coffee runs, shopping, or casual meetups',
                    items: ['tshirts', 'jeans', 'sneakers'],
                    colorScheme: ['Blue', 'White', 'Gray'],
                    styleTips: [
                        'Keep it comfortable yet stylish',
                        'Layer with a light jacket if needed',
                        'Choose breathable fabrics'
                    ],
                    formality: 'casual',
                    weather: 'any'
                },
                {
                    occasion: 'casual',
                    title: 'Smart Casual Ensemble',
                    description: 'Elevated casual for brunch or casual office days',
                    items: ['shirts', 'chinos', 'casual-shoes'],
                    colorScheme: ['Navy', 'Beige', 'White'],
                    styleTips: [
                        'Mix structured with relaxed pieces',
                        'Add a watch for sophistication',
                        'Choose quality fabrics'
                    ],
                    formality: 'semi-formal',
                    weather: 'warm'
                }
            ],
            date: [
                {
                    occasion: 'date',
                    title: 'Romantic Evening Look',
                    description: 'Charming and sophisticated for a special evening',
                    items: ['shirts', 'trousers', 'dress-shoes'],
                    colorScheme: ['Black', 'White', 'Navy'],
                    styleTips: [
                        'Well-fitted pieces are essential',
                        'Add subtle cologne',
                        'Choose elegant accessories'
                    ],
                    formality: 'semi-formal',
                    weather: 'any'
                },
                {
                    occasion: 'date',
                    title: 'Casual Date Outfit',
                    description: 'Comfortable yet stylish for a relaxed date',
                    items: ['polos', 'jeans', 'sneakers'],
                    colorScheme: ['Blue', 'Gray', 'White'],
                    styleTips: [
                        'Keep it clean and put-together',
                        'Choose comfortable yet stylish shoes',
                        'Add a subtle accessory'
                    ],
                    formality: 'casual',
                    weather: 'warm'
                }
            ],
            interview: [
                {
                    occasion: 'interview',
                    title: 'Professional Power Look',
                    description: 'Confidence-boosting professional attire',
                    items: ['shirts', 'trousers', 'formal-shoes', 'blazer'],
                    colorScheme: ['Navy', 'White', 'Gray'],
                    styleTips: [
                        'Conservative colors are safest',
                        'Ensure perfect fit',
                        'Polished shoes are essential'
                    ],
                    formality: 'formal',
                    weather: 'any'
                },
                {
                    occasion: 'interview',
                    title: 'Modern Professional',
                    description: 'Contemporary yet appropriate for modern workplaces',
                    items: ['shirts', 'chinos', 'dress-shoes'],
                    colorScheme: ['Gray', 'Blue', 'White'],
                    styleTips: [
                        'Show personality subtly',
                        'Choose quality over quantity',
                        'Maintain grooming standards'
                    ],
                    formality: 'semi-formal',
                    weather: 'warm'
                }
            ],
            party: [
                {
                    occasion: 'party',
                    title: 'Club Ready Look',
                    description: 'Eye-catching and trendy for nightlife',
                    items: ['graphic-tshirts', 'jeans', 'sneakers'],
                    colorScheme: ['Black', 'Red', 'White'],
                    styleTips: [
                        'Bold colors work well',
                        'Comfortable shoes for dancing',
                        'Add statement accessories'
                    ],
                    formality: 'casual',
                    weather: 'any'
                },
                {
                    occasion: 'party',
                    title: 'Elegant Party Outfit',
                    description: 'Sophisticated yet fun for upscale events',
                    items: ['shirts', 'trousers', 'dress-shoes'],
                    colorScheme: ['Black', 'Navy', 'White'],
                    styleTips: [
                        'Dark colors are slimming',
                        'Choose statement pieces',
                        'Maintain balance between bold and classy'
                    ],
                    formality: 'semi-formal',
                    weather: 'any'
                }
            ],
            wedding: [
                {
                    occasion: 'wedding',
                    title: 'Guest Wedding Look',
                    description: 'Appropriate and stylish for wedding celebrations',
                    items: ['shirts', 'trousers', 'dress-shoes', 'blazer'],
                    colorScheme: ['Navy', 'Gray', 'Beige'],
                    styleTips: [
                        'Avoid white (save for the bride)',
                        'Choose elegant accessories',
                        'Consider venue and time'
                    ],
                    formality: 'formal',
                    weather: 'any'
                },
                {
                    occasion: 'wedding',
                    title: 'Garden Party Wedding',
                    description: 'Light and elegant for outdoor celebrations',
                    items: ['shirts', 'light-trousers', 'loafers'],
                    colorScheme: ['Beige', 'Light Blue', 'White'],
                    styleTips: [
                        'Lighter colors for daytime',
                        'Comfortable yet elegant shoes',
                        'Natural fabrics work best'
                    ],
                    formality: 'semi-formal',
                    weather: 'warm'
                }
            ],
            gaming: [
                {
                    occasion: 'gaming',
                    title: 'Comfort Gaming Setup',
                    description: 'Maximum comfort for long gaming sessions',
                    items: ['hoodies', 'joggers', 'sneakers'],
                    colorScheme: ['Black', 'Gray', 'Blue'],
                    styleTips: [
                        'Comfort is priority',
                        'Breathable fabrics',
                        'Easy movement essential'
                    ],
                    formality: 'casual',
                    weather: 'any'
                },
                {
                    occasion: 'gaming',
                    title: 'Gaming Lounge Look',
                    description: 'Stylish yet comfortable for gaming cafes',
                    items: ['graphic-tshirts', 'jeans', 'sneakers'],
                    colorScheme: ['Black', 'Red', 'White'],
                    styleTips: [
                        'Show gaming personality',
                        'Comfortable for sitting',
                        'Gaming-themed accessories'
                    ],
                    formality: 'casual',
                    weather: 'any'
                }
            ],
            meeting: [
                {
                    occasion: 'meeting',
                    title: 'Executive Meeting Look',
                    description: 'Authority and professionalism',
                    items: ['shirts', 'trousers', 'formal-shoes', 'blazer'],
                    colorScheme: ['Navy', 'Black', 'White'],
                    styleTips: [
                        'Dark colors convey authority',
                        'Impeccable grooming required',
                        'Quality over quantity'
                    ],
                    formality: 'formal',
                    weather: 'any'
                },
                {
                    occasion: 'meeting',
                    title: 'Creative Meeting Attire',
                    description: 'Professional yet approachable for creative industries',
                    items: ['shirts', 'chinos', 'loafers'],
                    colorScheme: ['Gray', 'Blue', 'Brown'],
                    styleTips: [
                        'Show personality subtly',
                        'Modern cuts and fits',
                        'Balance professional with creative'
                    ],
                    formality: 'semi-formal',
                    weather: 'warm'
                }
            ],
            birthday: [
                {
                    occasion: 'birthday',
                    title: 'Celebration Party Look',
                    description: 'Fun and festive for birthday celebrations',
                    items: ['graphic-tshirts', 'jeans', 'sneakers'],
                    colorScheme: ['Black', 'Red', 'Gold'],
                    styleTips: [
                        'Celebrate with colors',
                        'Comfortable for activities',
                        'Add festive accessories'
                    ],
                    formality: 'casual',
                    weather: 'any'
                },
                {
                    occasion: 'birthday',
                    title: 'Birthday Dinner Look',
                    description: 'Smart and celebratory for dinner parties',
                    items: ['shirts', 'trousers', 'dress-shoes'],
                    colorScheme: ['Navy', 'Black', 'White'],
                    styleTips: [
                        'Elevated casual',
                        'Celebration-appropriate',
                        'Memorable but not over-the-top'
                    ],
                    formality: 'semi-formal',
                    weather: 'any'
                }
            ]
        };

        const templates = outfitTemplates[occasion as keyof typeof outfitTemplates] || outfitTemplates.casual;
        
        return templates.map((template, index) => {
            const products = template.items.map(itemType => findBestProduct(itemType, preferences));
            const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
            
            return {
                id: `outfit_${Date.now()}_${index}`,
                occasion: template.occasion,
                title: template.title,
                description: template.description,
                items: products,
                colorScheme: adaptColors(template.colorScheme, preferences.preferredColors),
                styleTips: adaptStyleTips(template.styleTips, preferences.style),
                confidence: 0.8 + Math.random() * 0.2,
                priceRange: {
                    min: Math.floor(totalPrice * 0.8),
                    max: Math.ceil(totalPrice * 1.2)
                },
                weather: template.weather as 'warm' | 'cold' | 'any',
                formality: template.formality as 'casual' | 'formal' | 'semi-formal'
            };
        });
    };

    const findBestProduct = (itemType: string, preferences: UserPreferences): Product => {
        const categoryMap: { [key: string]: string } = {
            'tshirts': 'mens-clothing',
            'shirts': 'mens-clothing',
            'polos': 'mens-clothing',
            'graphic-tshirts': 'mens-clothing',
            'hoodies': 'mens-clothing',
            'jeans': 'mens-clothing',
            'trousers': 'mens-clothing',
            'chinos': 'mens-clothing',
            'joggers': 'mens-clothing',
            'light-trousers': 'mens-clothing',
            'sneakers': 'footwear',
            'casual-shoes': 'footwear',
            'dress-shoes': 'footwear',
            'formal-shoes': 'footwear',
            'loafers': 'footwear',
            'blazer': 'mens-clothing'
        };

        const category = categoryMap[itemType] || 'mens-clothing';
        
        let filtered = expandedProductCatalog.filter(product => 
            product.category === category &&
            product.subcategory === itemType &&
            product.inStock &&
            product.price <= preferences.budget * 0.3 // Individual item shouldn't exceed 30% of budget
        );

        // Filter by preferred colors
        if (preferences.preferredColors.length > 0) {
            filtered = filtered.filter(product => 
                product.colors.some(color => 
                    preferences.preferredColors.some(prefColor => 
                        color.toLowerCase().includes(prefColor.toLowerCase())
                    )
                )
            );
        }

        // If no products match preferences, get any available
        if (filtered.length === 0) {
            filtered = expandedProductCatalog.filter(product => 
                product.category === category &&
                product.subcategory === itemType &&
                product.inStock &&
                product.price <= preferences.budget * 0.3
            );
        }

        // Sort by rating and return best match
        return filtered.length > 0 
            ? filtered.sort((a, b) => b.rating - a.rating)[0]
            : expandedProductCatalog.find(p => p.category === category && p.subcategory === itemType) || expandedProductCatalog[0];
    };

    const adaptColors = (templateColors: string[], preferredColors: string[]): string[] => {
        // Mix template colors with user preferences
        const adapted = [...templateColors];
        
        // Replace some colors with user preferences if they match well
        preferredColors.forEach(prefColor => {
            if (Math.random() > 0.5 && adapted.length < 5) {
                adapted.push(prefColor);
            }
        });
        
        return adapted.slice(0, 4);
    };

    const adaptStyleTips = (templateTips: string[], style: string): string[] => {
        const styleSpecificTips = {
            classic: [
                'Choose timeless pieces',
                'Invest in quality basics',
                'Avoid overly trendy items'
            ],
            trendy: [
                'Incorporate current trends',
                'Bold choices work well',
                'Statement pieces recommended'
            ],
            minimalist: [
                'Less is more',
                'Clean lines and simple colors',
                'Focus on fit and fabric'
            ],
            bold: [
                'Don\'t be afraid to stand out',
                'Mix patterns and textures',
                'Confidence is key'
            ]
        };

        return [...templateTips, ...styleSpecificTips[style as keyof typeof styleSpecificTips].slice(0, 2)];
    };

    const handleOccasionSelect = (occasionId: string) => {
        setSelectedOccasion(occasionId);
        generateOutfitSuggestions(occasionId);
    };

    const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
        setUserPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleColorToggle = (color: string) => {
        setUserPreferences(prev => ({
            ...prev,
            preferredColors: prev.preferredColors.includes(color)
                ? prev.preferredColors.filter(c => c !== color)
                : [...prev.preferredColors, color]
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        Smart Outfit Engine
                    </h1>
                    <p className="text-gray-600">AI-powered outfit suggestions for every occasion and style preference</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Preferences */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Preferences */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Preferences</h2>
                            
                            {/* Style */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Style Preference</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {styles.map(style => (
                                        <button
                                            key={style.id}
                                            onClick={() => handlePreferenceChange('style', style.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                userPreferences.style === style.id
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {style.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                <div className="flex gap-2">
                                    {['men', 'women', 'unisex'].map(gender => (
                                        <button
                                            key={gender}
                                            onClick={() => handlePreferenceChange('gender', gender)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                                                userPreferences.gender === gender
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget: ₹{userPreferences.budget.toLocaleString('en-IN')}
                                </label>
                                <input
                                    type="range"
                                    min="1000"
                                    max="20000"
                                    step="1000"
                                    value={userPreferences.budget}
                                    onChange={(e) => handlePreferenceChange('budget', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Preferred Colors */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Colors ({userPreferences.preferredColors.length}/5)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleColorToggle(color)}
                                            disabled={!userPreferences.preferredColors.includes(color) && userPreferences.preferredColors.length >= 5}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                userPreferences.preferredColors.includes(color)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Occasion Selection */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Occasion</h2>
                            <div className="space-y-3">
                                {occasions.map(occasion => {
                                    const Icon = occasion.icon;
                                    return (
                                        <button
                                            key={occasion.id}
                                            onClick={() => handleOccasionSelect(occasion.id)}
                                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                                selectedOccasion === occasion.id
                                                    ? 'border-purple-600 bg-purple-50'
                                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    selectedOccasion === occasion.id
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{occasion.name}</h3>
                                                    <p className="text-sm text-gray-600">{occasion.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Results */}
                    <div className="lg:col-span-2">
                        {isGenerating ? (
                            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Perfect Outfits</h3>
                                <p className="text-gray-600">Our AI is analyzing your preferences and creating personalized outfit suggestions...</p>
                            </div>
                        ) : outfitSuggestions.length > 0 ? (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                                    Your Outfit Suggestions
                                </h2>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    {outfitSuggestions.map((outfit) => (
                                        <div
                                            key={outfit.id}
                                            className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                                                selectedOutfit?.id === outfit.id ? 'ring-2 ring-purple-600' : ''
                                            }`}
                                            onClick={() => setSelectedOutfit(outfit)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">{outfit.title}</h3>
                                                    <p className="text-gray-600 text-sm">{outfit.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm text-gray-500">
                                                        {Math.round(outfit.confidence * 100)}% match
                                                    </div>
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                </div>
                                            </div>

                                            {/* Color Scheme */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Color Palette</h4>
                                                <div className="flex gap-2">
                                                    {outfit.colorScheme.map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                                                            style={{ backgroundColor: color.toLowerCase() }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Products */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Complete Look</h4>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {outfit.items.map((product) => (
                                                        <div key={product.id} className="text-center">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-full h-20 object-cover rounded-lg mb-2"
                                                            />
                                                            <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                                                            <p className="text-xs font-bold text-purple-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Style Tips */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Style Tips</h4>
                                                <div className="space-y-1">
                                                    {outfit.styleTips.slice(0, 3).map((tip, index) => (
                                                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                                            <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                                                            {tip}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Price Range */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Total:</span> ₹{outfit.items.reduce((sum, p) => sum + p.price, 0).toLocaleString('en-IN')}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600 capitalize">{outfit.formality}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose an Occasion</h3>
                                <p className="text-gray-600">Select an occasion from the left panel to get personalized outfit suggestions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartOutfitEngine;
