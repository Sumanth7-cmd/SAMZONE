package com.samzone.backend.controller;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import com.samzone.backend.service.CategoryImages;
import com.samzone.backend.service.FashionCatalogSeeder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
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

    // A product name is "corrupted" if it's mostly non-ASCII (garbled script),
    // starts with the literal "[?????]" pattern, or has a run of 3+ '?' anywhere
    // (catches embedded corruption like "ecco(???) Men's Golf Shoe" or
    // "Lowepro ?????? ???????? ?????????????", not just prefix-anchored cases).
    // These come from source listings (Amazon JP/Arabic-locale scrapes) whose
    // original script (Japanese/Arabic) was already lossily replaced with
    // literal '?' before this data ever reached our CSVs - unrecoverable, so
    // cleanup-corrupted deletes rather than attempting to re-decode them.
    private static final String CORRUPTED_NAME_PREDICATE =
            "(name ~ '^\\[?\\?+' OR name ~ '\\?{3,}' OR " +
            "length(regexp_replace(name, '[^\\x20-\\x7E]', '', 'g')) < length(name) * 0.7)";

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private FashionCatalogSeeder fashionCatalogSeeder;

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/seed-fashion")
    public ResponseEntity<Map<String, Object>> seedFashion() {
        int inserted = fashionCatalogSeeder.seed();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("insertedCount", inserted);
        return ResponseEntity.ok(result);
    }

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

    // findAll(PageRequest) paginates via OFFSET, which gets slower every page
    // over the full 80k+ row table (O(n^2) overall) and was blowing past
    // Railway's ~5 minute gateway timeout before finishing. Instead, find
    // only the (much smaller) set of ids that actually need fixing with one
    // lean query, then fetch/update those by id - no OFFSET scan at all.
    //
    // Note: this only targets genuinely missing/placeholder images, not a
    // blacklist of specific "stale" URLs. CategoryImages.getCategoryImage
    // is a deterministic hash of the product name, so re-running it against
    // an unchanged name always reassigns the exact same pool entry - a URL
    // that's simply index 0 of a 4-image pool would get flagged and
    // "fixed" back to itself forever, never converging.
    @SuppressWarnings("unchecked")
    @PostMapping("/backfill-images")
    @Transactional
    public ResponseEntity<Map<String, Object>> backfillImages() {
        List<Object> rawIds = entityManager.createNativeQuery(
                "SELECT p.id FROM products p WHERE NOT EXISTS ("
                        + "SELECT 1 FROM product_images pi WHERE pi.product_id = p.id"
                        + ") OR EXISTS ("
                        + "SELECT 1 FROM product_images pi WHERE pi.product_id = p.id "
                        + "AND (pi.image_url IS NULL OR pi.image_url = '' "
                        + "OR pi.image_url LIKE '%placehold%')"
                        + ")")
                .getResultList();

        List<Long> ids = new ArrayList<>();
        for (Object id : rawIds) {
            ids.add(((Number) id).longValue());
        }

        int updated = 0;
        for (int i = 0; i < ids.size(); i += 500) {
            List<Long> chunk = ids.subList(i, Math.min(i + 500, ids.size()));
            List<Product> products = productRepository.findAllById(chunk);
            for (Product product : products) {
                product.setImages(new ArrayList<>(List.of(
                        CategoryImages.getCategoryImage(product.getCategory(), product.getName()))));
            }
            productRepository.saveAll(products);
            updated += products.size();
            entityManager.flush();
            entityManager.clear();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updatedCount", updated);
        result.put("candidatesFound", ids.size());
        return ResponseEntity.ok(result);
    }
}
