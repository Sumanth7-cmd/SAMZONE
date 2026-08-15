import type { Product } from './api';
import { filterPresentationSafe } from './filters/presentationSafe';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Gender = 'men' | 'women';

export type GenderConfidence = 'explicit' | 'quiz' | 'image_high' | 'image_low' | 'inferred' | 'none';

export type OccasionId =
  | 'college'
  | 'casual'
  | 'formal'
  | 'office'
  | 'wedding'
  | 'function'
  | 'party'
  | 'date'
  | 'festival'
  | 'travel'
  | 'interview'
  | 'traditional'
  | 'gym';

export interface RecommendationContext {
  gender?: Gender;
  genderConfidence: GenderConfidence;
  budgetMin?: number;
  budgetMax?: number;
  budgetWidened: boolean;
  budgetWidenedTo?: number;
  color?: string;
  brand?: string;
  occasion?: OccasionId;
  category?: string;
  categoryLabel?: string;
  keywords: string[];
  excludedProductIds: number[];
  recentlyShownIds: number[];
  turnCount: number;
  cheaperRequested: boolean;
}

export interface ScoredProduct {
  product: Product;
  score: number;
  reasons: string[];
}

export interface RecommendationResult {
  products: Product[];
  context: RecommendationContext;
  heading: string;
  explanation: string;
  budgetWidened: boolean;
  budgetWidenedTo?: number;
  clarifyingQuestion?: string;
}

export interface RawPriceFields {
  retail_price?: number | string | null;
  discounted_price?: number | string | null;
}

// ---------------------------------------------------------------------------
// Defaults & taxonomy
// ---------------------------------------------------------------------------

export const DEFAULT_CONTEXT: RecommendationContext = {
  keywords: [],
  excludedProductIds: [],
  recentlyShownIds: [],
  turnCount: 0,
  genderConfidence: 'none',
  budgetWidened: false,
  cheaperRequested: false,
};

/** Budget widening multipliers applied in order when the pool is too small. */
export const BUDGET_WIDEN_MULTIPLIERS = [1, 1.25, 1.5, 2] as const;

export const MIN_CANDIDATE_POOL = 12;
export const DEFAULT_RESULT_LIMIT = 4;
export const CANDIDATE_FETCH_LIMIT = 120;

export const COLOR_HINTS = [
  'red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange',
  'brown', 'grey', 'gray', 'navy', 'beige', 'silver', 'gold', 'maroon', 'teal',
  'olive', 'cream', 'rust', 'mustard',
];

export const OCCASION_TAXONOMY: Record<
  OccasionId,
  {
    aliases: string[];
    label: string;
    categoryPaths: { men: string[]; women: string[] };
    searchTerms: { men: string[]; women: string[] };
  }
