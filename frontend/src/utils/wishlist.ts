import { showToast } from './notifications';

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
    const unique = Array.from(new Set(ids));
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(unique));
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
        showToast('Removed from wishlist', 'info');
        return false;
    }
    ids.push(id);
    saveWishlist(ids);
    showToast('Added to wishlist', 'success');
    return true;
}

export function moveWishlistItemToCart(id: number) {
    const ids = getWishlist().filter((itemId) => itemId !== id);
    saveWishlist(ids);
    window.dispatchEvent(new Event(WISHLIST_EVENT));
    return ids;
}

export function getWishlistCount(): number {
    return getWishlist().length;
}
