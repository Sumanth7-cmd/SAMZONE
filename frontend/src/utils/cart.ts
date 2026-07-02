export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    size?: string;
    color?: string;
    stock?: number;
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
        existing.quantity += quantity;
    } else {
        items.push({ ...item, quantity });
    }
    saveCart(items);
}

export function getCartCount(): number {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}