> = {
  wedding: {
    aliases: ['wedding', 'marriage', 'reception', 'shaadi'],
    label: 'wedding',
    categoryPaths: {
      men: ["Men's Clothing >> Ethnic Wear", "Men's Clothing >> Suits & Blazers", "Men's Clothing >> Shirts"],
      women: ["Women's Clothing >> Ethnic Wear", 'Saree', 'Lehenga', 'Gown'],
    },
    searchTerms: {
      men: ['sherwani', 'kurta', 'suit', 'blazer', 'ethnic'],
      women: ['saree', 'lehenga', 'gown', 'wedding'],
    },
  },
  party: {
    aliases: ['party', 'nightout', 'clubbing', 'celebration'],
    label: 'party',
    categoryPaths: {
      men: ["Men's Clothing >> Shirts", "Men's Clothing >> Trousers"],
      women: ["Women's Clothing >> Western Wear >> Dresses", "Women's Clothing >> Party Wear"],
    },
    searchTerms: {
      men: ['shirt', 'party', 'blazer', 'trouser'],
      women: ['party dress', 'dress', 'party wear', 'top'],
    },
  },
  festival: {
    aliases: ['festival', 'festive', 'diwali', 'navratri', 'eid'],
    label: 'festival',
    categoryPaths: {
      men: ["Men's Clothing >> Ethnic Wear", 'Kurta', 'Sherwani'],
      women: ["Women's Clothing >> Ethnic Wear", 'Saree', 'Salwar', 'Kurta'],
    },
    searchTerms: {
      men: ['kurta', 'sherwani', 'ethnic'],
      women: ['kurta', 'saree', 'salwar', 'ethnic'],
    },
  },
  formal: {
    aliases: ['formal', 'black tie', 'ceremony'],
    label: 'formal',
    categoryPaths: {
      men: ["Men's Clothing >> Formal", "Men's Clothing >> Suits & Blazers", "Men's Clothing >> Shirts"],
      women: ["Women's Clothing >> Western Wear >> Dresses", "Women's Clothing >> Formal"],
    },
    searchTerms: {
      men: ['formal shirt', 'blazer', 'trouser', 'suit'],
      women: ['formal', 'blazer', 'dress', 'gown'],
    },
  },
  office: {
    aliases: ['office', 'work', 'corporate', 'professional', 'business'],
    label: 'office',
    categoryPaths: {
      men: ["Men's Clothing >> Formal", "Men's Clothing >> Shirts", "Men's Clothing >> Trousers"],
      women: ["Women's Clothing >> Western Wear >> Shirts", "Women's Clothing >> Trousers"],
    },
    searchTerms: {
      men: ['formal shirt', 'trouser', 'blazer', 'office'],
      women: ['formal shirt', 'trouser', 'blazer', 'office'],
    },
  },
  college: {
    aliases: ['college', 'campus', 'university', 'student'],
    label: 'college',
    categoryPaths: {
      men: ["Men's Clothing >> T-Shirts", "Men's Clothing >> Jeans"],
      women: ["Women's Clothing >> Western Wear", "Women's Clothing >> T-Shirts"],
    },
    searchTerms: {
      men: ['jeans', 'tshirt', 'hoodie', 'shirt'],
      women: ['jeans', 'top', 'tshirt', 'dress'],
    },
  },
  casual: {
    aliases: ['casual', 'everyday', 'weekend', 'relaxed'],
    label: 'casual',
    categoryPaths: {
      men: ["Men's Clothing >> T-Shirts", "Men's Clothing >> Jeans", "Men's Clothing >> Shirts"],
      women: ["Women's Clothing >> Western Wear >> Tops", "Women's Clothing >> Jeans"],
    },
    searchTerms: {
      men: ['jeans', 'tshirt', 'shirt', 'casual'],
      women: ['jeans', 'tshirt', 'dress', 'top'],
    },
  },
  function: {
    aliases: ['function', 'event', 'gathering', 'ceremony'],
    label: 'function',
    categoryPaths: {
      men: ["Men's Clothing >> Ethnic Wear", "Men's Clothing >> Shirts"],
      women: ["Women's Clothing >> Ethnic Wear", "Women's Clothing >> Western Wear >> Dresses"],
    },
    searchTerms: {
      men: ['kurta', 'sherwani', 'shirt', 'ethnic'],
      women: ['kurta', 'saree', 'dress', 'ethnic'],
    },
  },
  date: {
    aliases: ['date', 'dinner date', 'romantic'],
    label: 'date',
    categoryPaths: {
      men: ["Men's Clothing >> Shirts", "Men's Clothing >> Trousers"],
      women: ["Women's Clothing >> Western Wear >> Dresses", "Women's Clothing >> Tops"],
    },
    searchTerms: {
      men: ['shirt', 'blazer', 'trouser'],
      women: ['dress', 'top', 'blazer'],
    },
  },
  travel: {
    aliases: ['travel', 'trip', 'vacation', 'holiday'],
    label: 'travel',
    categoryPaths: {
      men: ["Men's Clothing >> Jeans", "Men's Clothing >> T-Shirts", "Men's Clothing >> Jackets"],
      women: ["Women's Clothing >> Western Wear", "Women's Clothing >> Jackets"],
    },
    searchTerms: {
      men: ['jeans', 'jacket', 'tshirt', 'cargo'],
      women: ['jeans', 'jacket', 'top', 'dress'],
    },
  },
  interview: {
    aliases: ['interview', 'job interview'],
    label: 'interview',
    categoryPaths: {
      men: ["Men's Clothing >> Formal", "Men's Clothing >> Shirts", "Men's Clothing >> Trousers"],
      women: ["Women's Clothing >> Western Wear >> Shirts", "Women's Clothing >> Formal"],
    },
    searchTerms: {
      men: ['formal shirt', 'blazer', 'trouser', 'suit'],
      women: ['formal shirt', 'blazer', 'trouser', 'suit'],
    },
  },
  traditional: {
    aliases: ['traditional', 'ethnic', 'indian wear', 'desi'],
    label: 'traditional',
    categoryPaths: {
      men: ["Men's Clothing >> Ethnic Wear", 'Kurta', 'Sherwani'],
      women: ["Women's Clothing >> Ethnic Wear", 'Saree', 'Salwar', 'Lehenga'],
    },
    searchTerms: {
      men: ['kurta', 'sherwani', 'ethnic'],
      women: ['kurta', 'saree', 'salwar', 'lehenga'],
    },
  },
  gym: {
    aliases: ['gym', 'sports', 'workout', 'fitness', 'athletic', 'training'],
    label: 'gym/sports',
    categoryPaths: {
      men: ["Men's Clothing >> Sports Wear", "Men's Clothing >> Track Pants"],
      women: ["Women's Clothing >> Sports Wear", "Women's Clothing >> Track Pants"],
    },
    searchTerms: {
      men: ['track pant', 'sports', 'gym', 'activewear'],
      women: ['track pant', 'sports', 'gym', 'activewear'],
    },
  },
};

const CATEGORY_HINTS: Array<{ keyword: string; category: string; label: string }> = [
  { keyword: 'dress', category: 'Dresses', label: 'dresses' },
  { keyword: 'kurta', category: 'Kurtas', label: 'kurtas' },
  { keyword: 'saree', category: 'Sarees', label: 'sarees' },
  { keyword: 'shirt', category: 'Shirts', label: 'shirts' },
  { keyword: 'jeans', category: 'Jeans', label: 'jeans' },
  { keyword: 'sneaker', category: 'Footwear', label: 'sneakers' },
  { keyword: 'shoe', category: 'Footwear', label: 'shoes' },
];

