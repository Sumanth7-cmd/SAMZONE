package com.samzone.backend.service;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AmazonImportService {

    private static final Logger log = LoggerFactory.getLogger(AmazonImportService.class);
    private static final int BATCH_SIZE = 100;

    @Autowired
    private ProductRepository productRepository;

    private static final List<String> AMAZON_FILES = List.of(
            "amazon_laptop.csv",
            "amazon_camra.csv",
            "amazon_mobile.csv",
            "amazon_audio_video.csv",
            "amazon_car_accessories.csv",
            "amazon_movies.csv",
            "amazon_men.csv",
            "amazon_men_shoe.csv",
            "amazon_toys_1.csv"
    );

    // The source CSVs have heavily duplicated listings (the same product
    // scraped/listed dozens of times at an identical price). The DB-backed
    // existsByNameIgnoreCaseAndPrice check only catches duplicates that were
    // already flushed, so two occurrences of the same row landing in the
    // same not-yet-flushed batch would both pass it. Track name+price pairs
    // already seen in this run (in memory) to catch those too, and to avoid
    // re-inserting rows the primary parser already flushed before falling
    // back to the line-by-line parser for the same file.
    private final Set<String> seenInRun = new HashSet<>();

    public void importAllCsvFiles() {
        seenInRun.clear();
        int totalImported = 0;
        for (String fileName : AMAZON_FILES) {
            try {
                int imported = importCsvFile(fileName);
                totalImported += imported;
            } catch (Exception e) {
                log.error("Amazon import failed for {}. Continuing with next file. Cause: {}", fileName, e.getMessage(), e);
            }
        }

        log.info("CSV Import Complete. Total imported from Amazon CSVs: {}", totalImported);
    }

    @Transactional
    public int importCsvFile(String fileName) {
        List<Product> batch = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;

        String fileContent;
        try (Reader rawReader = createReaderForCsv(fileName)) {
            fileContent = readAll(rawReader);
        } catch (Exception e) {
            log.error("Amazon import failed while reading {}: {}", fileName, e.getMessage(), e);
            return 0;
        }

        String sanitizedContent = sanitizeCsvContent(fileContent);
        try (CSVParser parser = createParser(new StringReader(sanitizedContent))) {
            for (CSVRecord row : parser) {
                processAmazonRow(fileName, row, batch);
            }
        } catch (Exception e) {
            log.warn("Primary parser failed for {}: {}. Falling back to line-by-line import.", fileName, e.getMessage());
            return importCsvFileByLine(fileName, sanitizedContent);
        }

        if (!batch.isEmpty()) {
            productRepository.saveAllAndFlush(batch);
            inserted += batch.size();
        }

        log.info("Imported {} products from {} (skipped {})", inserted, fileName, skipped);
        return inserted;
    }

    private CSVParser createParser(Reader reader) throws IOException {
        return CSVParser.parse(reader, CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setAllowMissingColumnNames(true)
                .setIgnoreSurroundingSpaces(true)
                .setTrim(true)
                .setEscape('\\')
                .setIgnoreEmptyLines(true)
                .build());
    }

    private int importCsvFileByLine(String fileName, String fileContent) {
        List<Product> batch = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;

        List<String> headerNames = extractHeaderNames(fileContent);
        try (BufferedReader reader = new BufferedReader(new StringReader(fileContent))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                return 0;
            }

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) {
                    continue;
                }

                CSVRecord row;
                try {
                    row = parseCsvLine(line, headerNames);
                } catch (Exception e) {
                    log.warn("Skipping malformed line {} in {}: {}", lineNumber, fileName, e.getMessage());
                    skipped++;
                    continue;
                }

                processAmazonRow(fileName, row, batch);
            }
        } catch (IOException e) {
            log.error("Failed to process {} line by line: {}", fileName, e.getMessage(), e);
            return 0;
        }

        if (!batch.isEmpty()) {
            productRepository.saveAllAndFlush(batch);
            inserted += batch.size();
        }

        log.info("Imported {} products from {} (skipped {}) using fallback line parser", inserted, fileName, skipped);
        return inserted;
    }

    private void processAmazonRow(String fileName, CSVRecord row, List<Product> batch) {
        String name = firstNonBlank(row, "Product Description", "Product Description ", "Production Description");
        if (name == null || name.isBlank()) {
            return;
        }

        String priceRaw = firstNonBlank(row, "Price(Dollar)", "PriceDollar)", "Price (Dollar)");
        Double price = parsePrice(priceRaw);
        String category = inferCategory(fileName);
        String brand = inferBrand(name);

        // Dedup and storage must key off the same string. Previously the
        // exists-check queried the raw, uncleaned `name` while the row was
        // stored under cleanName(name) - any row cleanName() actually
        // changed (collapsed whitespace, etc.) could never match on a later
        // run, so a redeploy re-imported the entire catalog as duplicates.
        String cleanedName = cleanName(name);

        String dedupKey = cleanedName.toLowerCase(Locale.ROOT) + "|" + price;
        if (!seenInRun.add(dedupKey)) {
            return;
        }

        if (productRepository.existsByNameIgnoreCaseAndPrice(cleanedName, price)) {
            return;
        }

        Product product = new Product();
        product.setExternalId(null);
        product.setName(cleanedName);
        product.setBrand(brand);
        product.setCategory(category);
        product.setPrice(price);
        product.setDiscount(0.0);
        product.setRating(4.0);
        product.setStock(100);
        product.setDescription(name);
        product.setSpecifications(null);
        product.setImages(List.of(CategoryImages.getCategoryImage(category, name)));
        product.setColors(List.of("Black", "White"));
        product.setSizes(List.of("One Size"));

        batch.add(product);
        if (batch.size() >= BATCH_SIZE) {
            productRepository.saveAllAndFlush(batch);
            batch.clear();
        }
    }

    private List<String> extractHeaderNames(String fileContent) {
        try (CSVParser parser = CSVParser.parse(new StringReader(fileContent), CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(false)
                .setIgnoreSurroundingSpaces(true)
                .setTrim(true)
                .setEscape('\\')
                .setIgnoreEmptyLines(true)
                .build())) {
            CSVRecord header = parser.getRecords().get(0);
            return new ArrayList<>(header.toList());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private CSVRecord parseCsvLine(String line, List<String> headerNames) {
        try (CSVParser parser = CSVParser.parse(new StringReader(line), CSVFormat.DEFAULT
                .builder()
                .setHeader(headerNames.toArray(String[]::new))
                .setSkipHeaderRecord(false)
                .setIgnoreSurroundingSpaces(true)
                .setTrim(true)
                .setEscape('\\')
                .build())) {
            return parser.getRecords().get(0);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String readAll(Reader reader) throws IOException {
        StringBuilder sb = new StringBuilder();
        char[] buffer = new char[8192];
        int n;
        while ((n = reader.read(buffer)) != -1) {
            sb.append(buffer, 0, n);
        }
        return sb.toString();
    }

    private String sanitizeCsvContent(String content) {
        StringBuilder sanitized = new StringBuilder(content.length());
        String[] lines = content.split("\\r?\\n", -1);
        for (int i = 0; i < lines.length; i++) {
            sanitized.append(sanitizeCsvLine(lines[i]));
            if (i < lines.length - 1) {
                sanitized.append('\n');
            }
        }
        return sanitized.toString();
    }

    private String sanitizeCsvLine(String line) {
        StringBuilder result = new StringBuilder(line.length());
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char current = line.charAt(i);
            char prev = i > 0 ? line.charAt(i - 1) : '\0';
            char next = i + 1 < line.length() ? line.charAt(i + 1) : '\0';

            if (current == '"') {
                if (!inQuotes) {
                    // Only a genuine field-opening quote if it sits right at a field
                    // boundary. Otherwise it's stray punctuation (e.g. an inches
                    // mark like 15.6") and would corrupt quote tracking for the
                    // rest of the line if treated as an opening quote.
                    boolean atFieldStart = prev == '\0' || prev == ',';
                    if (atFieldStart) {
                        inQuotes = true;
                        result.append(current);
                    }
                    // else: drop the stray quote
                } else {
                    if (next == '"') {
                        result.append("\"\"");
                        i++; // consume escaped quote
                    } else if (next == ',' || next == '\0') {
                        inQuotes = false;
                        result.append(current);
                    }
                    // else: drop the stray quote inside the quoted field
                }
            } else {
                result.append(current);
            }
        }

        return result.toString();
    }

    private Reader createReaderForCsv(String fileName) throws Exception {
        Resource resource = new ClassPathResource("Data/" + fileName);
        if (resource.exists()) {
            log.info("Loading Amazon CSV from classpath: {}", fileName);
            InputStream inputStream = resource.getInputStream();
            return new InputStreamReader(inputStream, StandardCharsets.UTF_8);
        }

        Path path = Path.of("src/main/resources/Data", fileName);
        if (Files.exists(path)) {
            log.info("Loading Amazon CSV from filesystem: {}", path);
            return Files.newBufferedReader(path, StandardCharsets.UTF_8);
        }

        log.warn("Skipping missing Amazon CSV: {}", fileName);
        throw new IllegalArgumentException("Missing Amazon CSV: " + fileName);
    }

    private String firstNonBlank(CSVRecord row, String... columns) {
        for (String column : columns) {
            try {
                String value = row.get(column);
                if (value != null && !value.isBlank() && !value.equalsIgnoreCase("null")) {
                    return value.trim();
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private String cleanName(String raw) {
        if (raw == null) {
            return "Unknown Product";
        }
        return raw.replaceAll("\\s+", " ").trim();
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

    private String inferCategory(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.contains("laptop")) return "Laptops";
        if (lower.contains("camra") || lower.contains("camera")) return "Cameras";
        if (lower.contains("mobile")) return "Mobiles";
        if (lower.contains("audio")) return "Audio & Video";
        if (lower.contains("car")) return "Car Accessories";
        if (lower.contains("movie")) return "Movies";
        if (lower.contains("men_shoe") || lower.contains("shoe")) return "Men's Footwear";
        if (lower.contains("men")) return "Men's Clothing";
        if (lower.contains("toy")) return "Toys";
        return "Accessories";
    }

    private String inferBrand(String name) {
        String normalized = name.toLowerCase();
        if (normalized.contains("samsung")) return "Samsung";
        if (normalized.contains("apple")) return "Apple";
        if (normalized.contains("oneplus")) return "OnePlus";
        if (normalized.contains("sony")) return "Sony";
        if (normalized.contains("anker")) return "Anker";
        if (normalized.contains("kinglake")) return "KINGLAKE";
        if (normalized.contains("tommy")) return "Tommy Hilfiger";
        if (normalized.contains("wildcraft")) return "Wildcraft";
        if (normalized.contains("dkny")) return "DKNY";
        return "Generic";
    }
}
