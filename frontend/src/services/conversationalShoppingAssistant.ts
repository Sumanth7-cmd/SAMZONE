import { productApi, fetchProductsByOccasion, type Product, type ProductFilters } from './api';
import { filterPresentationSafe } from './filters/presentationSafe';

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
}

export interface AssistantResponse {
  reply: string;
  products: Product[];
  followUps: string[];
  clarifyingQuestion?: string;
  context: AssistantContext;
}

const GREETING_RESPONSES = [
  'Hello! I can help you discover products, compare options, and narrow down the best fit for your budget and style.',
  'Hi! I can turn your shopping request into a smart shortlist of products and explain why each one is a good match.',
  'Welcome back! Tell me what you want, your budget, and any brand or color preference and I’ll refine the results for you.'
];

const CATEGORY_HINTS: Array<{ keyword: string; category: string; label: string }> = [
  // Clothing – women
  { keyword: 'dress', category: "Women's Clothing", label: 'dresses' },
  { keyword: 'kurta', category: "Women's Clothing", label: 'kurtas' },
  { keyword: 'kurti', category: "Women's Clothing", label: 'kurtis' },
  { keyword: 'saree', category: "Women's Clothing", label: 'sarees' },
  { keyword: 'blouse', category: "Women's Clothing", label: 'blouses' },
  { keyword: 'salwar', category: "Women's Clothing", label: 'salwar suits' },
  { keyword: 'lehenga', category: "Women's Clothing", label: 'lehengas' },
  { keyword: 'gown', category: "Women's Clothing", label: 'gowns' },
  { keyword: 'top', category: "Women's Clothing", label: 'tops' },
  { keyword: 'skirt', category: "Women's Clothing", label: 'skirts' },
  // Clothing – men
  { keyword: 'shirt', category: "Men's Clothing", label: 'shirts' },
  { keyword: 'shirts', category: "Men's Clothing", label: 'shirts' },
  { keyword: 'tshirt', category: "Men's Clothing", label: 'T-shirts' },
  { keyword: 't-shirt', category: "Men's Clothing", label: 'T-shirts' },
  { keyword: 'jeans', category: "Men's Clothing", label: 'jeans' },
  { keyword: 'trouser', category: "Men's Clothing", label: 'trousers' },
  { keyword: 'sherwani', category: "Men's Clothing", label: 'sherwanis' },
  { keyword: 'blazer', category: "Men's Clothing", label: 'blazers' },
  { keyword: 'suit', category: "Men's Clothing", label: 'suits' },
  { keyword: 'hoodie', category: "Men's Clothing", label: 'hoodies' },
  { keyword: 'jacket', category: "Men's Clothing", label: 'jackets' },
  // Footwear
  { keyword: 'shoe', category: "Men's Footwear", label: 'shoes' },
  { keyword: 'shoes', category: "Men's Footwear", label: 'shoes' },
  { keyword: 'sneaker', category: "Men's Footwear", label: 'sneakers' },
  { keyword: 'sneakers', category: "Men's Footwear", label: 'sneakers' },
  { keyword: 'sandal', category: "Women's Footwear", label: 'sandals' },
  { keyword: 'heels', category: "Women's Footwear", label: 'heels' },
  { keyword: 'flat', category: "Women's Footwear", label: 'flats' },
  // Accessories & fashion
  { keyword: 'watch', category: 'Accessories', label: 'watches' },
  { keyword: 'bag', category: 'Accessories', label: 'bags' },
  { keyword: 'handbag', category: 'Accessories', label: 'handbags' },
  { keyword: 'jewelry', category: 'Accessories', label: 'jewelry' },
  { keyword: 'jewellery', category: 'Accessories', label: 'jewellery' },
  { keyword: 'bracelet', category: 'Accessories', label: 'bracelets' },
  { keyword: 'necklace', category: 'Accessories', label: 'necklaces' },
  { keyword: 'earring', category: 'Accessories', label: 'earrings' },
  { keyword: 'belt', category: 'Accessories', label: 'belts' },
  { keyword: 'scarf', category: 'Accessories', label: 'scarves' },
];

