package com.samzone.backend.controller;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import com.samzone.backend.service.CategoryImages;
import com.samzone.backend.service.ProductSeeder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final int IMAGE_REFRESH_BATCH_SIZE = 500;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSeeder productSeeder;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> result;
        if (category != null || minPrice != null || maxPrice != null || minRating != null) {
            result = productRepository.findByFilters(category, minPrice, maxPrice, minRating, pageable);
        } else {
            result = productRepository.findAll(pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getProductCount() {
        return ResponseEntity.ok(productRepository.count());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("rating").descending());
        Page<Product> result = productRepository.searchProducts(q, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = productRepository.findAllCategories();
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedProducts() {
        productSeeder.seedProducts();
        return ResponseEntity.ok("Products seeded successfully!");
    }

    @PostMapping("/refresh-images")
    @Transactional
    public ResponseEntity<String> refreshImages() {
        int updated = 0;
        int page = 0;
        Page<Product> batch;
        do {
            batch = productRepository.findAll(PageRequest.of(page, IMAGE_REFRESH_BATCH_SIZE));
            for (Product product : batch.getContent()) {
                product.setImages(new ArrayList<>(List.of(
                        CategoryImages.getCategoryImage(product.getCategory(), product.getName()))));
            }
            productRepository.saveAll(batch.getContent());
            entityManager.flush();
            entityManager.clear();
            updated += batch.getNumberOfElements();
            page++;
        } while (batch.hasNext());

        return ResponseEntity.ok("Refreshed images for " + updated + " products");
    }
}