const STOP_WORDS = new Set([
  'show', 'me', 'find', 'search', 'for', 'some', 'a', 'an', 'the', 'i', 'my', 'need', 'want',
  'please', 'can', 'you', 'get', 'give', 'looking', 'today', 'now', 'just', 'only', 'like',
  'these', 'those', 'with', 'and', 'or', 'of', 'to', 'something', 'anything', 'options',
]);

const FASHION_FRAGMENTS = [
  'clothing', 'apparel', 'footwear', 'shoe', 'saree', 'kurta', 'dress', 'ethnic', 'kurti',
  'salwar', 'lehenga', 'jacket', 'jeans', 'trouser', 'shirt', 'top', 'blouse', 'skirt',
  'western', 'accessories', 'jewellery', 'jewelry', 'bag', 'watch', 'sherwani', 'blazer',
  'tshirt', 't-shirt', 'hoodie', 'shorts', 'suit', 'sportswear',
];

// ---------------------------------------------------------------------------
// Price / budget (hard constraints)
// ---------------------------------------------------------------------------

export function parseNumeric(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Effective selling price: discounted when lower than retail, else retail. */
export function getEffectivePrice(fields: RawPriceFields): number {
  const retail = parseNumeric(fields.retail_price);
  const discounted = parseNumeric(fields.discounted_price);
  if (discounted > 0 && retail > 0 && discounted < retail) return discounted;
  return retail > 0 ? retail : discounted;
}

export function getProductEffectivePrice(product: Product): number {
  if (product.originalPrice != null && product.price < product.originalPrice) {
    return product.price;
  }
  return product.price > 0 ? product.price : (product.originalPrice ?? 0);
}

export function matchesBudgetConstraint(
  product: Product,
  budgetMin?: number,
  budgetMax?: number,
): boolean {
  const price = getProductEffectivePrice(product);
  if (price <= 0) return false;
  if (budgetMin != null && price < budgetMin) return false;
  if (budgetMax != null && price > budgetMax) return false;
  return true;
}

export function widenBudgetMax(originalMax: number, stepIndex: number): number {
  const multiplier = BUDGET_WIDEN_MULTIPLIERS[Math.min(stepIndex, BUDGET_WIDEN_MULTIPLIERS.length - 1)];
  return Math.round(originalMax * multiplier);
}

export function applyCheaperBudget(context: RecommendationContext): RecommendationContext {
  if (context.budgetMax == null) {
    return { ...context, cheaperRequested: true, budgetMax: 2000 };
  }
  const reduced = Math.max(500, Math.round(context.budgetMax * 0.7));
  return {
    ...context,
    cheaperRequested: true,
    budgetMax: reduced,
    budgetMin: undefined,
    budgetWidened: false,
    budgetWidenedTo: undefined,
  };
}

// ---------------------------------------------------------------------------
// Gender (hard constraint when confidence is high)
// ---------------------------------------------------------------------------

export function parseGenderFromText(message: string): { gender?: Gender; confidence: GenderConfidence } {
  const lower = message.toLowerCase();

  const menPatterns = [
    /\bmen'?s\b/,
    /\bfor\s+men\b/,
    /\bfor\s+him\b/,
    /\bmens\b/,
    /\bman'?s\b/,
    /\bgroom\b/,
    /\bmale\b/,
    /\bgents?\b/,
    /\bboy'?s?\b/,
    /\bbrother\b/,
    /\bfather\b/,
    /\bhusband\b/,
    /\bson\b/,
    /\bdad\b/,
    /\bguy\b/,
    /\bguys\b/,
    /\bboyfriend\b/,
    /\bsherwani\b/,
    /\bbandhgala\b/,
  ];

  const womenPatterns = [
    /\bwomen'?s\b/,
    /\bfor\s+women\b/,
    /\bfor\s+her\b/,
    /\bwomens\b/,
    /\bladies\b/,
    /\blady\b/,
    /\bbride\b/,
    /\bfemale\b/,
    /\bgirl'?s?\b/,
    /\bsister\b/,
    /\bmother\b/,
    /\bwife\b/,
    /\bdaughter\b/,
    /\bmom\b/,
    /\bmum\b/,
    /\bgirlfriend\b/,
    /\bsaree\b/,
    /\bsari\b/,
    /\blehenga\b/,
    /\bkurti\b/,
    /\bheels\b/,
    /\bstiletto\b/,
  ];

  const hasMen = menPatterns.some((p) => p.test(lower));
  const hasWomen = womenPatterns.some((p) => p.test(lower));

  if (hasMen && !hasWomen) return { gender: 'men', confidence: 'explicit' };
  if (hasWomen && !hasMen) return { gender: 'women', confidence: 'explicit' };
  if (/\bmen\b/.test(lower) && !/\bwomen\b/.test(lower)) return { gender: 'men', confidence: 'explicit' };
  if (/\bwomen\b/.test(lower) && !/\bmen\b/.test(lower)) return { gender: 'women', confidence: 'explicit' };

  return { confidence: 'none' };
}

export function shouldApplyGenderFilter(context: RecommendationContext): boolean {
  if (!context.gender) return false;
  return context.genderConfidence === 'explicit'
    || context.genderConfidence === 'quiz'
    || context.genderConfidence === 'image_high'
    || context.genderConfidence === 'inferred';
}

function isExplicitlyWomensProduct(cat: string, name: string): boolean {
  const c = cat.toLowerCase();
  const n = name.toLowerCase();
  return (
    c.includes("women's") ||
    c.includes('womens') ||
    n.includes("women's") ||
    n.includes('womens') ||
    c.includes('saree') ||
    c.includes('lehenga') ||
    c.includes('kurti') ||
    c.includes('bra') ||
    n.includes('saree') ||
    n.includes('lehenga') ||
    n.includes('kurti') ||
    n.includes('bra') ||
    c.includes('dresses') ||
    n.includes('dress')
  );
}

function isExplicitlyMensProduct(cat: string, name: string): boolean {
  const cClean = cat.toLowerCase().replace(/women'?s/gi, '');
  const nClean = name.toLowerCase().replace(/women'?s/gi, '');
  return (
    cClean.includes("men's") ||
    cClean.includes('mens') ||
    nClean.includes("men's") ||
    nClean.includes('mens') ||
    cat.toLowerCase().includes('sherwani') ||
    name.toLowerCase().includes('sherwani')
  );
}

export function matchesGenderConstraint(product: Product, gender: Gender): boolean {
  const cat = product.category || '';
  const name = product.name || '';

  const isWomens = isExplicitlyWomensProduct(cat, name);
  const isMens = isExplicitlyMensProduct(cat, name);

  if (gender === 'men') {
    return isMens && !isWomens;
  }
  return isWomens && !isMens;
}

export function isValidProduct(product: Product): boolean {
  return product.id > 0 && getProductEffectivePrice(product) > 0;
}

const NON_APPAREL_FRAGMENTS = [
  'jewellery', 'jewelry', 'brooch', 'swimming', 'swimsuit', 'aquashort',
  'stationery', 'electronics', 'home decor', 'kitchen', 'toy', 'book',
];

export function isFashionProduct(product: Product): boolean {
  const cat = (product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  if (NON_APPAREL_FRAGMENTS.some((f) => cat.includes(f) || name.includes(f))) return false;
  return FASHION_FRAGMENTS.some((f) => cat.includes(f) || name.includes(f));
}

// ---------------------------------------------------------------------------
// Occasion parsing
// ---------------------------------------------------------------------------

export function parseOccasionFromText(message: string): OccasionId | undefined {
  const lower = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const [id, meta] of Object.entries(OCCASION_TAXONOMY) as [OccasionId, typeof OCCASION_TAXONOMY[OccasionId]][]) {
    if (meta.aliases.some((alias) => lower.includes(alias))) {
      return id;
    }
  }
  return undefined;
}

export function getOccasionCategoryPaths(occasion: OccasionId, gender?: Gender): string[] {
  const entry = OCCASION_TAXONOMY[occasion];
  if (!entry) return [];
  if (gender === 'men') return entry.categoryPaths.men;
  if (gender === 'women') return entry.categoryPaths.women;
  return [...entry.categoryPaths.men, ...entry.categoryPaths.women];
}

export function getOccasionQueryTerms(occasion: OccasionId, gender?: Gender): string[] {
  const entry = OCCASION_TAXONOMY[occasion];
  if (!entry) return [];
  if (gender === 'men') return entry.searchTerms.men;
  if (gender === 'women') return entry.searchTerms.women;
  return [...entry.searchTerms.men, ...entry.searchTerms.women];
}

// ---------------------------------------------------------------------------
// Intent parsing & context merge
// ---------------------------------------------------------------------------

export function extractBudget(value: string): { min?: number; max?: number } | null {
  const lower = value.toLowerCase();
  const amountRegex = /(?:under|below|less than|within|upto|up to|max|budget|cheaper than)\s*[₹rs.inr]*\s*([0-9,]+)|[₹rs.inr]*\s*([0-9,]+)\s*(?:and|to|-|or)\s*[₹rs.inr]*\s*([0-9,]+)/gi;
  const matches = Array.from(lower.matchAll(amountRegex));
  if (matches.length === 0) return null;

  const first = matches[0];
  const underValue = first[1] || null;
  const lowerValue = first[2] || null;
  const higherValue = first[3] || null;

  if (underValue) return { max: parseNumeric(underValue) };
  if (lowerValue && higherValue) {
    return { min: parseNumeric(lowerValue), max: parseNumeric(higherValue) };
  }
  return null;
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

function guessColor(message: string): string | undefined {
  const lower = message.toLowerCase();
  return COLOR_HINTS.find((color) => lower.includes(color));
}

export function mergeIntentIntoContext(
  message: string,
  prior: RecommendationContext,
): RecommendationContext {
  const lower = message.toLowerCase();
  const budget = extractBudget(message);
  const genderParse = parseGenderFromText(message);
  const occasion = parseOccasionFromText(message);
  const categoryGuess = guessCategory(message);
  const color = guessColor(message);
  const cheaperRequested = /cheaper|budget|affordable|cheap|less expensive/i.test(lower);

  let next: RecommendationContext = {
    ...prior,
    turnCount: prior.turnCount + 1,
    keywords: getKeywords(message).slice(0, 8),
  };

  if (genderParse.gender) {
    next.gender = genderParse.gender;
    next.genderConfidence = genderParse.confidence;
  } else {
    next.gender = prior.gender;
    next.genderConfidence = prior.genderConfidence;
  }

  if (occasion) {
    next.occasion = occasion;
  } else {
    next.occasion = prior.occasion;
  }

  if (categoryGuess.category) {
    next.category = categoryGuess.category;
    next.categoryLabel = categoryGuess.label;
  } else {
    next.category = prior.category;
    next.categoryLabel = prior.categoryLabel;
  }

  if (color) {
    next.color = color;
  } else {
    next.color = prior.color;
  }

  next.recentlyShownIds = prior.recentlyShownIds;
  next.excludedProductIds = prior.excludedProductIds;

  if (budget) {
    next.budgetMin = budget.min ?? prior.budgetMin;
    next.budgetMax = budget.max ?? prior.budgetMax;
    next.budgetWidened = false;
    next.budgetWidenedTo = undefined;
  } else if (cheaperRequested) {
    next = applyCheaperBudget(next);
  } else {
    next.budgetMin = prior.budgetMin;
    next.budgetMax = prior.budgetMax;
    next.budgetWidened = prior.budgetWidened;
    next.budgetWidenedTo = prior.budgetWidenedTo;
  }

  next.cheaperRequested = cheaperRequested || prior.cheaperRequested;

  return next;
}

// ---------------------------------------------------------------------------
// Scoring (soft constraints)
// ---------------------------------------------------------------------------

function colorMatchScore(product: Product, color?: string): number {
  if (!color) return 0;
  const text = `${product.name} ${product.description}`.toLowerCase();
  return text.includes(color.toLowerCase()) ? 8 : 0;
}

function brandMatchScore(product: Product, brand?: string): number {
  if (!brand) return 0;
  return product.brand.toLowerCase().includes(brand.toLowerCase()) ? 2 : 0;
}

function occasionFitScore(product: Product, occasion?: OccasionId, gender?: Gender): number {
  if (!occasion) return 0;
  const terms = getOccasionQueryTerms(occasion, gender);
  const cat = (product.category || '').toLowerCase();
  let score = 0;
  if (terms.some((t) => cat.includes(t.toLowerCase()))) score += 4;
  if (terms.some((t) => product.name.toLowerCase().includes(t.toLowerCase()))) score += 2;
  if (gender === 'men' && cat.includes("men's")) score += 1;
  if (gender === 'women' && cat.includes("women's")) score += 1;
  return score;
}

function priceFitScore(product: Product, budgetMax?: number): number {
  if (budgetMax == null) return 0;
  const price = getProductEffectivePrice(product);
  if (price > budgetMax) return -5;
  const ratio = price / budgetMax;
  if (ratio >= 0.5 && ratio <= 0.95) return 2;
  if (ratio < 0.5) return 1;
  return 0.5;
}

function keywordRelevanceScore(product: Product, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
  const hits = keywords.filter((k) => text.includes(k.toLowerCase())).length;
  return hits * 1.5;
}

export function scoreCandidate(
  product: Product,
  context: RecommendationContext,
): ScoredProduct {
  const reasons: string[] = [];
  let score = 0;

  const ratingScore = Math.min(product.rating || 0, 5) * 0.8;
  score += ratingScore;
  if ((product.rating || 0) >= 4.2) reasons.push('Strong customer rating.');

  const rel = keywordRelevanceScore(product, context.keywords);
  score += rel;
  if (rel > 0) reasons.push('Matches your search terms.');

  const occ = occasionFitScore(product, context.occasion, context.gender);
  score += occ;
  if (occ > 0 && context.occasion) reasons.push(`Good fit for ${OCCASION_TAXONOMY[context.occasion].label}.`);

  const priceFit = priceFitScore(product, context.budgetWidenedTo ?? context.budgetMax);
  score += priceFit;
  if (context.budgetMax != null && matchesBudgetConstraint(product, context.budgetMin, context.budgetMax)) {
    reasons.push('Fits your budget.');
  }

  const color = colorMatchScore(product, context.color);
  score += color;
  if (color > 0) reasons.push(`Includes your preferred ${context.color} tone.`);

  const brand = brandMatchScore(product, context.brand);
  score += brand;
  if (brand > 0) reasons.push('Matches your brand preference.');

  if (context.recentlyShownIds.includes(product.id)) score -= 4;
  if (context.excludedProductIds.includes(product.id)) score -= 10;

  if (reasons.length === 0) reasons.push('Recommended for overall value.');

  return { product, score, reasons: reasons.slice(0, 3) };
}

export function scoreCandidates(
  products: Product[],
  context: RecommendationContext,
): ScoredProduct[] {
  return products
    .map((p) => scoreCandidate(p, context))
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Diversity selection
// ---------------------------------------------------------------------------

function extractCorePattern(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\b(size|pack|set|of|for|with|and|the)\b/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
}

export function selectDiverseProducts(
  scored: ScoredProduct[],
  limit: number = DEFAULT_RESULT_LIMIT,
  options?: {
    maxPerBrand?: number;
    maxPerSubcategory?: number;
    maxPerPattern?: number;
    excludeIds?: number[];
  },
): Product[] {
  const maxPerBrand = options?.maxPerBrand ?? 2;
  const maxPerSubcategory = options?.maxPerSubcategory ?? 3;
  const maxPerPattern = options?.maxPerPattern ?? 2;
  const excludeIds = new Set(options?.excludeIds ?? []);

  const brandCounts = new Map<string, number>();
  const subCatCounts = new Map<string, number>();
  const patternCounts = new Map<string, number>();
  const seenNames = new Set<string>();
  const selected: Product[] = [];

  for (const { product } of scored) {
    if (excludeIds.has(product.id)) continue;
    if (selected.length >= limit) break;

    const normName = product.name.trim().toLowerCase();
    if (seenNames.has(normName)) continue;

    const brandKey = (product.brand || 'generic').toLowerCase();
    const subCat = (product.category || 'general').split('>>').slice(0, 3).join(' >> ').toLowerCase();
    const patternKey = `${subCat}::${extractCorePattern(product.name)}`;

    if ((brandCounts.get(brandKey) || 0) >= maxPerBrand) continue;
    if ((subCatCounts.get(subCat) || 0) >= maxPerSubcategory) continue;
    if ((patternCounts.get(patternKey) || 0) >= maxPerPattern) continue;

    seenNames.add(normName);
    brandCounts.set(brandKey, (brandCounts.get(brandKey) || 0) + 1);
    subCatCounts.set(subCat, (subCatCounts.get(subCat) || 0) + 1);
    patternCounts.set(patternKey, (patternCounts.get(patternKey) || 0) + 1);
    selected.push(product);
  }

  if (selected.length < limit) {
    for (const { product } of scored) {
      if (selected.length >= limit) break;
      if (excludeIds.has(product.id)) continue;
      if (selected.some((p) => p.id === product.id)) continue;
      selected.push(product);
    }
  }

  return selected;
}

export function applyHardFilters(
  products: Product[],
  context: RecommendationContext,
): Product[] {
  return products.filter((product) => {
    if (!isValidProduct(product)) return false;
    if (!isFashionProduct(product)) return false;
    if (shouldApplyGenderFilter(context) && context.gender && !matchesGenderConstraint(product, context.gender)) {
      return false;
    }
    const effectiveMax = context.budgetWidenedTo ?? context.budgetMax;
    if (!matchesBudgetConstraint(product, context.budgetMin, effectiveMax)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Headings & explanations (real product data only)
// ---------------------------------------------------------------------------

export function buildRecommendationHeading(context: RecommendationContext): string {
  const parts: string[] = [];

  if (shouldApplyGenderFilter(context) && context.gender) {
    parts.push(context.gender === 'men' ? "Men's" : "Women's");
  }

  if (context.occasion) {
    const label = OCCASION_TAXONOMY[context.occasion].label;
    parts.push(label.charAt(0).toUpperCase() + label.slice(1));
  } else if (context.categoryLabel) {
    parts.push(context.categoryLabel.charAt(0).toUpperCase() + context.categoryLabel.slice(1));
  }

  parts.push('Picks');

  const budgetMax = context.budgetWidened && context.budgetWidenedTo
    ? context.budgetWidenedTo
    : context.budgetMax;
  if (budgetMax != null) {
    return `${parts.join(' ')} Under ₹${budgetMax.toLocaleString('en-IN')}`;
  }

  return parts.length > 1 ? parts.join(' ') : 'Recommended Products';
}

export function buildExplanation(
  products: Product[],
  context: RecommendationContext,
  scored?: ScoredProduct[],
): string {
  if (products.length === 0) {
    if (context.budgetMax != null) {
      return `I could not find products under ₹${context.budgetMax.toLocaleString('en-IN')} matching your criteria. Try raising the budget or changing the category.`;
    }
    return 'I could not find a strong match in the live catalog right now.';
  }

  const top = products[0];
  const scoreMap = new Map((scored || []).map((s) => [s.product.id, s]));
  const topReasons = scoreMap.get(top.id)?.reasons ?? [];

  const parts: string[] = [
    `I picked ${top.name} (₹${getProductEffectivePrice(top).toLocaleString('en-IN')}, rating ${(top.rating || 0).toFixed(1)}) as the top match.`,
  ];

  if (topReasons.length > 0) {
    parts.push(topReasons.join(' '));
  }

  if (context.budgetWidened && context.budgetWidenedTo != null && context.budgetMax != null) {
    parts.push(
      `I widened your budget from ₹${context.budgetMax.toLocaleString('en-IN')} to ₹${context.budgetWidenedTo.toLocaleString('en-IN')} because too few items matched at the original limit.`,
    );
  } else if (context.budgetMax != null) {
    parts.push(`All picks are within ₹${(context.budgetWidenedTo ?? context.budgetMax).toLocaleString('en-IN')}.`);
  }

  if (context.color) {
    parts.push(`I prioritized ${context.color} options where available.`);
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Supabase retrieval (used by consumers in later steps — not wired to UI yet)
// ---------------------------------------------------------------------------

export interface RetrieveCandidatesResult {
  products: Product[];
  budgetWidened: boolean;
  budgetWidenedTo?: number;
}

export async function retrieveCandidates(
  context: RecommendationContext,
): Promise<RetrieveCandidatesResult> {
  const { supabase } = await import('./supabaseClient');
  const { mapRawProduct, PRODUCT_SELECT } = await import('./api');
  const selectStr = PRODUCT_SELECT.replace('categories!fk_category(path)', 'categories!fk_category!inner(path)');

  const originalMax = context.budgetMax;
  let widenStep = 0;
  let effectiveMax = originalMax;
  let products: Product[] = [];

  while (widenStep < BUDGET_WIDEN_MULTIPLIERS.length) {
    if (originalMax != null) {
      effectiveMax = widenBudgetMax(originalMax, widenStep);
    }

  const rows = await runCandidateQuery(supabase, selectStr, context, effectiveMax);
    products = applyHardFilters(
      filterPresentationSafe(rows.map((row: unknown) => mapRawProduct(row))),
      {
        ...context,
        budgetWidened: widenStep > 0,
        budgetWidenedTo: widenStep > 0 ? effectiveMax : undefined,
      },
    );

    if (products.length >= DEFAULT_RESULT_LIMIT || originalMax == null || widenStep >= BUDGET_WIDEN_MULTIPLIERS.length - 1) {
      break;
    }
    widenStep += 1;
  }

  return {
    products,
    budgetWidened: widenStep > 0 && originalMax != null,
    budgetWidenedTo: widenStep > 0 && originalMax != null ? effectiveMax : undefined,
  };
}

async function runCandidateQuery(
  supabase: Awaited<typeof import('./supabaseClient')>['supabase'],
  selectStr: string,
  context: RecommendationContext,
  budgetMax?: number,
): Promise<unknown[]> {
  const applySharedFilters = (base: any): any => {
    let query = base.select(selectStr).gt('retail_price', 0);

    if (shouldApplyGenderFilter(context) && context.gender) {
      if (context.gender === 'men') {
        query = query.ilike('categories.path', "%Men's%").not('categories.path', 'ilike', "%Women's%");
      } else {
        query = query.ilike('categories.path', "%Women's%");
      }
      query = query
        .not('categories.path', 'ilike', "%Kids'%")
        .not('categories.path', 'ilike', "%Baby Care%")
        .not('categories.path', 'ilike', "%Infant%");
    }

    if (budgetMax != null) {
      query = query.lte('retail_price', budgetMax);
    }
    if (context.budgetMin != null) {
      query = query.gte('retail_price', context.budgetMin);
    }

    return query;
  };

  if (context.occasion) {
    const terms = getOccasionQueryTerms(context.occasion, context.gender).slice(0, 3);
    const merged = new Map<number, unknown>();

    for (const term of terms) {
      let query = applySharedFilters(supabase.from('products_new'));
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
      const { data, error } = await query.order('rating', { ascending: false }).limit(50);
      if (error) {
        console.warn('recommendationEngine occasion query error:', error.message);
        continue;
      }
      for (const row of data || []) {
        const id = (row as { product_id?: number }).product_id;
        if (id != null) merged.set(id, row);
      }
    }

    if (merged.size > 0) return [...merged.values()];

    // Occasion term fallback: gender-scoped browse without occasion keywords
    const fallback = applySharedFilters(supabase.from('products_new'));
    const { data, error } = await fallback.order('rating', { ascending: false }).limit(CANDIDATE_FETCH_LIMIT);
    if (error) {
      console.warn('recommendationEngine retrieveCandidates error:', error.message);
      return [];
    }
    return data || [];
  }

  let query = applySharedFilters(supabase.from('products_new'));

  if (context.category) {
    query = query.ilike('categories.path', `%${context.category}%`);
  }

  const { data, error } = await query
    .order('rating', { ascending: false })
    .limit(CANDIDATE_FETCH_LIMIT);

  if (error) {
    console.warn('recommendationEngine retrieveCandidates error:', error.message);
    return [];
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Full pipeline orchestrator
// ---------------------------------------------------------------------------

export async function runRecommendationPipeline(
  message: string,
  priorContext: RecommendationContext = DEFAULT_CONTEXT,
  options?: { limit?: number },
): Promise<RecommendationResult> {
  const limit = options?.limit ?? DEFAULT_RESULT_LIMIT;
  let context = mergeIntentIntoContext(message, priorContext);

  const retrieval = await retrieveCandidates(context);
  context = {
    ...context,
    budgetWidened: retrieval.budgetWidened,
    budgetWidenedTo: retrieval.budgetWidenedTo,
  };

  const scored = scoreCandidates(retrieval.products, context);
  const diverse = selectDiverseProducts(scored, limit, {
    excludeIds: [...context.recentlyShownIds, ...context.excludedProductIds],
  });

  const heading = buildRecommendationHeading(context);
  const explanation = buildExplanation(diverse, context, scored);

  return {
    products: diverse,
    context: {
      ...context,
      recentlyShownIds: [...new Set([...context.recentlyShownIds, ...diverse.map((p) => p.id)])].slice(-40),
    },
    heading,
    explanation,
    budgetWidened: retrieval.budgetWidened,
    budgetWidenedTo: retrieval.budgetWidenedTo,
    clarifyingQuestion: diverse.length === 0
      ? 'Would you like me to broaden the search or focus on a different category?'
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Test helpers (exported for scripts/test-recommendation-engine.ts)
// ---------------------------------------------------------------------------

export function runEngineSelfTest(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];

  function assert(condition: boolean, message: string) {
    if (!condition) errors.push(message);
  }

  assert(getEffectivePrice({ retail_price: 5000, discounted_price: 3999 }) === 3999, 'effective price uses discount');
  assert(getEffectivePrice({ retail_price: 3000, discounted_price: 3500 }) === 3000, 'effective price ignores higher discount');
  assert(matchesBudgetConstraint({ id: 1, name: 'x', brand: 'b', description: '', price: 4500, originalPrice: 6000, rating: 4, image: '', category: '' }, undefined, 5000), 'budget allows effective price under max');
  assert(!matchesBudgetConstraint({ id: 1, name: 'x', brand: 'b', description: '', price: 5500, originalPrice: 6000, rating: 4, image: '', category: '' }, undefined, 5000), 'budget rejects price over max');

  const menProduct: Product = { id: 1, name: 'Shirt', brand: 'X', description: '', price: 1000, rating: 4, image: '', category: "Clothing >> Men's Clothing >> Shirts" };
  const womenProduct: Product = { id: 2, name: 'Saree', brand: 'Y', description: '', price: 2000, rating: 4, image: '', category: "Clothing >> Women's Clothing >> Ethnic Wear >> Sarees" };
  const womenBra: Product = { id: 30, name: "Women's Full Coverage Bra", brand: 'S4S', description: '', price: 300, rating: 4, image: '', category: "Clothing >> Women's Clothing >> Lingerie >> Bras" };

  assert(matchesGenderConstraint(menProduct, 'men'), 'men product matches men');
  assert(!matchesGenderConstraint(womenProduct, 'men'), 'women product rejected for men');
  assert(!matchesGenderConstraint(womenBra, 'men'), 'women bra rejected for men despite substring');
  assert(matchesGenderConstraint(womenBra, 'women'), 'women bra matches women');

  assert(parseGenderFromText("I need a men's wedding outfit under ₹5000").gender === 'men', "men's wedding parses gender");
  assert(parseGenderFromText("Now show for my sister").gender === 'women', "sister parses women gender");

  const ctx = mergeIntentIntoContext("I need a men's wedding outfit under ₹5000", DEFAULT_CONTEXT);
  assert(ctx.gender === 'men' && ctx.occasion === 'wedding' && ctx.budgetMax === 5000, 'multi-intent merge');

  const ctx2 = mergeIntentIntoContext('Show me something black', ctx);
  assert(ctx2.color === 'black' && ctx2.gender === 'men' && ctx2.budgetMax === 5000, 'context retained on color turn');

  const ctx3 = mergeIntentIntoContext('Give me cheaper options', ctx2);
  assert(ctx3.budgetMax != null && ctx3.budgetMax < 5000 && ctx3.gender === 'men' && ctx3.occasion === 'wedding', 'cheaper reduces budget while retaining context');

  const ctx4 = mergeIntentIntoContext('Now show for my sister', ctx3);
  assert(ctx4.gender === 'women' && ctx4.occasion === 'wedding', 'gender switch updates gender to women while retaining occasion');

  const scored = scoreCandidates(
    [
      { ...menProduct, rating: 4.5, name: 'Wedding Sherwani' },
      { ...menProduct, id: 3, rating: 3.0, name: 'Casual Tee' },
    ],
    { ...ctx, gender: 'men', genderConfidence: 'explicit', occasion: 'wedding' },
  );
  assert(scored[0].product.name.includes('Sherwani'), 'scoring prefers occasion-relevant product');

  const hardFiltered = applyHardFilters([menProduct, womenProduct, womenBra], { ...ctx, gender: 'men', genderConfidence: 'explicit' });
  assert(hardFiltered.length === 1 && hardFiltered[0].id === menProduct.id, 'hard filter removes all opposite gender items');

  const diverse = selectDiverseProducts(
    [
      { product: { ...menProduct, id: 10, brand: 'A' }, score: 5, reasons: [] },
      { product: { ...menProduct, id: 11, brand: 'A', name: 'Shirt 2' }, score: 4, reasons: [] },
      { product: { ...menProduct, id: 12, brand: 'B', name: 'Kurta' }, score: 3, reasons: [] },
    ],
    2,
    { maxPerBrand: 1 },
  );
  assert(diverse.length === 2 && new Set(diverse.map((p) => p.brand)).size === 2, 'diversity caps same brand');

  assert(buildRecommendationHeading({ ...ctx, genderConfidence: 'explicit' }).includes("Men's"), 'heading includes gender');
  assert(buildRecommendationHeading({ ...ctx, genderConfidence: 'explicit' }).includes('5,000'), 'heading includes budget');

  const totalTests = 17;
  return { passed: errors.length === 0 ? totalTests : totalTests - errors.length, failed: errors.length, errors };
}