const STOP_WORDS = new Set([
  'show', 'me', 'find', 'search', 'for', 'some', 'a', 'an', 'the', 'i', 'my', 'need', 'want', 'please', 'can', 'you',
  'get', 'give', 'looking', 'today', 'now', 'just', 'only', 'like', 'these', 'those', 'with', 'and', 'or', 'of', 'to'
]);

// Maps occasion keywords to real product search terms so chatbot queries land on actual catalog items
const OCCASION_SEARCH_MAP: Record<string, { searchTerms: string[]; label: string }> = {
  wedding:  { searchTerms: ['saree', 'lehenga', 'sherwani', 'wedding kurta', 'gown'], label: 'wedding wear' },
  party:    { searchTerms: ['party dress', 'dress', 'top', 'party wear'], label: 'party wear' },
  festival: { searchTerms: ['kurta', 'saree', 'salwar', 'ethnic wear'], label: 'festive wear' },
  festive:  { searchTerms: ['kurta', 'saree', 'ethnic wear', 'salwar'], label: 'festive wear' },
  ethnic:   { searchTerms: ['kurta', 'saree', 'salwar', 'sherwani'], label: 'ethnic wear' },
  formal:   { searchTerms: ['formal shirt', 'blazer', 'trouser', 'suit'], label: 'formal wear' },
  office:   { searchTerms: ['formal shirt', 'trouser', 'blazer', 'top'], label: 'office wear' },
  casual:   { searchTerms: ['jeans', 'tshirt', 'dress', 'top'], label: 'casual wear' },
  birthday: { searchTerms: ['dress', 'shirt', 'top', 'party wear'], label: 'birthday outfit' },
};

const COLOR_HINTS = ['red','blue','green','black','white','yellow','pink','purple','orange','brown','grey','gray','navy','beige','silver','gold','maroon','teal','olive','cream','rust','mustard'];
const OCCASION_HINTS = ['wedding','party','office','college','casual','festival','travel','birthday','formal','ethnic'];
const BRAND_HINTS = ['nike','adidas','puma','zara','h&m','levi','levis','gucci','mango','biba','fabindia','westside','allen solly','peter england','arrow','us polo','wrangler','only','vero moda','w brand'];

// Fashion product category fragments – used to filter out non-fashion results
const FASHION_FRAGMENTS = [
  'clothing', 'apparel', 'footwear', 'shoe', 'saree', 'kurta', 'dress',
  'ethnic', 'kurti', 'salwar', 'lehenga', 'jacket', 'jeans', 'trouser',
  'shirt', 'top', 'blouse', 'skirt', 'western', 'accessories',
  'jewellery', 'jewelry', 'bag', 'handbag', 'watch', 'belt', 'scarf',
  'lingerie', 'innerwear', 'swimwear', 'sportswear', 'sherwani', 'blazer',
  'tshirt', 't-shirt', 'hoodie', 'shorts', 'suit',
];

function isFashionItem(product: Product): boolean {
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return FASHION_FRAGMENTS.some((f) => cat.includes(f) || name.includes(f));
}

const DEFAULT_CONTEXT: AssistantContext = {
  lastKeywords: [],
  lastProducts: [],
  preferredBrands: [],
  preferredCategories: [],
  preferredColors: [],
  turnCount: 0,
};

export const createEmptyAssistantContext = (): AssistantContext => ({ ...DEFAULT_CONTEXT });

function normalizeSearchTerm(term: string): string {
  const t = term.toLowerCase().trim();
  if (t === 'dresses') return 'dress';
  if (t === 'boxes') return 'box';
  if (t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.endsWith('es') && !t.endsWith('ss')) return t.slice(0, -2);
  if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ');
}

function extractBudget(value: string): { min?: number; max?: number } | null {
  const lower = value.toLowerCase();
  const amountRegex = /(?:under|below|less than|within|upto|up to|max|budget|under|cheaper than|less than)\s*[₹rs.]*\s*([0-9,]+)|[₹rs.]*\s*([0-9,]+)\s*(?:and|to|-|or)\s*[₹rs.]*\s*([0-9,]+)/gi;
  const matches = Array.from(lower.matchAll(amountRegex));
  if (matches.length === 0) {
    return null;
  }

  const first = matches[0];
  const underValue = first[1] || null;
  const lowerValue = first[2] || null;
  const higherValue = first[3] || null;

  if (underValue) {
    return { max: parseNumber(underValue) };
  }
  if (lowerValue && higherValue) {
    return { min: parseNumber(lowerValue), max: parseNumber(higherValue) };
  }
  return null;
}

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}

