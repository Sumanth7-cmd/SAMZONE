package com.samzone.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.samzone.backend.dto.StylistPick;
import com.samzone.backend.dto.StylistPicksResponse;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// "Complete the Look": given a product, pulls a few complementary-category
// candidates from the real catalog and asks Gemini (text-only, no image
// model) to pick the 2-3 that make the best outfit, with a written reason
// per pick. Falls back to a plain top-rated-by-category pick (no Gemini
// text) if the model call fails for any reason - the frontend never sees
// a raw error, just a slightly less personalized set of reasons.
@Service
public class StylistService {

    private static final int TIMEOUT_MS = 30_000;
    private static final int CANDIDATES_PER_CATEGORY = 6;
    private static final int FALLBACK_PICK_COUNT = 3;
    private static final String MODEL_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private static final String FALLBACK_REASON = "Popular pairing in this category.";

    private static final Map<String, List<String>> COMPLEMENTARY_CATEGORIES = Map.of(
            "Men's Clothing", List.of("Men's Footwear", "Accessories"),
            "Women's Clothing", List.of("Accessories"),
            "Men's Footwear", List.of("Men's Clothing", "Accessories"),
            "Accessories", List.of("Men's Clothing", "Women's Clothing"));

    private static final List<String> DEFAULT_COMPLEMENTARY = List.of("Accessories");

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Autowired
    private ProductRepository productRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StylistService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT_MS);
        factory.setReadTimeout(TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    public Map<String, Object> completeLook(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return null;
        }

        List<Product> candidates = fetchCandidates(product);
        if (candidates.isEmpty()) {
            return buildResponse(product, List.of());
        }

        List<StylistPick> picks = callGemini(product, candidates);
        List<Map<String, Object>> resolvedPicks;
        if (picks != null && !picks.isEmpty()) {
            resolvedPicks = resolvePicks(picks, candidates);
        } else {
            resolvedPicks = List.of();
        }

        if (resolvedPicks.isEmpty()) {
            resolvedPicks = fallbackPicks(candidates);
        }

        return buildResponse(product, resolvedPicks);
    }

    private List<Product> fetchCandidates(Product product) {
        List<String> categories = COMPLEMENTARY_CATEGORIES.getOrDefault(product.getCategory(), DEFAULT_COMPLEMENTARY);
        Pageable pageable = PageRequest.of(0, CANDIDATES_PER_CATEGORY, Sort.by("rating").descending());

        List<Product> candidates = new ArrayList<>();
        for (String category : categories) {
            candidates.addAll(productRepository.findByCategory(category, pageable).getContent());
        }
        return candidates;
    }

    @SuppressWarnings("unchecked")
    private List<StylistPick> callGemini(Product product, List<Product> candidates) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }
        try {
            String prompt = buildPrompt(product, candidates);
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
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
            return objectMapper.readValue(text, StylistPicksResponse.class).getPicks();
        } catch (Exception e) {
            return null;
        }
    }

    private String buildPrompt(Product product, List<Product> candidates) {
        String mainItem = String.format("%s (category: %s, price: $%.2f) - %s",
                product.getName(), product.getCategory(), product.getPrice(),
                truncate(product.getDescription()));

        String candidateList = candidates.stream()
                .map(p -> String.format("{\"productId\": %d, \"name\": \"%s\", \"category\": \"%s\", \"price\": %.2f}",
                        p.getId(), p.getName().replace("\"", "'"), p.getCategory(), p.getPrice()))
                .collect(Collectors.joining(", "));

        return "Given this main item: " + mainItem + ". From these candidates: [" + candidateList + "], "
                + "pick the best 2-3 items that complete a stylish outfit. For each pick, explain in 1-2 "
                + "sentences why it works (color coordination, occasion fit, style). Return ONLY valid JSON: "
                + "{ \"picks\": [{\"productId\": <id>, \"reason\": \"...\"}] }";
    }

    private String truncate(String description) {
        if (description == null) {
            return "";
        }
        return description.length() > 200 ? description.substring(0, 200) : description;
    }

    private List<Map<String, Object>> resolvePicks(List<StylistPick> picks, List<Product> candidates) {
        Map<Long, Product> byId = candidates.stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<Map<String, Object>> resolved = new ArrayList<>();
        for (StylistPick pick : picks) {
            Product matched = pick.getProductId() != null ? byId.get(pick.getProductId()) : null;
            if (matched != null) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("product", matched);
                entry.put("reason", pick.getReason() != null ? pick.getReason() : FALLBACK_REASON);
                resolved.add(entry);
            }
        }
        return resolved;
    }

    private List<Map<String, Object>> fallbackPicks(List<Product> candidates) {
        return candidates.stream()
                .sorted((a, b) -> Double.compare(
                        b.getRating() != null ? b.getRating() : 0,
                        a.getRating() != null ? a.getRating() : 0))
                .limit(FALLBACK_PICK_COUNT)
                .map(p -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("product", p);
                    entry.put("reason", FALLBACK_REASON);
                    return entry;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> buildResponse(Product product, List<Map<String, Object>> picks) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("product", product);
        response.put("picks", picks);
        return response;
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
