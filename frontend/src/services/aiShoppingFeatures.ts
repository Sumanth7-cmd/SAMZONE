import type { Product } from './api';

export interface PreferenceProfile {
    preferredBrands: string[];
    preferredCategories: string[];
    preferredColors: string[];
    budgetBand: 'budget' | 'mid' | 'premium';
}

export interface ImageAnalysis {
    dominantColor: string;
    category: string;
    style: string;
    confidence: number;
    keywords: string[];
}

export interface RankedProduct {
    product: Product;
    score: number;
    reasons: string[];
}

const STORAGE_KEY = 'samzone-ai-preferences';

const COLOR_KEYWORDS: Record<string, string[]> = {
    black: ['black', 'midnight', 'ebony', 'charcoal', 'smoke'],
    white: ['white', 'cream', 'ivory', 'off white', 'snow'],
    blue: ['blue', 'navy', 'teal', 'azure', 'indigo'],
    green: ['green', 'olive', 'emerald', 'mint'],
    red: ['red', 'coral', 'maroon', 'burgundy', 'rose', 'pink'],
    brown: ['brown', 'camel', 'tan', 'beige', 'coffee', 'chocolate'],
    gray: ['gray', 'grey', 'silver', 'ash'],
    yellow: ['yellow', 'mustard', 'gold', 'ochre'],
    purple: ['purple', 'lavender', 'plum', 'violet'],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
    streetwear: ['street', 'urban', 'oversized', 'hoodie', 'graphic', 'distressed', 'jacket'],
    formal: ['formal', 'blazer', 'suit', 'dress shirt', 'oxford', 'trouser', 'tie'],
    sport: ['sport', 'athletic', 'training', 'performance', 'running', 'gym', 'active'],
    casual: ['casual', 'comfort', 'relaxed', 'everyday', 'weekend', 'denim'],
    'business casual': ['business', 'office', 'professional', 'work', 'corporate'],
    minimalist: ['minimal', 'simple', 'clean', 'basic', 'essential', 'plain'],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    shirt: ['shirt', 'top', 'tee', 'tshirt', 'button-down', 'polo'],
    hoodie: ['hoodie', 'sweatshirt', 'jacket', 'sweater'],
    pants: ['pant', 'trouser', 'jeans', 'chinos', 'jogger', 'cargo'],
    shoes: ['shoe', 'sneaker', 'loafer', 'boot', 'trainer', 'slipper'],
    accessories: ['bag', 'belt', 'watch', 'cap', 'socks', 'glasses'],
};

function normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function inferProductAttributes(product: Product): { colors: string[]; style: string; category: string; tags: string[] } {
    const text = normalizeText([product.name, product.description, product.category, product.specifications, ...(product.tags || [])].join(' '));
    const colors = Array.from(new Set([...(product.colors || []), ...extractColors(text)]));
    const style = inferStyle(text);
    const category = inferCategory(text, product.category);
    return { colors, style, category, tags: Array.from(new Set([...(product.tags || []), ...extractTags(text)])) };
}

function extractColors(text: string): string[] {
    const matches: string[] = [];
    Object.entries(COLOR_KEYWORDS).forEach(([color, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
            matches.push(color);
        }
    });
    return matches;
}

function inferStyle(text: string): string {
    for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return style;
        }
    }
    return 'casual';
}

function inferCategory(text: string, fallback: string): string {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return category;
        }
    }
    return fallback || 'general';
}

function extractTags(text: string): string[] {
    return text.split(' ').filter(Boolean).slice(0, 8);
}

function getStoredProfile(): PreferenceProfile {
    if (typeof window === 'undefined') {
        return { preferredBrands: [], preferredCategories: [], preferredColors: [], budgetBand: 'mid' };
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { preferredBrands: [], preferredCategories: [], preferredColors: [], budgetBand: 'mid' };
        }
        const parsed = JSON.parse(raw) as Partial<PreferenceProfile>;
        return {
            preferredBrands: parsed.preferredBrands || [],
            preferredCategories: parsed.preferredCategories || [],
            preferredColors: parsed.preferredColors || [],
            budgetBand: parsed.budgetBand || 'mid',
        };
    } catch {
        return { preferredBrands: [], preferredCategories: [], preferredColors: [], budgetBand: 'mid' };
    }
}

function saveProfile(profile: PreferenceProfile): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function getPreferenceProfile(): PreferenceProfile {
    return getStoredProfile();
}

