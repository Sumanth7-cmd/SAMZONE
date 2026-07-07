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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final int IMAGE_REFRESH_BATCH_SIZE = 500;

    private static final List<String> FASHION_CATEGORIES = List.of(
            "Men's Clothing", "Women's Clothing", "Men's Footwear", "Shoes");

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
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String searchTerm = (search == null || search.isBlank()) ? null : search;

        Page<Product> result;
        if (category != null || brand != null || searchTerm != null || minPrice != null || maxPrice != null || minRating != null) {
            result = productRepository.findByFilters(category, brand, searchTerm, minPrice, maxPrice, minRating, pageable);
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

    @GetMapping("/brands")
    public ResponseEntity<List<String>> getBrands() {
        List<String> brands = productRepository.findAllBrands();
        return ResponseEntity.ok(brands);
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedProducts() {
        productSeeder.seedProducts();
        return ResponseEntity.ok("Products seeded successfully!");
    }

    // Top-rated clothing/footwear with a real image, capped at 10. Overfetch
    // 40 candidates by rating since some may lack images, then trim.
    @GetMapping("/bestsellers")
    public ResponseEntity<List<Product>> getBestsellers() {
        List<Product> candidates = productRepository.findTopRatedByCategories(
                FASHION_CATEGORIES, PageRequest.of(0, 40, Sort.by("rating").descending()));

        List<Product> withImages = candidates.stream()
                .filter(p -> p.getImages() != null && !p.getImages().isEmpty()
                        && p.getImages().get(0) != null && !p.getImages().get(0).isBlank())
                .limit(10)
                .collect(Collectors.toList());

        return ResponseEntity.ok(withImages);
    }

    // DB discount is mostly 0, so this generates a deterministic display
    // discount from the product id instead of persisting a fake discount.
    @GetMapping("/deals")
    public ResponseEntity<List<Map<String, Object>>> getDeals() {
        List<Product> candidates = productRepository.findRandomByCategories(FASHION_CATEGORIES, 10);

        List<Map<String, Object>> deals = candidates.stream().map(p -> {
            int discount = 10 + (int) (p.getId() % 4) * 10;
            double originalPrice = p.getPrice() / (1 - discount / 100.0);

            Map<String, Object> deal = new LinkedHashMap<>();
            deal.put("id", p.getId());
            deal.put("name", p.getName());
            deal.put("brand", p.getBrand());
            deal.put("category", p.getCategory());
            deal.put("price", p.getPrice());
            deal.put("originalPrice", originalPrice);
            deal.put("discount", discount);
            deal.put("rating", p.getRating());
            deal.put("images", p.getImages());
            deal.put("colors", p.getColors());
            deal.put("sizes", p.getSizes());
            deal.put("stock", p.getStock());
            deal.put("description", p.getDescription());
            return deal;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(deals);
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
