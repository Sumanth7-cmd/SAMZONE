// Generic fashion placeholder – used only when no real image is available at all.
export const PLACEHOLDER = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';

export function normalizeImageUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') return '';
    let cleaned = url.trim();

    // Strip surrounding JSON array syntax e.g. ["url"] or ['url']
    if (cleaned.startsWith('[')) {
        try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                cleaned = parsed[0].trim();
            }
        } catch {
            // Remove leading/trailing brackets and quotes best-effort
            cleaned = cleaned.replace(/^\[["']?|["']?\]$/g, '').trim();
        }
    }

    // Strip surrounding quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '').replace(/\\"/g, '"').trim();

    if (!cleaned) return '';

    // Only accept real HTTP/HTTPS or data URIs
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://') && !cleaned.startsWith('data:image/')) {
        return '';
    }

    // Reject known placeholder/random image services – they are not real product images
    if (
        cleaned.includes('picsum.photos') ||
        cleaned.includes('placeholder.com') ||
        cleaned.includes('via.placeholder') ||
        cleaned.includes('dummyimage.com')
    ) {
        return '';
    }

    // Rewrite ALL old Flipkart CDN subdomains → stable rukminim2 with HTTPS
    // Covers: img1a, img2a, img3a … img9a, img10a, img5a, img6a, rukminim1, etc.
    if (cleaned.includes('flixcart.com')) {
        cleaned = cleaned.replace(/^http:\/\//i, 'https://');
        cleaned = cleaned.replace(
            /https?:\/\/(img\d*a|rukminim1)\.flixcart\.com/i,
            'https://rukminim2.flixcart.com'
        );
    }

    return cleaned;
}

export function getProductImage(
    product: { image?: string | null; imageUrl?: string | null; images?: Array<string | null | undefined> | null } | null | undefined
): string {
    const candidates = [
        product?.images?.[0],
        product?.image,
        product?.imageUrl,
        ...(product?.images?.slice(1) || []),
    ];

    for (const raw of candidates) {
        const normalized = normalizeImageUrl(raw);
        if (normalized) {
            return normalized;
        }
    }

    return PLACEHOLDER;
}

