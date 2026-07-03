import { productApi, type Product } from './api';

export interface ViewedProduct {
    id: number;
    category: string;
    brand: string;
}

const VIEWED_KEY = 'samzone_viewed';
const MAX_VIEWED = 20;

export function getViewedHistory(): ViewedProduct[] {
    try {
        const raw = localStorage.getItem(VIEWED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function recordViewedProduct(product: Pick<Product, 'id' | 'category' | 'brand'>) {
    const history = getViewedHistory().filter((p) => p.id !== product.id);
    history.unshift({ id: product.id, category: product.category, brand: product.brand });
    localStorage.setItem(VIEWED_KEY, JSON.stringify(history.slice(0, MAX_VIEWED)));
}

function mostFrequent(values: string[]): string | undefined {
    if (values.length === 0) return undefined;
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export async function getRecommendations(limit: number = 8): Promise<Product[]> {
    const history = getViewedHistory();
    const viewedIds = new Set(history.map((p) => p.id));

    if (history.length === 0) {
        const topRated = await productApi.getProducts(0, limit, { sortBy: 'rating', sortDir: 'desc' });
        return topRated.content;
    }

    const topCategory = mostFrequent(history.map((p) => p.category));
    const topBrand = mostFrequent(history.map((p) => p.brand));

    const result = await productApi.getProducts(0, limit + viewedIds.size, {
        category: topCategory,
        brand: topBrand,
        sortBy: 'rating',
        sortDir: 'desc',
    });

    let recommendations = result.content.filter((p) => !viewedIds.has(p.id));

    if (recommendations.length < limit && topBrand) {
        // Brand filter may be too narrow; retry with just the category.
        const byCategory = await productApi.getProducts(0, limit + viewedIds.size, {
            category: topCategory,
            sortBy: 'rating',
            sortDir: 'desc',
        });
        const merged = new Map(recommendations.map((p) => [p.id, p]));
        for (const p of byCategory.content) {
            if (!viewedIds.has(p.id)) merged.set(p.id, p);
        }
        recommendations = [...merged.values()];
    }

    if (recommendations.length === 0) {
        const topRated = await productApi.getProducts(0, limit, { sortBy: 'rating', sortDir: 'desc' });
        recommendations = topRated.content.filter((p) => !viewedIds.has(p.id));
    }

    return recommendations.slice(0, limit);
}
