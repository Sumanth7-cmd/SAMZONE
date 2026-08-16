export const PLACEHOLDER = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';

export function normalizeImageUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') return PLACEHOLDER;
    let cleaned = url.trim();

    // Loop up to 3 times to unwrap nested JSON string arrays / double-encoded strings
    for (let i = 0; i < 3; i++) {
        if (cleaned.startsWith('[') || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
            try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    cleaned = String(parsed[0]).trim();
                } else if (typeof parsed === 'string') {
                    cleaned = parsed.trim();
                }
            } catch {
                break;
            }
        }
    }

    // Strip remaining brackets and quotes
    cleaned = cleaned.replace(/^\[["']?|["']?\]$/g, '').replace(/^["']|["']$/g, '').replace(/\\"/g, '"').trim();

    // Handle pipe-separated URLs if any remain
    if (cleaned.includes('|')) {
        cleaned = cleaned.split('|')[0].trim();
    }

    if (!cleaned) return PLACEHOLDER;

    // Reject known placeholder or dead domain services
    if (
        cleaned.includes('picsum.photos') ||
        cleaned.includes('placeholder.com') ||
        cleaned.includes('via.placeholder') ||
        cleaned.includes('dummyimage.com')
    ) {
        return PLACEHOLDER;
    }

    // Upgrade all HTTP URLs to HTTPS
    if (cleaned.startsWith('http://')) {
        cleaned = cleaned.replace(/^http:\/\//i, 'https://');
    }

    // Must be valid HTTPS or data URI
    if (!cleaned.startsWith('https://') && !cleaned.startsWith('data:image/')) {
        return PLACEHOLDER;
    }

    // Rewrite legacy Flipkart CDN subdomains -> stable rukminim2 with HTTPS
    if (cleaned.includes('flixcart.com')) {
        cleaned = cleaned.replace(
            /https?:\/\/(img\d*a|rukminim1)\.flixcart\.com/i,
            'https://rukminim2.flixcart.com'
        );
    }

    return cleaned;
}

export function getProductImage(
    product: { image?: string | null; imageUrl?: string | null; image_url?: string | null; images?: Array<string | null | undefined> | null } | null | undefined
): string {
    const candidates = [
        product?.images?.[0],
        product?.image,
        product?.imageUrl,
        product?.image_url,
        ...(product?.images?.slice(1) || []),
    ];

    for (const raw of candidates) {
        const normalized = normalizeImageUrl(raw);
        if (normalized && normalized !== PLACEHOLDER) {
            return normalized;
        }
    }

    return PLACEHOLDER;
}

