package com.samzone.backend.service;

import java.util.List;
import java.util.Locale;
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

    // Garment-type-specific pools for the Task 3 fashion catalog (suits,
    // sarees, hoodies, etc.) so e.g. a sherwani doesn't draw from the same
    // generic 4-photo "Men's Clothing" pool as a t-shirt.
    private static final Map<String, List<String>> TYPE_IMAGE_MAP = Map.ofEntries(
            Map.entry("suit", List.of(
                    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=400&h=400&fit=crop")),
            Map.entry("hoodie", List.of(
                    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=400&h=400&fit=crop")),
            Map.entry("ethnic", List.of(
                    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=400&fit=crop")),
            Map.entry("saree", List.of(
                    "https://images.unsplash.com/photo-1610030469668-8e9f641aaf27?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1583391733981-8498408ee50c?w=400&h=400&fit=crop")),
            Map.entry("tshirt", List.of(
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop")),
            Map.entry("dress", List.of(
                    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
                    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop")));

    // Maps each fashion garment "type" (as generated by FashionCatalogSeeder)
    // to one of the pools above. Anything not listed here (shirts, jeans,
    // trousers, etc.) falls back to the existing category-level pool.
    private static final Map<String, String> GARMENT_TYPE_BUCKET = Map.ofEntries(
            Map.entry("formal suit", "suit"),
            Map.entry("sherwani", "suit"),
            Map.entry("nehru jacket", "suit"),
            Map.entry("blazer", "suit"),
            Map.entry("hoodie", "hoodie"),
            Map.entry("sweatshirt", "hoodie"),
            Map.entry("kurta", "ethnic"),
            Map.entry("kurti", "ethnic"),
            Map.entry("anarkali", "ethnic"),
            Map.entry("salwar suit", "ethnic"),
            Map.entry("saree", "saree"),
            Map.entry("lehenga", "saree"),
            Map.entry("t-shirt", "tshirt"),
            Map.entry("top", "tshirt"),
            Map.entry("dress", "dress"),
            Map.entry("gown", "dress"));

    private CategoryImages() {
    }

    public static String getCategoryImage(String category, String name) {
        List<String> images = category != null ? IMAGE_MAP.getOrDefault(category, DEFAULT_IMAGES) : DEFAULT_IMAGES;
        int index = Math.abs((name != null ? name : "").hashCode()) % images.size();
        return images.get(index);
    }

    public static String getImageForGarmentType(String garmentType, String category, String name) {
        if (garmentType != null) {
            String bucket = GARMENT_TYPE_BUCKET.get(garmentType.toLowerCase(Locale.ROOT));
            List<String> pool = bucket != null ? TYPE_IMAGE_MAP.get(bucket) : null;
            if (pool != null && !pool.isEmpty()) {
                int index = Math.abs((name != null ? name : "").hashCode()) % pool.size();
                return pool.get(index);
            }
        }
        return getCategoryImage(category, name);
    }
}
