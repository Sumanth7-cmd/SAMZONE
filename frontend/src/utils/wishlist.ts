const WISHLIST_KEY = 'wishlist';
export const WISHLIST_EVENT = 'samzone-wishlist-updated';

export function getWishlist(): number[] {
    try {
        const raw = localStorage.getItem(WISHLIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveWishlist(ids: number[]) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function isWishlisted(id: number): boolean {
    return getWishlist().includes(id);
}

export function toggleWishlist(id: number): boolean {
    const ids = getWishlist();
    const index = ids.indexOf(id);
    if (index >= 0) {
        ids.splice(index, 1);
        saveWishlist(ids);
        return false;
    }
    ids.push(id);
    saveWishlist(ids);
    return true;
}

export function getWishlistCount(): number {
    return getWishlist().length;
}
