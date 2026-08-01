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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DressImportService {

    private static final Logger log = LoggerFactory.getLogger(DressImportService.class);
    private static final int BATCH_SIZE = 100;
    private static final double INR_TO_USD = 83.0;
    private static final String CSV_FILE_PATH = "/home/rishi/Desktop/v1/archive (11)/dress.csv";

    private static final List<String> BRANDS_LIST = List.of("Dressberry", "Harpa", "Tokyo Talkies", "Vishudh", "Biba", "Libas", "W");

    private static final Map<String, List<String>> IMAGE_POOLS = Map.of(
        "floral", List.of(
            "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"
        ),
        "plain", List.of(
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&auto=format&fit=crop&q=80"
        ),
        "polka dot", List.of(
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1622122441006-00b8e612d921?w=600&auto=format&fit=crop&q=80"
        ),
        "stripes", List.of(
            "https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600&auto=format&fit=crop&q=80"
        ),
        "animal", List.of(
            "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&auto=format&fit=crop&q=80"
        ),
        "geometry", List.of(
            "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80"
        ),
        "ikat", List.of(
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&auto=format&fit=crop&q=80"
        ),
        "OTHER", List.of(
            "https://images.unsplash.com/photo-1566207274740-0f8cf6b7d5a5?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=600&auto=format&fit=crop&q=80"
        )
    );

    @Autowired
    private ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public ImportResult importDresses() {
        ImportResult result = new ImportResult();
        result.setExistingCountBefore(productRepository.count());

        int read = 0;
        int inserted = 0;
        int skippedDuplicate = 0;
        int skippedLowConfidence = 0;
        List<Product> batch = new ArrayList<>();

        java.util.Set<String> existingExternalIds = new java.util.HashSet<>(productRepository.findAllExternalIds());

        try (
            Reader reader = new InputStreamReader(new FileInputStream(CSV_FILE_PATH), StandardCharsets.UTF_8);
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
                    String unitId = row.get("_unit_id");
                    String pattern = row.get("category");
                    String confidenceRaw = row.get("category:confidence");
                    String originalImageUrl = row.get("image_url");

                    double confidence = Double.parseDouble(confidenceRaw);
                    if (confidence < 0.7) {
                        skippedLowConfidence++;
                        continue;
                    }

                    String uniqId = computeMd5(unitId);
                    
                    // Check if already exists in local database by externalId
                    if (existingExternalIds.contains(uniqId)) {
                        skippedDuplicate++;
                        continue;
                    }

                    String brand = getDeterministicItem(unitId, BRANDS_LIST);
                    String patternFormatted = pattern.equals("OTHER") ? "Classic" : pattern.substring(0, 1).toUpperCase() + pattern.substring(1);
                    String productName = brand + " Women's " + patternFormatted + " Pattern A-Line Dress";
                    
                    // Deterministic prices
                    int hashVal = Math.abs(computeMd5(unitId + "price").hashCode());
                    double retailPriceInr = 999.0 + (hashVal % 20) * 100.0;
                    double discountedPriceInr = Math.floor(retailPriceInr * (0.6 + (hashVal % 4) * 0.1));
                    double rating = 3.8 + (hashVal % 11) * 0.1;
                    rating = Math.round(rating * 10.0) / 10.0;

                    // Convert price to USD for H2 consistency
                    double priceUsd = discountedPriceInr / INR_TO_USD;
                    
                    // Image mapping
                    List<String> pool = IMAGE_POOLS.getOrDefault(pattern, IMAGE_POOLS.get("OTHER"));
                    if (pool == null) {
                        pool = IMAGE_POOLS.get("OTHER");
                    }
                    String primaryImage = getDeterministicItem(unitId + "img1", pool);
                    String secondaryImage = getDeterministicItem(unitId + "img2", pool);

                    Product product = new Product();
                    product.setExternalId(uniqId);
                    product.setName(productName);
                    product.setBrand(brand);
                    product.setCategory("Women's Clothing");
                    product.setPrice(priceUsd);
                    product.setDiscount(0.0);
                    product.setRating(rating);
                    product.setStock(50 + (hashVal % 100));
                    
                    String description = "Upgrade your wardrobe with this stylish " + patternFormatted.toLowerCase() + 
                            " printed A-line dress from " + brand + ". Made from soft, breathable premium fabric, " +
                            "it features a comfortable design that is perfect for casual events, weekend brunches, or semi-formal settings.";
                    product.setDescription(description);
                    
                    String specifications = "{\"Gender\":\"Women\",\"Fabric\":\"Cotton Blend\",\"Pattern\":\"" + patternFormatted + 
                            "\",\"Style\":\"A-Line\",\"Length\":\"Midi\",\"Occasion\":\"Casual / Party Wear\"}";
                    product.setSpecifications(specifications);
                    
                    product.setImages(List.of(primaryImage, secondaryImage));
                    product.setColors(List.of(patternFormatted, "Multicolor"));
                    product.setSizes(List.of("XS", "S", "M", "L", "XL", "XXL"));

                    batch.add(product);

                    if (batch.size() >= BATCH_SIZE) {
                        productRepository.saveAllAndFlush(batch);
                        inserted += batch.size();
                        batch.clear();
                        entityManager.clear();
                        log.info("H2 Dress import progress: {} inserted so far", inserted);
                    }
                } catch (Exception rowEx) {
                    log.warn("Skipping H2 Dress row {}: {}", read, rowEx.getMessage());
                }
            }

            if (!batch.isEmpty()) {
                productRepository.saveAllAndFlush(batch);
                inserted += batch.size();
                entityManager.clear();
            }
        } catch (Exception e) {
            log.error("H2 Dress import failed: ", e);
            result.setStatus("FAILED: " + e.getMessage());
            return result;
        }

        result.setTotalRead(read);
        result.setInserted(inserted);
        result.setSkippedDuplicate(skippedDuplicate);
        result.setSkippedInvalid(skippedLowConfidence);
        result.setFinalDatabaseCount(productRepository.count());
        result.setStatus("SUCCESS");

        log.info("H2 Dress import complete: read={} inserted={} dupSkipped={} lowConfidenceSkipped={} finalCount={}",
                read, inserted, skippedDuplicate, skippedLowConfidence, result.getFinalDatabaseCount());
        return result;
    }

    private String computeMd5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : messageDigest) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return input;
        }
    }

    private <T> T getDeterministicItem(String seed, List<T> pool) {
        int hash = Math.abs(computeMd5(seed).hashCode());
        return pool.get(hash % pool.size());
    }
}
