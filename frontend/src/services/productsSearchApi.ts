import { supabase } from './supabaseClient';

export interface CatalogProduct {
    id: number;
    external_id: string;
    product_name: string;
    master_category: string;
    sub_category: string;
    article_type: string;
    base_colour: string;
    gender: string;
    season: string;
    usage: string;
    image_url: string;
    price: number;
    created_at: string;
}

export type ProductSort = 'price_asc' | 'price_desc' | 'newest';

export interface ProductSearchParams {
    q?: string;
    category?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: ProductSort;
    page?: number;
    pageSize?: number;
}

export interface ProductSearchResponse {
    products: CatalogProduct[];
    totalCount: number;
    page: number;
    totalPages: number;
}

// The 5 master_category and 5 gender values actually present in the products
// table (verified by paginating the full table), not the old Spring-backend
// taxonomy ("Men's Clothing" etc.) that doesn't exist on this schema.
export const CATEGORY_OPTIONS = ['Apparel', 'Footwear', 'Accessories', 'Free Items', 'Personal Care'];
export const GENDER_OPTIONS = ['Men', 'Women', 'Unisex', 'Boys', 'Girls'];

const DEFAULT_PAGE_SIZE = 24;

// Builds an AND-of-prefixes tsquery ("puma:* & shirt:*") so short, in-progress
// search-box input still matches - plain to_tsquery only matches whole lexemes,
// so typing "shi" would otherwise miss "Shirt" entirely without the `:*` prefix
// operator on each term.
function buildPrefixTsQuery(q: string): string | null {
    const terms = q
        .trim()
        .split(/\s+/)
        .map((term) => term.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(Boolean);

    if (terms.length === 0) return null;
    return terms.map((term) => `${term}:*`).join(' & ');
}

// --- Near-duplicate suppression -------------------------------------------
//
// The source catalog genuinely repeats the same product_name across distinct
// rows (different external_id/image) up to ~10x (e.g. "Rocia Women Black
// Flats"). Left alone, a narrow search/filter can put several of those on
// one page and read as broken/duplicated results. This caps how many
// same-or-near-same-named products can appear together on a single fetched
// page. It only reorders what was already fetched - no extra query, so at a
// page size of a few dozen rows the O(n * groups) cost is negligible.
const MAX_PER_NAME_GROUP = 3;

function tokenize(name: string): string[] {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

// This catalog's names consistently end in the product-type noun (Flats,
// Sandals, Shoes, Jeans, Watch, Kurta, ...). Requiring that last word to
// match (tolerating a trailing plural "s") is what keeps this from lumping
// together genuinely different products that just share brand/color/gender
// tokens - e.g. "Rocia Women Black Flats" vs "Rocia Women Black Heels" is a
// 1-word difference by token count alone, but flats and heels aren't
// duplicates of each other.
function lastToken(tokens: string[]): string {
    const last = tokens[tokens.length - 1] ?? '';
    return last.endsWith('s') ? last.slice(0, -1) : last;
}

// "Very similar" per the product ask: identical name, or differing by only
// 1-2 words (e.g. "Rocia Women Black Flats" vs "Rocia Women Brown Flats").
function isNearDuplicateName(a: string, b: string): boolean {
    if (a === b) return true;
    const tokenListA = tokenize(a);
    const tokenListB = tokenize(b);
    if (lastToken(tokenListA) !== lastToken(tokenListB)) return false;

    const tokensA = new Set(tokenListA);
    const tokensB = new Set(tokenListB);
    let shared = 0;
    for (const t of tokensA) {
        if (tokensB.has(t)) shared++;
    }
    const union = tokensA.size + tokensB.size - shared;
    const diff = union - shared;
    return shared > 0 && diff <= 2;
}

function suppressNearDuplicates(products: CatalogProduct[]): CatalogProduct[] {
    const groups: { representative: string; count: number }[] = [];
    const kept: CatalogProduct[] = [];

    for (const product of products) {
        let group = groups.find((g) => isNearDuplicateName(g.representative, product.product_name));
        if (!group) {
            group = { representative: product.product_name, count: 0 };
            groups.push(group);
        }
        if (group.count < MAX_PER_NAME_GROUP) {
            group.count++;
            kept.push(product);
        }
        // else: capped - this product is skipped for this page, per spec ("cap and skip the rest").
    }

    return kept;
}

// --- Randomized default browse order --------------------------------------
//
// PostgREST's `order=` parameter only accepts column references - it rejects
// `random()` outright (PGRST100 parse error, verified directly against this
// project), and there's no RPC/DB-function access available to work around
// that. Even with one, naive `ORDER BY random() LIMIT/OFFSET` re-shuffles the
// whole table on every request, so page 2 wouldn't be a stable continuation
// of page 1 (rows would repeat or vanish across pages) - the same class of
// bug already ruled out for id-ordering. Instead: pick a random starting
// offset once per browser session, cached in sessionStorage, and browse the
// existing id-ordered sequence from there. Pagination within the session is
// then just a plain indexed range query (cheap, same fast path as before) -
// only the starting point varies between visits.
const SESSION_SEED_KEY = 'shop_browse_seed_v1';

interface BrowseSeedState {
    seed: number;
    totalAtSeedTime: number;
}

function loadBrowseSeed(): BrowseSeedState | null {
    try {
        const raw = sessionStorage.getItem(SESSION_SEED_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.seed === 'number' && typeof parsed?.totalAtSeedTime === 'number') {
            return parsed;
        }
    } catch {
        // sessionStorage unavailable or corrupted value - fall through to regenerate.
    }
    return null;
}

function saveBrowseSeed(state: BrowseSeedState): void {
    try {
        sessionStorage.setItem(SESSION_SEED_KEY, JSON.stringify(state));
    } catch {
        // sessionStorage unavailable (e.g. private browsing) - randomization
        // just won't persist across requests in that case, which is harmless.
    }
}

function isDefaultBrowse(params: ProductSearchParams): boolean {
    return (
        !params.q &&
        !params.category &&
        !params.gender &&
        params.minPrice == null &&
        params.maxPrice == null &&
        !params.sort
    );
}

// Generating a fresh seed requires an async count query, which leaves a gap
// between "check sessionStorage" and "write sessionStorage" - two calls
// landing in that gap (e.g. React 18 StrictMode's double effect-invocation in
// dev) would each mint their own seed and race to persist it, so the
// requester earlier in the race could display different rows than the seed
// that ends up saved (confirmed while testing: a same-tab refresh showed a
// different product set than the initial load). Memoizing the in-flight
// promise means every concurrent caller within a session shares the same
// resolved seed instead of racing to create one.
let seedPromise: Promise<BrowseSeedState> | null = null;

function getBrowseSeedState(pageSize: number): Promise<BrowseSeedState> {
    const cached = loadBrowseSeed();
    if (cached) return Promise.resolve(cached);

    if (!seedPromise) {
        seedPromise = (async () => {
            const { count, error: countError } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true });

            if (countError) {
                seedPromise = null; // allow a retry on the next call
                throw new Error(`Product count failed: ${countError.message}`);
            }

            const total = count ?? 0;
            const maxOffset = Math.max(0, total - pageSize);
            const state: BrowseSeedState = {
                seed: Math.floor(Math.random() * (maxOffset + 1)),
                totalAtSeedTime: total,
            };
            saveBrowseSeed(state);
            return state;
        })();
    }

    return seedPromise;
}