function getKeywords(message: string): string[] {
  const words = message.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.filter((word) => !STOP_WORDS.has(word) && word.length > 2);
}

function guessCategory(message: string): { category?: string; label?: string } {
  const lower = message.toLowerCase();
  for (const hint of CATEGORY_HINTS) {
    const wordRegex = new RegExp(`\\b${hint.keyword}s?\\b`, 'i');
    if (wordRegex.test(lower)) {
      return { category: hint.category, label: hint.label };
    }
  }
  return {};
}

function guessBrand(message: string): string | undefined {
  const lower = message.toLowerCase();
  const match = BRAND_HINTS.find((brand) => lower.includes(brand));
  return match ? match.replace(/\\/g, '') : undefined;
}

function guessColor(message: string): string | undefined {
  const lower = message.toLowerCase();
  return COLOR_HINTS.find((color) => lower.includes(color));
}

function guessOccasion(message: string): string | undefined {
  const lower = message.toLowerCase();
  return OCCASION_HINTS.find((occasion) => lower.includes(occasion));
}

function guessGender(message: string): 'men' | 'women' | undefined {
  const lower = message.toLowerCase();
  if (lower.includes('for women') || lower.includes('women\'s') || lower.includes('for her')) return 'women';
  if (lower.includes('for men') || lower.includes('men\'s') || lower.includes('for him')) return 'men';
  return undefined;
}

function dedupeProducts(products: Product[]): Product[] {
  return Array.from(new Map(products.map((product) => [product.id, product])).values());
}

function buildReasoning(product: Product, context: AssistantContext, userQuery: string, filters: ProductFilters): string[] {
  const reasons: string[] = [];
  const lowerQuery = userQuery.toLowerCase();

  if (filters.maxPrice != null && product.price <= filters.maxPrice) {
    reasons.push('Fits your budget target.');
  }
  if (product.rating >= 4.2) {
    reasons.push('Strong customer rating.');
  }
  if ((product.discount ?? 0) > 0) {
    reasons.push('Includes a meaningful discount.');
  }
  if (context.preferredBrands.includes(product.brand)) {
    reasons.push('Matches your brand preference.');
  }
  if (context.lastCategory && product.category?.toLowerCase().includes(context.lastCategory.toLowerCase())) {
    reasons.push('Stays in the same category you were browsing.');
  }
  if (context.lastColor && product.name.toLowerCase().includes(context.lastColor)) {
    reasons.push('Aligns with your preferred color.');
  }
  if (context.lastKeywords.some((word) => product.name.toLowerCase().includes(word) || product.description.toLowerCase().includes(word))) {
    reasons.push('Matches the terms in your request.');
  }
  if (product.category && lowerQuery.includes(product.category.toLowerCase())) {
    reasons.push('Direct match for your requested category.');
  }
  if (reasons.length === 0) {
    reasons.push('Recommended for overall value and popularity.');
  }

  return reasons.slice(0, 3);
}

