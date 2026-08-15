import { productApi, type Product } from './api';
import { filterPresentationSafe } from './filters/presentationSafe';
import {
  DEFAULT_CONTEXT,
  applyHardFilters,
  retrieveCandidates,
  scoreCandidates,
  selectDiverseProducts,
  type RecommendationContext,
} from './recommendationEngine';

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

function buildContextFromHistory(history: ViewedProduct[]): RecommendationContext {
    const viewedIds = history.map((p) => p.id);
    return {
        ...DEFAULT_CONTEXT,
        category: mostFrequent(history.map((p) => p.category)),
        brand: mostFrequent(history.map((p) => p.brand)),
        excludedProductIds: viewedIds,
        recentlyShownIds: viewedIds,
    };
}

export async function getRecommendations(limit: number = 8, customContext?: RecommendationContext): Promise<Product[]> {
    const history = getViewedHistory();
    const context = customContext ?? (history.length > 0 ? buildContextFromHistory(history) : DEFAULT_CONTEXT);

    const retrieval = await retrieveCandidates(context);
    let candidatePool = retrieval.products;

    if (candidatePool.length === 0) {
        const fallback = await productApi.getProducts(0, 40, {
            category: context.category,
            brand: context.brand,
            sortBy: 'rating',
            sortDir: 'desc',
        });
        const presentationSafe = filterPresentationSafe(fallback.content);
        candidatePool = applyHardFilters(presentationSafe, context).filter(
            (p) => !context.excludedProductIds.includes(p.id),
        );
    }

    if (candidatePool.length === 0) {
        const bestsellers = await productApi.getBestsellers();
        const safeBestsellers = filterPresentationSafe(bestsellers);
        candidatePool = applyHardFilters(safeBestsellers, context);
    }

    const scored = scoreCandidates(candidatePool, context);
    return selectDiverseProducts(scored, limit, {
        excludeIds: context.excludedProductIds,
    });
}
