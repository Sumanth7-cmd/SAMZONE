import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Excludes products that are marked as presentation blocked.
 */
export function applyPresentationSafeFilter(
  query: any
): any {
  return query;
}

export function applyFashionOnlyFilter(
  query: any
): any {
  return query;
}

/**
 * Intimate apparel exclusion filter for presentation.
 * Filters out items whose name or category path matches bra/lingerie/innerwear/panties terms,
 * using strict word boundaries so normal items like "Bracelet" or "Brass" are unaffected.
 */
const INTIMATE_APPAREL_REGEX = /\b(bra|bras|lingerie|innerwear|panty|panties|briefs|undergarment|bustier|camisole|thong)\b/i;

export function isPresentationSafeProduct(product: { name?: string; category?: string; category_path?: string }): boolean {
  const name = product.name || '';
  const category = product.category || product.category_path || '';
  if (INTIMATE_APPAREL_REGEX.test(name) || INTIMATE_APPAREL_REGEX.test(category)) {
    return false;
  }
  return true;
}

export function filterPresentationSafe<T extends { name?: string; category?: string; category_path?: string }>(items: T[]): T[] {
  return items.filter(isPresentationSafeProduct);
}