export async function buildShoppingAssistantReply(message: string, context: AssistantContext): Promise<AssistantResponse> {
  const normalized = normalizeMessage(message);
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return {
      reply: 'Tell me what you want to shop for and I’ll build a shortlist from the live catalog.',
      products: [],
      followUps: ['Show me bestsellers', 'Find something under ₹5000', 'Suggest a wedding outfit'],
      context: { ...context, turnCount: context.turnCount + 1 },
    };
  }

  const greetingMatch = /^(hi|hello|hey|hii|helo|thanks|thank you|bye|goodbye)(\s|!|\.|$)/i.test(lower);
  if (greetingMatch) {
    return {
      reply: GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)],
      products: [],
      followUps: ['Show me bestsellers', 'Find something under ₹5000', 'Suggest a wedding outfit'],
      context: { ...context, turnCount: context.turnCount + 1 },
    };
  }

  const budget = extractBudget(normalized);
  const guessedCategory = guessCategory(normalized);
  const guessedBrand = guessBrand(normalized);
  const guessedColor = guessColor(normalized);
  const guessedOccasion = guessOccasion(normalized);
  const guessedGender = guessGender(normalized);
  const keywords = getKeywords(normalized);

  const nextContext: AssistantContext = {
    ...context,
    lastCategory: guessedCategory.category || context.lastCategory,
    lastBrand: guessedBrand || context.lastBrand,
    lastBudgetMin: budget?.min ?? context.lastBudgetMin,
    lastBudgetMax: budget?.max ?? context.lastBudgetMax,
    lastColor: guessedColor || context.lastColor,
    lastOccasion: guessedOccasion || context.lastOccasion,
    lastGender: guessedGender || context.lastGender,
    lastKeywords: keywords.slice(0, 6),
    turnCount: context.turnCount + 1,
    preferredBrands: guessedBrand ? [...new Set([...(context.preferredBrands || []), guessedBrand])] : context.preferredBrands,
    preferredCategories: guessedCategory.category ? [...new Set([...(context.preferredCategories || []), guessedCategory.category])] : context.preferredCategories,
    preferredColors: guessedColor ? [...new Set([...(context.preferredColors || []), guessedColor])] : context.preferredColors,
  };

  const isCheaperRequest = /cheaper|budget|affordable|cheap|under/i.test(lower);
  const isCompareRequest = /compare|vs|versus|which is better/i.test(lower);
  const isClarify = /something|anything|products|items/i.test(lower) && !guessedCategory.category && !guessedBrand && !budget && keywords.length < 2;

  if (isClarify) {
    return {
      reply: 'I can help with that. What type of product are you looking for, and what budget are you working with?',
      products: [],
      followUps: ['Show me dresses under ₹2000', 'Suggest shoes for office', 'Find party wear under ₹3000'],
      clarifyingQuestion: 'Are you looking for clothing, footwear, or accessories?',
      context: nextContext,
    };
  }

  const filters: ProductFilters = {
    sortBy: isCheaperRequest ? 'price' : 'rating',
    sortDir: isCheaperRequest ? 'asc' : 'desc',
  };

  if (guessedCategory.category) {
    filters.category = guessedCategory.category;
  }
  if (guessedBrand) {
    filters.brand = guessedBrand;
  }
  if (budget?.min != null) {
    filters.minPrice = budget.min;
  }
  if (budget?.max != null) {
    filters.maxPrice = budget.max;
  }

  const searchKeywords = keywords.filter(
    (word) => !['under','below','budget','cheap','cheaper','show','find','search','for','some','me','price','less','than','max','rs','inr','rupees','outfit','wear','ideas','idea','clothes','clothing','look','looks',
                'wedding','party','office','college','casual','festival','travel','birthday','formal','ethnic','festive',
                'men','mens','man','women','womens','woman','boy','boys','girl','girls'].includes(word) && !/^\d+$/.test(word)
  );

  // Expand occasion keywords into real product search terms
  const occasionExpansion = guessedOccasion ? OCCASION_SEARCH_MAP[guessedOccasion] : null;
  const effectiveSearchTerms = occasionExpansion && searchKeywords.length === 0
    ? occasionExpansion.searchTerms
    : searchKeywords;
  const effectiveLabel = occasionExpansion && searchKeywords.length === 0
    ? occasionExpansion.label
    : null;

  const isSpecificSearch = effectiveSearchTerms.length > 0;
  const rawSearchText = effectiveSearchTerms[0] || '';

  if (isCompareRequest && context.lastProducts.length > 0) {
    const compareProducts = context.lastProducts.slice(0, 2);
    const bestValue = compareProducts[0];
    const bestPremium = compareProducts[1] ?? compareProducts[0];
    return {
      reply: `For a quick compare, ${bestValue.name} is the better value pick if you want to stay efficient, while ${bestPremium.name} is the stronger premium option if you care more about features and brand positioning.`,
      products: compareProducts,
      followUps: ['Show cheaper options', 'Show more like this', 'Only Samsung'],
      context: nextContext,
    };
  }

  let products: Product[] = [];
  let isFallbackAlternative = false;

  const targetGender = guessedGender || context.lastGender;
  const searchStr = effectiveSearchTerms.join(' ');

  // Query Supabase directly for candidate pool with strict gender & category filtering
  try {
    const { supabase } = await import('./supabaseClient');
    const { mapRawProduct, PRODUCT_SELECT } = await import('./api');

    const selectStr = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');
    let queryBuilder = supabase.from('products_new').select(selectStr);

    // Apply gender filter
    if (targetGender === 'men') {
      queryBuilder = queryBuilder.ilike('categories.path', "%Men's%").not('categories.path', 'ilike', "%Women's%");
    } else if (targetGender === 'women') {
      queryBuilder = queryBuilder.ilike('categories.path', "%Women's%");
    }

    // Exclude Kids & Infant wear unless query mentions kid/child/boy/girl
    if (!/kid|child|boy|girl|baby|infant/i.test(normalized)) {
      queryBuilder = queryBuilder
        .not('categories.path', 'ilike', "%Kids'%")
        .not('categories.path', 'ilike', "%Baby Care%")
        .not('categories.path', 'ilike', "%Infant%");
    }

    // Apply category hint if detected
    if (guessedCategory.category) {
      queryBuilder = queryBuilder.ilike('categories.path', `%${guessedCategory.category}%`);
    }

    // Apply budget ceiling if specified
    if (budget?.max != null) {
      queryBuilder = queryBuilder.lte('retail_price', budget.max);
    }

    // Search terms OR / AND match
    const validTerms = effectiveSearchTerms.filter((t) => t.length >= 3);
    if (validTerms.length > 0) {
      const searchOr = validTerms.map((t) => `name.ilike.%${normalizeSearchTerm(t)}%`).join(',');
      queryBuilder = queryBuilder.or(searchOr);
    }

    const { data: candidateRows } = await queryBuilder
      .gt('retail_price', 0)
      .order('rating', { ascending: false })
      .limit(60);

    if (candidateRows && candidateRows.length > 0) {
      products = candidateRows.map((row: any) => mapRawProduct(row)).filter(isFashionItem);
    }

    // If specific item like "black t-shirt" yielded < 2 items, fallback to broader apparel category search
    if (isSpecificSearch && products.length < 2) {
      isFallbackAlternative = true;
      let fallbackQuery = supabase.from('products_new').select(selectStr);

      if (targetGender === 'men') {
        fallbackQuery = fallbackQuery.ilike('categories.path', "%Men's%").not('categories.path', 'ilike', "%Women's%");
      } else if (targetGender === 'women') {
        fallbackQuery = fallbackQuery.ilike('categories.path', "%Women's%");
      }

      if (guessedCategory.category) {
        fallbackQuery = fallbackQuery.ilike('categories.path', `%${guessedCategory.category}%`);
      } else if (validTerms.length > 0) {
        const primaryKeyword = validTerms[validTerms.length - 1].replace(/s$/, '');
        fallbackQuery = fallbackQuery.or(`name.ilike.%${primaryKeyword}%`);
      }

      const { data: fallbackRows } = await fallbackQuery
        .gt('retail_price', 0)
        .order('rating', { ascending: false })
        .limit(40);

      if (fallbackRows && fallbackRows.length > 0) {
        const fallbackMapped = fallbackRows.map((row: any) => mapRawProduct(row)).filter(isFashionItem);
        products = dedupeProducts([...products, ...fallbackMapped]);
      }
    }
  } catch (err) {
    console.warn('Chatbot Supabase query error:', err);
    // Fallback to standard productApi
    const response = await productApi.getProducts(0, 40, { ...filters, search: rawSearchText || undefined });
    products = dedupeProducts(response.content).filter(isFashionItem);
  }

  // Deduplicate near-duplicate product titles
  const seenPatterns = new Set<string>();
  const deduppedProducts: Product[] = [];
  for (const p of products) {
    const pattern = p.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').slice(0, 20).trim();
    if (!seenPatterns.has(pattern)) {
      seenPatterns.add(pattern);
      deduppedProducts.push(p);
    }
  }
  products = filterPresentationSafe(deduppedProducts);

  // Rotate/shuffle candidates based on turn count & query hash for variety across requests
  const offset = (context.turnCount * 3) % Math.max(1, products.length - 4);
  const rotatedProducts = products.length > 4 ? [...products.slice(offset), ...products.slice(0, offset)] : products;
  const curated = rotatedProducts.slice(0, 4);

  const topPick = curated[0];
  const displayLabel = effectiveLabel || searchStr || guessedCategory.label || 'requested item';

  let topReason: string;
  if (isFallbackAlternative) {
    topReason = `We don't have an exact "${searchStr}" in stock right now, but here are the closest matching ${targetGender === 'men' ? "men's" : targetGender === 'women' ? "women's" : ''} alternatives from our catalog:`;
  } else if (topPick) {
    topReason = `I picked ${topPick.name} as the strongest match for your requested ${displayLabel}.`;
  } else {
    topReason = `I could not find matching ${displayLabel}${budget?.max ? ` under ₹${budget.max.toLocaleString('en-IN')}` : ''} in our catalog right now.`;
  }

  const reply = buildReply(normalized, curated, nextContext, { category: guessedCategory.category, label: effectiveLabel || guessedCategory.label }, budget, topReason);
  const followUps = buildFollowUps(nextContext, effectiveLabel || guessedCategory.label, guessedBrand, budget);

  return {
    reply,
    products: curated,
    followUps,
    clarifyingQuestion: curated.length === 0 ? 'Would you like me to broaden the search or focus on a different category?' : undefined,
    context: { ...nextContext, lastProducts: curated },
  };
}

