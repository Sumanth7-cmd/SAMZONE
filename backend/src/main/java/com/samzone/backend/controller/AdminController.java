package com.samzone.backend.controller;

import com.samzone.backend.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
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
}
