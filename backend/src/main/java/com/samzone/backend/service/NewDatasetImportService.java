package com.samzone.backend.service;

import com.samzone.backend.entity.Brand;
import com.samzone.backend.entity.Category;
import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class NewDatasetImportService {
    private static final Logger log = LoggerFactory.getLogger(NewDatasetImportService.class);

    @Autowired
    private ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public int importFromFiles(Path categoriesPath, Path productsPath, int limit) {
        Map<String, Category> categoriesByName = new HashMap<>();
        List<Category> categories = loadCategories(categoriesPath);
        for (Category category : categories) {
            categoriesByName.put(category.getName().toLowerCase(), category);
        }

        Map<String, Brand> brandsByName = new HashMap<>();
        List<Brand> brands = new ArrayList<>();
        List<Product> products = new ArrayList<>();
        int inserted = 0;

        try (CSVParser parser = CSVParser.parse(Files.newBufferedReader(productsPath, StandardCharsets.UTF_8), CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreSurroundingSpaces(true))) {
            for (CSVRecord row : parser) {
                if (limit > 0 && inserted >= limit) {
                    break;
                }
                String title = row.get("title");
                if (title == null || title.isBlank()) {
                    continue;
                }
                String categoryName = resolveCategoryName(row, categoriesByName);
                String brandName = resolveBrandName(title);
                Brand brand = brandsByName.computeIfAbsent(brandName.toLowerCase(), ignored -> {
                    Brand created = new Brand();
                    created.setName(brandName);
                    created.setSlug(brandName.toLowerCase().replaceAll("[^a-z0-9]+", "-"));
                    brands.add(created);
                    return created;
                });
                Category category = categoriesByName.computeIfAbsent(categoryName.toLowerCase(), ignored -> {
                    Category created = new Category();
                    created.setName(categoryName);
                    created.setSlug(categoryName.toLowerCase().replaceAll("[^a-z0-9]+", "-"));
                    categories.add(created);
                    return created;
                });

                Product product = new Product();
                product.setExternalId(row.get("asin"));
                product.setName(title);
                product.setBrand(brandName);
                product.setCategory(categoryName);
                product.setPrice(parsePrice(row.get("price")));
                product.setDiscount(computeDiscount(row));
                product.setRating(parseStars(row.get("stars")));
                product.setStock(Math.max(1, parseInt(row.get("boughtInLastMonth")) / 100));
                product.setImages(List.of(row.get("imgUrl")));
                product.setColors(List.of("Black", "White", "Blue"));
                product.setSizes(List.of("One Size"));
                product.setDescription(buildDescription(title, brandName, categoryName));
                product.setSpecifications(buildSpecifications(row));
                products.add(product);
                inserted++;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to import new dataset", e);
        }

        if (!categories.isEmpty()) {
            entityManager.persist(categories.get(0));
        }

        productRepository.saveAll(products);
        entityManager.flush();
        return inserted;
    }

    private List<Category> loadCategories(Path categoriesPath) {
        if (categoriesPath == null || !Files.exists(categoriesPath)) {
            return new ArrayList<>();
        }
        try (CSVParser parser = CSVParser.parse(Files.newBufferedReader(categoriesPath, StandardCharsets.UTF_8), CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreSurroundingSpaces(true))) {
            List<Category> categories = new ArrayList<>();
            for (CSVRecord row : parser) {
                Category category = new Category();
                category.setName(row.get("category_name"));
                category.setSlug(row.get("category_name").toLowerCase().replaceAll("[^a-z0-9]+", "-"));
                categories.add(category);
            }
            return categories;
        } catch (IOException e) {
            throw new RuntimeException("Failed to load categories", e);
        }
    }

    private String resolveCategoryName(CSVRecord row, Map<String, Category> categoriesByName) {
        String fallback = "General";
        String categoryId = row.get("category_id");
        if (categoryId == null || categoryId.isBlank()) {
            return fallback;
        }
        return categoriesByName.values().stream()
            .findFirst()
            .map(Category::getName)
            .orElse(fallback);
    }

    private String resolveBrandName(String title) {
        String trimmed = title == null ? "" : title.trim();
        if (trimmed.isBlank()) return "Generic";
        String[] tokens = trimmed.split("\\s+");
        return tokens.length > 0 ? tokens[0] : "Generic";
    }

    private Double parsePrice(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(raw.replaceAll("[^0-9.-]", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private Double computeDiscount(CSVRecord row) {
        double price = parsePrice(row.get("price"));
        double listPrice = parsePrice(row.get("listPrice"));
        if (listPrice > price && listPrice > 0) {
            return Math.round(((listPrice - price) / listPrice) * 100.0 * 10.0) / 10.0;
        }
        return 0.0;
    }

    private Double parseStars(String raw) {
        if (raw == null || raw.isBlank()) return 0.0;
        try {
            return Double.parseDouble(raw);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private Integer parseInt(String raw) {
        if (raw == null || raw.isBlank()) return 0;
        try {
            return Integer.parseInt(raw.replaceAll("[^0-9-]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private String buildDescription(String title, String brandName, String categoryName) {
        return String.format("%s by %s in %s.", title, brandName, categoryName);
    }

    private String buildSpecifications(CSVRecord row) {
        return String.format("ASIN: %s | Best Seller: %s | Bought Last Month: %s",
            row.get("asin"), row.get("isBestSeller"), row.get("boughtInLastMonth"));
    }
}
