import type { Product, ProductFilters } from './api';
import {
  DEFAULT_CONTEXT,
  runRecommendationPipeline,
  scoreCandidate,
  type RecommendationContext,
  type Gender,
} from './recommendationEngine';

export interface AssistantContext {
  lastCategory?: string;
  lastBrand?: string;
  lastBudgetMin?: number;
  lastBudgetMax?: number;
  lastColor?: string;
  lastOccasion?: string;
  lastGender?: 'men' | 'women';
  lastKeywords: string[];
  lastProducts: Product[];
  preferredBrands: string[];
  preferredCategories: string[];
  preferredColors: string[];
  turnCount: number;
  /** Engine context serialized for multi-turn state */
  engineContext?: RecommendationContext;
}

export interface AssistantResponse {
  reply: string;
  products: Product[];
  followUps: string[];
  clarifyingQuestion?: string;
  context: AssistantContext;
  heading: string;
}

const GREETING_RESPONSES = [
  'Hello! I can help you discover products, compare options, and narrow down the best fit for your budget and style.',
  'Hi! I can turn your shopping request into a smart shortlist of products and explain why each one is a good match.',
  'Welcome back! Tell me what you want, your budget, and any brand or color preference and I’ll refine the results for you.',
];

export const createEmptyAssistantContext = (): AssistantContext => ({
  lastKeywords: [],
  lastProducts: [],
  preferredBrands: [],
  preferredCategories: [],
  preferredColors: [],
  turnCount: 0,
  engineContext: { ...DEFAULT_CONTEXT },
});

function toEngineContext(ctx: AssistantContext): RecommendationContext {
  const engine = ctx.engineContext ?? { ...DEFAULT_CONTEXT };
  return {
    ...engine,
    turnCount: ctx.turnCount,
    budgetMin: ctx.lastBudgetMin ?? engine.budgetMin,
    budgetMax: ctx.lastBudgetMax ?? engine.budgetMax,
    color: ctx.lastColor ?? engine.color,
    occasion: (ctx.lastOccasion as RecommendationContext['occasion']) ?? engine.occasion,
    gender: ctx.lastGender ?? engine.gender,
    genderConfidence: engine.genderConfidence ?? (ctx.lastGender ? 'explicit' : 'none'),
    recentlyShownIds: engine.recentlyShownIds?.length
      ? engine.recentlyShownIds
      : ctx.lastProducts.map((p) => p.id),
    keywords: ctx.lastKeywords.length ? ctx.lastKeywords : engine.keywords,
    brand: ctx.lastBrand ?? engine.brand,
    category: ctx.lastCategory ?? engine.category,
  };
}

function toAssistantContext(engine: RecommendationContext, products: Product[], prior: AssistantContext): AssistantContext {
  return {
    lastCategory: engine.category ?? prior.lastCategory,
    lastBrand: engine.brand ?? prior.lastBrand,
    lastBudgetMin: engine.budgetMin,
    lastBudgetMax: engine.budgetMax,
    lastColor: engine.color,
    lastOccasion: engine.occasion,
    lastGender: engine.gender,
    lastKeywords: engine.keywords,
    lastProducts: products,
    preferredBrands: engine.brand
      ? [...new Set([...(prior.preferredBrands || []), engine.brand])]
      : prior.preferredBrands,
    preferredCategories: engine.category
      ? [...new Set([...(prior.preferredCategories || []), engine.category])]
      : prior.preferredCategories,
    preferredColors: engine.color
      ? [...new Set([...(prior.preferredColors || []), engine.color])]
      : prior.preferredColors,
    turnCount: engine.turnCount,
    engineContext: engine,
  };
}

function buildFollowUps(context: AssistantContext, budgetMax?: number): string[] {
  const suggestions = ['Show more like these', 'Show cheaper options'];
  if (context.lastOccasion) suggestions.push(`More ${context.lastOccasion} options`);
  if (context.lastColor) suggestions.push(`Different color than ${context.lastColor}`);
  if (budgetMax != null) {
    suggestions.push(`Under ₹${Math.round(budgetMax / 2).toLocaleString('en-IN')}`);
  }
  return suggestions.slice(0, 4);
}

export async function buildShoppingAssistantReply(message: string, context: AssistantContext): Promise<AssistantResponse> {
  const normalized = message.trim().replace(/\s+/g, ' ');
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return {
      reply: 'Tell me what you want to shop for and I’ll build a shortlist from the live catalog.',
      products: [],
      followUps: ['Show me bestsellers', 'Find something under ₹5000', 'Suggest a wedding outfit'],
      context: { ...context, turnCount: context.turnCount + 1 },
      heading: 'Recommended Products',
    };
  }

  const greetingMatch = /^(hi|hello|hey|hii|helo|thanks|thank you|bye|goodbye)(\s|!|\.|$)/i.test(lower);
  if (greetingMatch) {
    return {
      reply: GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)],
      products: [],
      followUps: ['Show me bestsellers', 'Find something under ₹5000', 'Suggest a wedding outfit'],
      context: { ...context, turnCount: context.turnCount + 1 },
      heading: 'Recommended Products',
    };
  }

  const isCompareRequest = /compare|vs|versus|which is better/i.test(lower);
  if (isCompareRequest && context.lastProducts.length > 0) {
    const compareProducts = context.lastProducts.slice(0, 2);
    const bestValue = compareProducts[0];
    const bestPremium = compareProducts[1] ?? compareProducts[0];
    const engineCtx = toEngineContext(context);
    return {
      reply: `For a quick compare, ${bestValue.name} is the better value pick, while ${bestPremium.name} is the stronger premium option.`,
      products: compareProducts,
      followUps: ['Show cheaper options', 'Show more like this'],
      context: toAssistantContext({ ...engineCtx, turnCount: engineCtx.turnCount + 1 }, compareProducts, context),
      heading: 'Compare These Picks',
    };
  }

  const enginePrior = toEngineContext(context);
  const result = await runRecommendationPipeline(normalized, enginePrior);
  const nextContext = toAssistantContext(result.context, result.products, context);

  return {
    reply: result.explanation,
    products: result.products,
    followUps: buildFollowUps(nextContext, result.context.budgetMax),
    clarifyingQuestion: result.clarifyingQuestion,
    context: nextContext,
    heading: result.heading,
  };
}

export function explainProduct(product: Product, context: AssistantContext, userQuery: string, filters: ProductFilters): string[] {
  const engineCtx = toEngineContext(context);
  if (filters.maxPrice != null) engineCtx.budgetMax = filters.maxPrice;
  if (filters.minPrice != null) engineCtx.budgetMin = filters.minPrice;
  if (filters.brand) engineCtx.brand = filters.brand;
  if (filters.category) engineCtx.category = filters.category;
  void userQuery;
  return scoreCandidate(product, engineCtx).reasons;
}

/** @internal test helper */
export function mapGenderForTest(gender: Gender): 'men' | 'women' {
  return gender;
}
