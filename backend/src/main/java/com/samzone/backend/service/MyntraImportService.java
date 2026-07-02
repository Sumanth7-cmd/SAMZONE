package com.samzone.backend.service;

import com.samzone.backend.dto.ImportResult;
import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class MyntraImportService {

    private static final Logger log = LoggerFactory.getLogger(MyntraImportService.class);
    private static final int BATCH_SIZE = 100;

    @Autowired
    private ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public ImportResult importMyntra() {
        return importMyntra("Data/myntra_products_catalog.csv");
    }

    @Transactional
    public ImportResult importMyntra(String filePath) {
        ImportResult result = new ImportResult();
        result.setExistingCountBefore(productRepository.count());

        int read = 0;
        int inserted = 0;
        int skippedDuplicate = 0;
        int skippedInvalid = 0;
        List<Product> batch = new ArrayList<>();

        try (
                Reader reader = new InputStreamReader(openCsv(filePath), StandardCharsets.UTF_8);
                CSVParser parser = CSVFormat.DEFAULT
                        .builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .setTrim(true)
                        .setIgnoreEmptyLines(true)
                        .build()
                        .parse(reader)
        ) {
            for (CSVRecord row : parser) {
                read++;
                try {
                    String productId = safeGet(row, "ProductID");
                    String name = safeGet(row, "ProductName");
                    String brand = safeGet(row, "ProductBrand");
                    String gender = safeGet(row, "Gender");
                    String priceRaw = safeGet(row, "Price (INR)");
                    String description = safeGet(row, "Description");
                    String color = safeGet(row, "PrimaryColor");

                    if (name == null || name.isBlank()) {
                        skippedInvalid++;
                        continue;
                    }

                    name = cleanName(name);
                    if (brand == null || brand.isBlank()) {
                        brand = extractBrand(name);
                    }

                    Double price = parsePrice(priceRaw);
                    boolean isDuplicate = false;

                    if (productId != null && !productId.isBlank()) {
                        isDuplicate = productRepository.existsByExternalId(productId);
                    }

                    if (!isDuplicate && brand != null && !brand.isBlank()) {
                        isDuplicate = productRepository.existsByNameIgnoreCaseAndBrandIgnoreCase(name, brand);
                    }

                    if (!isDuplicate) {
                        isDuplicate = productRepository.existsByNameIgnoreCaseAndPrice(name, price);
                    }

                    if (isDuplicate) {
                        skippedDuplicate++;
                        continue;
                    }

                    Product product = new Product();
                    product.setExternalId(productId);
                    product.setName(name);
                    product.setBrand(brand != null ? brand : "Generic");
                    String category = mapCategory(gender);
                    product.setCategory(category);
                    product.setPrice(price);
                    product.setDiscount(0.0);
                    product.setRating(4.0);
                    product.setStock(100);
                    product.setDescription(description != null ? description : name);
                    product.setSpecifications(null);

                    String imageUrl = CategoryImages.getCategoryImage(category, name);
                    product.setImages(List.of(imageUrl));

                    if (color != null && !color.isBlank() && !color.equalsIgnoreCase("null")) {
                        product.setColors(List.of(color));
                    } else {
                        product.setColors(List.of("Black", "White"));
                    }

                    List<String> sizes = getDefaultSizes(category);
                    product.setSizes(sizes.isEmpty() ? List.of("One Size") : sizes);

                    batch.add(product);

                    if (batch.size() >= BATCH_SIZE) {
                        productRepository.saveAllAndFlush(batch);
                        inserted += batch.size();
                        batch.clear();
                        clearPersistenceContext();
                        log.info("Myntra import progress: {} inserted so far", inserted);
                    }
                } catch (Exception rowEx) {
                    log.warn("Skipping Myntra row {}: {}", read, rowEx.getMessage());
                    skippedInvalid++;
                }
            }

            if (!batch.isEmpty()) {
                productRepository.saveAllAndFlush(batch);
                inserted += batch.size();
                clearPersistenceContext();
            }
        } catch (Exception e) {
            log.error("Myntra import failed: ", e);
            result.setStatus("FAILED: " + e.getMessage());
            return result;
        }

        result.setTotalRead(read);
        result.setInserted(inserted);
        result.setSkippedDuplicate(skippedDuplicate);
        result.setSkippedInvalid(skippedInvalid);
        result.setFinalDatabaseCount(productRepository.count());
        result.setStatus("SUCCESS");

        log.info("Myntra import complete: read={} inserted={} dupSkipped={} invalidSkipped={} finalCount={}",
                read, inserted, skippedDuplicate, skippedInvalid, result.getFinalDatabaseCount());
        return result;
    }

    private void clearPersistenceContext() {
        if (entityManager != null) {
            entityManager.clear();
        }
    }

    private InputStream openCsv(String filePath) throws Exception {
        Resource resource = new ClassPathResource(filePath);
        if (resource.exists()) {
            log.info("Loading Myntra CSV from classpath: {}", filePath);
            return resource.getInputStream();
        }
        log.info("Loading Myntra CSV from filesystem: {}", filePath);
        return new FileInputStream(filePath);
    }

    private String safeGet(CSVRecord row, String col) {
        try {
            String value = row.get(col);
            if (value == null || value.isBlank() || value.equalsIgnoreCase("null")) {
                return null;
            }
            return value.trim();
        } catch (Exception e) {
            return null;
        }
    }

    private String cleanName(String raw) {
        if (raw == null) {
            return "Unknown Product";
        }
        return raw.replaceAll("^\"+", "")
                .replaceAll("\"+$", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String extractBrand(String name) {
        if (name == null || name.isBlank()) {
            return "Generic";
        }
        String[] words = name.trim().split("\\s+");
        return words.length > 0 ? words[0] : "Generic";
    }

    private Double parsePrice(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(raw.replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String mapCategory(String gender) {
        if (gender == null) {
            return "Men's Clothing";
        }
        switch (gender.toLowerCase()) {
            case "men":
            case "male":
                return "Men's Clothing";
            case "women":
            case "female":
                return "Women's Clothing";
            case "boys":
            case "girls":
                return "Kids";
            case "unisex":
                return "Accessories";
            default:
                return "Men's Clothing";
        }
    }

    private List<String> getDefaultSizes(String category) {
        if ("Men's Clothing".equals(category) || "Women's Clothing".equals(category)) {
            return List.of("XS", "S", "M", "L", "XL", "XXL");
        }
        if ("Kids".equals(category)) {
            return List.of("XS", "S", "M", "L");
        }
        return List.of("One Size");
    }
}