export function trackProductInteraction(product: Product, action: 'view' | 'add' | 'favorite'): PreferenceProfile {
    const profile = getStoredProfile();
    const next = { ...profile };

    if (product.brand) {
        next.preferredBrands = Array.from(new Set([product.brand, ...next.preferredBrands])).slice(0, 6);
    }

    if (product.category) {
        next.preferredCategories = Array.from(new Set([product.category, ...next.preferredCategories])).slice(0, 6);
    }

    if (product.colors?.length) {
        next.preferredColors = Array.from(new Set([...(product.colors || []), ...next.preferredColors])).slice(0, 6);
    }

    if (action === 'add' && product.price > 10000) {
        next.budgetBand = 'premium';
    } else if (action === 'view' && product.price < 4000) {
        next.budgetBand = 'budget';
    }

    saveProfile(next);
    return next;
}

export function analyzeImageFeatures(imageDataUrl: string): Promise<ImageAnalysis> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');

            if (!context) {
                resolve({ dominantColor: 'neutral', category: 'general', style: 'casual', confidence: 0.4, keywords: [] });
                return;
            }

            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCounts: Record<string, number> = {};
            let total = 0;

            for (let index = 0; index < data.length; index += 4) {
                const alpha = data[index + 3];
                if (alpha < 50) continue;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const quantized = `${Math.round(r / 64) * 64},${Math.round(g / 64) * 64},${Math.round(b / 64) * 64}`;
                colorCounts[quantized] = (colorCounts[quantized] || 0) + 1;
                total += 1;
            }

            const dominant = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '128,128,128';
            const [r, g, b] = dominant.split(',').map(Number);
            const brightness = (r + g + b) / 3;
            let dominantColor = 'neutral';
            if (brightness < 90) dominantColor = 'black';
            else if (brightness > 220) dominantColor = 'white';
            else if (r > g && r > b) dominantColor = 'red';
            else if (g > r && g > b) dominantColor = 'green';
            else if (b > r && b > g) dominantColor = 'blue';
            else dominantColor = 'neutral';

            const aspectRatio = canvas.width / canvas.height;
            let category = 'general';
            if (aspectRatio > 1.15) category = 'shoes';
            else if (aspectRatio < 0.7) category = 'pants';
            else if (aspectRatio >= 0.8 && aspectRatio <= 1.15) category = 'shirt';
            else category = 'hoodie';

            const style = brightness < 140 ? 'minimalist' : 'casual';
            resolve({
                dominantColor,
                category,
                style,
                confidence: total > 0 ? Math.min(0.95, 0.5 + total / 50000) : 0.45,
                keywords: [dominantColor, category, style],
            });
        };
        image.onerror = () => resolve({ dominantColor: 'neutral', category: 'general', style: 'casual', confidence: 0.4, keywords: [] });
        image.src = imageDataUrl;
    });
}

export function rankProductsForVisualContext(products: Product[], analysis: ImageAnalysis, profile: PreferenceProfile = getPreferenceProfile()): RankedProduct[] {
    const preferredColors = profile.preferredColors.map(color => color.toLowerCase());
    const preferredCategories = profile.preferredCategories.map(category => category.toLowerCase());
    const preferredBrands = profile.preferredBrands.map(brand => brand.toLowerCase());

    return products
        .map((product) => {
            const inferred = inferProductAttributes(product);
            const text = normalizeText([product.name, product.description, product.category, ...(inferred.colors || []), inferred.style].join(' '));
            let score = 0;
            const reasons: string[] = [];

            if (analysis.category && inferred.category && analysis.category.toLowerCase() === inferred.category.toLowerCase()) {
                score += 3.5;
                reasons.push('matches the detected clothing category');
            }

            if (analysis.dominantColor && inferred.colors.some(color => color.toLowerCase() === analysis.dominantColor.toLowerCase())) {
                score += 3;
                reasons.push('matches the dominant color family');
            }

            if (analysis.style && inferred.style && analysis.style.toLowerCase() === inferred.style.toLowerCase()) {
                score += 2.5;
                reasons.push('matches the detected style');
            }

            if (preferredBrands.some(brand => product.brand.toLowerCase().includes(brand))) {
                score += 2;
                reasons.push('fits your preferred brands');
            }

            if (preferredCategories.some(category => text.includes(category))) {
                score += 1.5;
                reasons.push('matches your preferred categories');
            }

            if (preferredColors.some(color => inferred.colors.some(productColor => productColor.toLowerCase().includes(color)))) {
                score += 1.5;
                reasons.push('aligns with your favorite colors');
            }

            if (product.rating > 4) {
                score += 1;
                reasons.push('strong customer rating');
            }

            if (product.discount && product.discount > 10) {
                score += 0.5;
                reasons.push('appealing deal');
            }

            if (product.price > 0) {
                const priceBand = product.price > 15000 ? 'premium' : product.price > 6000 ? 'mid' : 'budget';
                if (profile.budgetBand === priceBand) {
                    score += 0.75;
                    reasons.push('fits your budget profile');
                }
            }

            return { product, score, reasons };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
}
