import { showToast } from './notifications';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    size?: string;
    color?: string;
    stock?: number;
    originalPrice?: number;
    discount?: number;
}

const CART_KEY = 'cart';
export const CART_EVENT = 'samzone-cart-updated';

export function getCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    const items = getCart();
    const existing = items.find(
        (i) => i.id === item.id && i.size === item.size && i.color === item.color
    );

    if (existing) {
        const nextQuantity = existing.quantity + quantity;
        const safeLimit = item.stock != null ? Math.max(1, item.stock) : 999;
        existing.quantity = Math.min(nextQuantity, safeLimit);
        showToast(`${item.name} quantity updated`, 'success');
    } else {
        items.push({ ...item, quantity });
        showToast(`${item.name} added to cart`, 'success');
    }

    saveCart(items);
    return getCart();
}

export function updateCartItem(id: number, size: string | undefined, color: string | undefined, quantity: number) {
    const items = getCart().map((item) => {
        if (item.id !== id || item.size !== size || item.color !== color) return item;
        const safeLimit = item.stock != null ? Math.max(1, item.stock) : 999;
        return { ...item, quantity: Math.max(1, Math.min(quantity, safeLimit)) };
    });
    saveCart(items);
    return items;
}

export function removeFromCart(id: number, size?: string, color?: string) {
    const items = getCart().filter((item) => !(item.id === id && item.size === size && item.color === color));
    saveCart(items);
    return items;
}

export function clearCart() {
    saveCart([]);
    return [];
}

export function getCartCount(): number {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(): number {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getEstimatedShipping(subtotal: number): number {
    return subtotal > 1000 ? 0 : 50;
}

export function getCartSummary() {
    const items = getCart();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = getEstimatedShipping(subtotal);
    return { items, subtotal, shipping, total: subtotal + shipping };
}
