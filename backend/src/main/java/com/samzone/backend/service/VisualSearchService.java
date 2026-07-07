package com.samzone.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.samzone.backend.dto.VisualSearchDetection;
import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Detects the garment in an uploaded photo via Gemini vision, then matches it
// against the catalog. Falls back to top-rated clothing on any Gemini failure
// (no key, quota, malformed JSON) so the frontend always gets a product grid.
@Service
public class VisualSearchService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final int TIMEOUT_MS = 30_000;
    private static final int RESULT_LIMIT = 12;
    private static final String MODEL_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

    private static final List<String> FALLBACK_CATEGORIES = List.of(
            "Men's Clothing", "Women's Clothing", "Men's Footwear", "Accessories");

    private static final String PROMPT = "Analyze this clothing/product photo. Return ONLY raw JSON: "
            + "{ \"category\": \"closest match from: Men's Clothing, Women's Clothing, Men's Footwear, "
            + "Accessories, Laptops, Mobiles, Cameras\", \"type\": \"garment type e.g. shirt, saree, hoodie\", "
            + "\"color\": \"dominant color\", \"keywords\": [\"3-5 search terms\"] }";

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Autowired
    private ProductRepository productRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public VisualSearchService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT_MS);
        factory.setReadTimeout(TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    public Map<String, Object> search(String imageRaw) {
        String imageBase64 = stripDataUrlPrefix(imageRaw);

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(imageBase64);
        } catch (IllegalArgumentException e) {
            return buildResponse(null, fallbackProducts());
        }
        if (decoded.length > MAX_IMAGE_BYTES) {
            return buildResponse(null, fallbackProducts());
        }

        VisualSearchDetection detection = detect(imageBase64);
        List<Product> products = detection != null ? matchProducts(detection) : fallbackProducts();
        if (products.isEmpty()) {
            products = fallbackProducts();
        }
        return buildResponse(detection, products);
    }

    private VisualSearchDetection detect(String imageBase64) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(
                            Map.of("inlineData", Map.of("mimeType", "image/jpeg", "data", imageBase64)),
                            Map.of("text", PROMPT)
                    ))),
                    "generationConfig", Map.of("responseMimeType", "application/json"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(MODEL_URL, HttpMethod.POST, entity, Map.class);
            String text = extractText(response.getBody());
            if (text == null || text.isBlank()) {
                return null;
            }
            return objectMapper.readValue(text, VisualSearchDetection.class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<Product> matchProducts(VisualSearchDetection detection) {
        Pageable pageable = PageRequest.of(0, RESULT_LIMIT, Sort.by("rating").descending());
        List<Product> results = new ArrayList<>();

        if (detection.getType() != null) {
            results.addAll(productRepository
                    .findByFilters(detection.getCategory(), null, detection.getType(), null, null, null, pageable)
                    .getContent());
        }

        if (results.size() < RESULT_LIMIT && detection.getCategory() != null) {
            for (Product p : productRepository
                    .findByFilters(detection.getCategory(), null, null, null, null, null, pageable)
                    .getContent()) {
                if (results.size() >= RESULT_LIMIT) break;
                if (results.stream().noneMatch(r -> r.getId().equals(p.getId()))) {
                    results.add(p);
                }
            }
        }

        return results;
    }

    private List<Product> fallbackProducts() {
        return productRepository.findTopRatedByCategories(
                FALLBACK_CATEGORIES, PageRequest.of(0, RESULT_LIMIT, Sort.by("rating").descending()));
    }

    private Map<String, Object> buildResponse(VisualSearchDetection detection, List<Product> products) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("detected", detection);
        response.put("products", products);
        return response;
    }

    private String stripDataUrlPrefix(String raw) {
        if (raw == null) {
            return "";
        }
        int commaIndex = raw.indexOf(',');
        return raw.startsWith("data:") && commaIndex != -1 ? raw.substring(commaIndex + 1) : raw;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> body) {
        if (body == null) {
            return null;
        }
        List<Object> candidates = (List<Object>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        Map<String, Object> candidate = (Map<String, Object>) candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) candidate.get("content");
        if (content == null) {
            return null;
        }
        List<Object> parts = (List<Object>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            return null;
        }
        Map<String, Object> part = (Map<String, Object>) parts.get(0);
        return (String) part.get("text");
    }
}
