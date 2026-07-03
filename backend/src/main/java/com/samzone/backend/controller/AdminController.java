package com.samzone.backend.controller;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import com.samzone.backend.service.CategoryImages;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // A product name is "corrupted" if it's mostly non-ASCII (garbled script
    // from the Myntra import) or starts with the literal "[?????]" pattern.
    private static final String CORRUPTED_NAME_PREDICATE =
            "(name ~ '^\\[?\\?+' OR " +
            "length(regexp_replace(name, '[^\\x20-\\x7E]', '', 'g')) < length(name) * 0.7)";

    @Autowired
    private ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        long total = 0;
        for (Object[] row : productRepository.countProductsByCategory()) {
            String category = (String) row[0];
            long count = (Long) row[1];
            categoryCounts.put(category, count);
            total += count;
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProducts", total);
        stats.put("totalCategories", categoryCounts.size());
        stats.put("categoryCounts", categoryCounts);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/cleanup-corrupted")
    @Transactional
    public ResponseEntity<Map<String, Object>> cleanupCorrupted() {
        // Child element-collection tables carry a product_id FK with no cascade,
        // so their rows must go first or the products delete violates the FK.
        entityManager.createNativeQuery(
                "DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE "
                        + CORRUPTED_NAME_PREDICATE + ")").executeUpdate();
        entityManager.createNativeQuery(
                "DELETE FROM product_sizes WHERE product_id IN (SELECT id FROM products WHERE "
                        + CORRUPTED_NAME_PREDICATE + ")").executeUpdate();
        entityManager.createNativeQuery(
                "DELETE FROM product_colors WHERE product_id IN (SELECT id FROM products WHERE "
                        + CORRUPTED_NAME_PREDICATE + ")").executeUpdate();

        int deleted = entityManager.createNativeQuery(
                "DELETE FROM products WHERE " + CORRUPTED_NAME_PREDICATE).executeUpdate();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deletedCount", deleted);
        return ResponseEntity.ok(result);
    }

    // Duplicate rows share (name, brand) case-insensitively; keep the lowest
    // id of each group and drop the rest.
    private static final String DUPLICATE_ID_SUBQUERY =
            "SELECT p1.id FROM products p1 JOIN products p2 ON "
                    + "LOWER(p1.name) = LOWER(p2.name) AND "
                    + "LOWER(COALESCE(p1.brand,'')) = LOWER(COALESCE(p2.brand,'')) "
                    + "WHERE p1.id > p2.id";

    @PostMapping("/dedup")
    @Transactional
    public ResponseEntity<Map<String, Object>> dedup() {
        entityManager.createNativeQuery(
                "DELETE FROM product_images WHERE product_id IN (" + DUPLICATE_ID_SUBQUERY + ")").executeUpdate();
        entityManager.createNativeQuery(
                "DELETE FROM product_sizes WHERE product_id IN (" + DUPLICATE_ID_SUBQUERY + ")").executeUpdate();
        entityManager.createNativeQuery(
                "DELETE FROM product_colors WHERE product_id IN (" + DUPLICATE_ID_SUBQUERY + ")").executeUpdate();

        int deleted = entityManager.createNativeQuery(
                "DELETE FROM products p1 USING products p2 WHERE p1.id > p2.id "
                        + "AND LOWER(p1.name) = LOWER(p2.name) "
                        + "AND LOWER(COALESCE(p1.brand,'')) = LOWER(COALESCE(p2.brand,''))").executeUpdate();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deletedCount", deleted);
        return ResponseEntity.ok(result);
    }

    // Myntra rows carry an external_id (Amazon imports don't), and their
    // prices were stored in raw INR while the frontend multiplies every
    // product's price by ~83 for INR display (correct for the USD-priced
    // Amazon catalog, wrong for Myntra's). The price > 50 guard means a
    // second run is a no-op instead of dividing an already-fixed row again.
    @PostMapping("/fix-myntra-prices")
    @Transactional
    public ResponseEntity<Map<String, Object>> fixMyntraPrices() {
        int updated = entityManager.createNativeQuery(
                "UPDATE products SET price = price / 83.0 WHERE external_id IS NOT NULL AND price > 50")
                .executeUpdate();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updatedCount", updated);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/fix-zero-prices")
    @Transactional
    public ResponseEntity<Map<String, Object>> fixZeroPrices() {
        int updated = entityManager.createNativeQuery(
                "UPDATE products SET price = 9.99 WHERE price IS NULL OR price <= 0")
                .executeUpdate();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updatedCount", updated);
        return ResponseEntity.ok(result);
    }

    // Stale single-image URLs from when Accessories/Kids each had only one
    // photo in their CategoryImages pool (see BUG 4) - anything still on one
    // of these needs to be re-rotated across the now-expanded pools.
    private static final List<String> STALE_SINGLE_IMAGE_URLS = List.of(
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=400&fit=crop");

    @PostMapping("/backfill-images")
    @Transactional
    public ResponseEntity<Map<String, Object>> backfillImages() {
        int updated = 0;
        int page = 0;
        Page<Product> batch;
        do {
            batch = productRepository.findAll(PageRequest.of(page, 500));
            List<Product> toSave = new ArrayList<>();
            for (Product product : batch.getContent()) {
                List<String> images = product.getImages();
                String currentImage = images != null && !images.isEmpty() ? images.get(0) : null;
                boolean needsFix = currentImage == null
                        || currentImage.isBlank()
                        || currentImage.contains("placehold")
                        || STALE_SINGLE_IMAGE_URLS.contains(currentImage);
                if (needsFix) {
                    product.setImages(new ArrayList<>(List.of(
                            CategoryImages.getCategoryImage(product.getCategory(), product.getName()))));
                    toSave.add(product);
                }
            }
            if (!toSave.isEmpty()) {
                productRepository.saveAll(toSave);
                updated += toSave.size();
            }
            entityManager.flush();
            entityManager.clear();
            page++;
        } while (batch.hasNext());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updatedCount", updated);
        return ResponseEntity.ok(result);
    }
}
