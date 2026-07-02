export const PLACEHOLDER = 'https://placehold.co/300x300?text=No+Image';

export function getProductImage(product: any): string {
    const url = product?.image || product?.imageUrl || product?.images?.[0] || null;
    if (!url || typeof url !== 'string' || url.trim() === '') return PLACEHOLDER;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return PLACEHOLDER;
}
