import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Product } from '../services/api';

const MAX_COMPARE = 3;

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
    const [compareItems, setCompareItems] = useState<Product[]>([]);

    const toggleCompare = useCallback((product: Product) => {
        setCompareItems((prev) => {
            const exists = prev.some((p) => p.id === product.id);
            if (exists) return prev.filter((p) => p.id !== product.id);
            if (prev.length >= MAX_COMPARE) return prev;
            return [...prev, product];
        });
    }, []);

    const isComparing = useCallback(
        (id: number) => compareItems.some((p) => p.id === id),
        [compareItems]
    );

    const clearCompare = useCallback(() => setCompareItems([]), []);

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