function buildReply(
  originalMessage: string,
  products: Product[],
  context: AssistantContext,
  guessedCategory: { category?: string; label?: string },
  budget: { min?: number; max?: number } | null,
  topReason: string
): string {
  if (products.length === 0) {
    if (budget?.max != null) {
      return `I could not find products under ₹${budget.max.toLocaleString('en-IN')} matching your search criteria. Try raising the budget limit or searching for a different category.`;
    }
    return 'I could not find a strong match in the live catalog right now. I can widen the search to nearby alternatives or focus on a specific brand and price range.';
  }

  const parts = [topReason];
  if (budget?.max != null) {
    parts.push(`I kept all recommendations strictly within your ₹${budget.max.toLocaleString('en-IN')} budget limit.`);
  }
  if (guessedCategory.label) {
    parts.push(`I focused on ${guessedCategory.label} first.`);
  }
  if (context.preferredBrands.length > 0) {
    parts.push(`Your brand preference for ${context.preferredBrands.join(', ')} is reflected in the shortlist.`);
  }
  if (context.lastOccasion) {
    parts.push(`I also considered the ${context.lastOccasion} context in the recommendations.`);
  }
  const detailed = parts.join(' ');
  const userIntent = originalMessage.toLowerCase();
  if (userIntent.includes('compare')) {
    return `I’ve prepared a short list that makes it easier to compare options. ${detailed}`;
  }
  if (userIntent.includes('cheap') || userIntent.includes('budget') || userIntent.includes('affordable')) {
    return `I’ve prioritized value and price fit. ${detailed}`;
  }
  return `I’ve curated a shortlist from the live catalog. ${detailed}`;
}

function buildFollowUps(context: AssistantContext, categoryLabel: string | undefined, brand: string | undefined, budget: { min?: number; max?: number } | null): string[] {
  const suggestions = ['Show more like these', 'Show cheaper options'];
  if (categoryLabel) {
    suggestions.push(`Show more ${categoryLabel}`);
  }
  if (brand) {
    suggestions.push(`Only ${brand}`);
  }
  if (budget?.max != null) {
    suggestions.push(`Under ₹${Math.round(budget.max / 2).toLocaleString('en-IN')}`);
  }
  return suggestions.slice(0, 4);
}

export function explainProduct(product: Product, context: AssistantContext, userQuery: string, filters: ProductFilters): string[] {
  return buildReasoning(product, context, userQuery, filters);
}
