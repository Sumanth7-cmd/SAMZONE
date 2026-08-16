import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Product } from '../services/api';
import { showToast } from '../utils/notifications';

const MAX_COMPARE = 3;
const COMPARE_KEY = 'compare';

function getCompareFromStorage(): Product[] {
    try {
        const raw = localStorage.getItem(COMPARE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCompareToStorage(items: Product[]) {
    try {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
    } catch {
        // ignore write failures
    }
}

interface CompareContextValue {
    compareItems: Product[];
    toggleCompare: (product: Product) => void;
    isComparing: (id: number) => boolean;
    clearCompare: () => void;
    canAddMore: boolean;
    maxCompare: number;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [compareItems, setCompareItems] = useState<Product[]>(() => getCompareFromStorage());

    const toggleCompare = useCallback((product: Product) => {
        setCompareItems((prev) => {
            const exists = prev.some((p) => p.id === product.id);
            if (exists) {
                const next = prev.filter((p) => p.id !== product.id);
                saveCompareToStorage(next);
                showToast('Removed from comparison', 'info');
                return next;
            }
            if (prev.length >= MAX_COMPARE) {
                showToast(`You can compare up to ${MAX_COMPARE} products`, 'warning');
                return prev;
            }
            const next = [...prev, product];
            saveCompareToStorage(next);
            showToast('Added to comparison', 'success');
            return next;
        });
    }, []);

    const isComparing = useCallback(
        (id: number) => compareItems.some((p) => p.id === id),
        [compareItems]
    );

    const clearCompare = useCallback(() => {
        saveCompareToStorage([]);
        setCompareItems([]);
    }, []);

    return (
        <CompareContext.Provider
            value={{
                compareItems,
                toggleCompare,
                isComparing,
                clearCompare,
                canAddMore: compareItems.length < MAX_COMPARE,
                maxCompare: MAX_COMPARE,
            }}
        >
            {children}
        </CompareContext.Provider>
    );
};

export function useCompare(): CompareContextValue {
    const ctx = useContext(CompareContext);
    if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
    return ctx;
}
