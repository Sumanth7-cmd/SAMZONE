package com.samzone.backend.service;

import java.util.List;
import java.util.Map;

/**
 * Shared per-category image pools so products within the same category don't
 * all render the exact same photo. Selection is a deterministic hash of the
 * product name, so re-running an import yields the same image per product.
 */
public final class CategoryImages {

    private static final List<String> DEFAULT_IMAGES = List.of(
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop");

    private static final Map<String, List<String>> IMAGE_MAP = Map.ofEntries(
            Map.entry("Men's Clothing", List.of(
                    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&h=400&fit=crop")),
            Map.entry("Women's Clothing", List.of(
                    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop")),
            Map.entry("Laptops", List.of(
                    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop")),
            Map.entry("Mobiles", List.of(
                    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1592899677977-9c10002761ba?w=400&h=400&fit=crop")),
            Map.entry("Men's Footwear", List.of(
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop")),
            Map.entry("Shoes", List.of(
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop")),
            Map.entry("Cameras", List.of(
                    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&h=400&fit=crop")),
            Map.entry("Toys", List.of(
                    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop")),
            Map.entry("Movies", List.of(
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop")),
            Map.entry("Car Accessories", List.of(
                    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop")),
            Map.entry("Accessories", List.of(
                    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1524498250077-390f9e378fc0?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop")),
            Map.entry("Kids", List.of(
                    "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop")));

    private CategoryImages() {
    }

    public static String getCategoryImage(String category, String name) {
        List<String> images = category != null ? IMAGE_MAP.getOrDefault(category, DEFAULT_IMAGES) : DEFAULT_IMAGES;
        int index = Math.abs((name != null ? name : "").hashCode()) % images.size();
        return images.get(index);
    }
}