async function fetchRandomizedBrowsePage(page: number, pageSize: number): Promise<ProductSearchResponse> {
    const seedState = await getBrowseSeedState(pageSize);

    const maxOffset = Math.max(0, seedState.totalAtSeedTime - pageSize);
    const baseOffset = Math.min(seedState.seed, maxOffset);
    const from = baseOffset + (page - 1) * pageSize;
    const totalPages = Math.max(1, Math.ceil((seedState.totalAtSeedTime - baseOffset) / pageSize));

    if (from >= seedState.totalAtSeedTime) {
        // Paged past the end of the randomized slice - stop rather than wrap.
        return { products: [], totalCount: seedState.totalAtSeedTime, page, totalPages };
    }

    const to = from + pageSize - 1;
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);

    if (error) {
        throw new Error(`Product search failed: ${error.message}`);
    }

    return {
        products: suppressNearDuplicates((data ?? []) as CatalogProduct[]),
        totalCount: seedState.totalAtSeedTime,
        page,
        totalPages,
    };
}

export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
    const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? Math.floor(params.pageSize) : DEFAULT_PAGE_SIZE;

    if (isDefaultBrowse(params)) {
        return fetchRandomizedBrowsePage(page, pageSize);
    }

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (params.q) {
        const tsQuery = buildPrefixTsQuery(params.q);
        if (tsQuery) {
            query = query.textSearch('product_name', tsQuery);
        }
    }

    if (params.category) {
        query = query.eq('master_category', params.category);
    }

    if (params.gender) {
        query = query.eq('gender', params.gender);
    }

    if (params.minPrice != null) {
        query = query.gte('price', params.minPrice);
    }

    if (params.maxPrice != null) {
        query = query.lte('price', params.maxPrice);
    }

    switch (params.sort) {
        case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
        case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
        case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
    }

    // Stable tiebreaker so .range() pagination can't return duplicate/skipped
    // rows across pages when the primary sort has ties (e.g. equal prices).
    query = query.order('id', { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
        throw new Error(`Product search failed: ${error.message}`);
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
        products: suppressNearDuplicates((data ?? []) as CatalogProduct[]),
        totalCount,
        page,
        totalPages,
    };
}
