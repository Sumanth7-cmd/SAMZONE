package com.samzone.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.samzone.backend.dto.ChatResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Autowired
    private ProductRepository productRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<String> STOP_WORDS = Set.of(
            "show", "me", "find", "search", "for", "some", "a", "an", "the", "i",
            "want", "need", "please", "can", "you", "get", "give", "looking", "is", "of");

    private static final Set<String> FASHION_KEYWORDS = Set.of(
            "shirt", "pant", "kurta", "dress", "saree", "jeans", "top", "blouse",
            "outfit", "wear", "clothing", "fashion", "ethnic", "formal", "casual", "party");

    private static final Set<String> WOMEN_FASHION_KEYWORDS = Set.of(
            "dress", "saree", "blouse", "kurti", "women", "womens", "women's", "skirt", "gown");

    public ChatResponse chat(String message) {
        if (message == null || message.isBlank()) {
            return ChatResponse.builder()
                    .reply("Feel free to ask me about products, styles, or outfit recommendations!")
                    .products(List.of())
                    .success(true)
                    .build();
        }

        ChatIntent intent = extractIntent(message);
        List<Product> products = findRelevantProducts(message, intent);

        String reply = products.isEmpty()
                ? "I couldn't find an exact match, but feel free to describe what you're looking for differently!"
                : "Here are some products for you!";

        return ChatResponse.builder()
                .reply(reply)
                .products(products)
                .success(true)
                .build();
    }

    private ChatIntent extractIntent(String message) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }
        try {
            return callGemini(message);
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private ChatIntent callGemini(String message) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", geminiApiKey);

        String prompt = getSystemPrompt() + "\n\nUser message: " + message;
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", "application/json"));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

        Map<String, Object> body = response.getBody();
        if (body == null || !body.containsKey("candidates")) {
            return null;
        }
        List<Object> candidates = (List<Object>) body.get("candidates");
        if (candidates.isEmpty()) {
            return null;
        }
        Map<String, Object> candidate = (Map<String, Object>) candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) candidate.get("content");
        List<Object> parts = (List<Object>) content.get("parts");
        if (parts.isEmpty()) {
            return null;
        }
        Map<String, Object> part = (Map<String, Object>) parts.get(0);
        String text = (String) part.get("text");
        if (text == null || text.isBlank()) {
            return null;
        }

        return objectMapper.readValue(text, ChatIntent.class);
    }

    private String getSystemPrompt() {
        return "You are S.A.M., a shopping assistant for SAMZONE, an Indian e-commerce platform. " +
                "Extract shopping intent from the user message and return ONLY a raw JSON object with these " +
                "keys (omit any you cannot determine): category, brand, keyword, minPrice, maxPrice. " +
                "Prices in the database are in USD. Convert rupee amounts by dividing by 83. " +
                "Available categories in database: Laptops, Mobiles, Men's Clothing, Men's Footwear, " +
                "Cameras, Car Accessories, Toys, Movies, Audio & Video, Women's Clothing, Accessories, Kids. " +
                "Always map user requests to the closest matching category. " +
                "No markdown, no explanation, just the JSON.";
    }

    private List<Product> findRelevantProducts(String message, ChatIntent intent) {
        List<Product> results = null;
        Pageable pageable = PageRequest.of(0, 6, Sort.by("rating").descending());

        if (intent != null) {
            if (intent.category != null) {
                results = productRepository
                        .findByFilters(intent.category, intent.minPrice, intent.maxPrice, null, pageable)
                        .getContent();
            } else if (intent.keyword != null || intent.brand != null) {
                String q = intent.keyword != null ? intent.keyword : intent.brand;
                results = productRepository.searchProducts(q, pageable).getContent();

                if (intent.minPrice != null || intent.maxPrice != null) {
                    results = results.stream()
                            .filter(p -> (intent.minPrice == null || p.getPrice() >= intent.minPrice)
                                    && (intent.maxPrice == null || p.getPrice() <= intent.maxPrice))
                            .collect(Collectors.toList());
                }
            }

            if (results != null && intent.category != null && (intent.brand != null || intent.keyword != null)) {
                String needle = (intent.brand != null ? intent.brand : intent.keyword).toLowerCase();
                List<Product> narrowed = results.stream()
                        .filter(p -> p.getBrand().toLowerCase().contains(needle)
                                || p.getName().toLowerCase().contains(needle))
                        .collect(Collectors.toList());
                if (!narrowed.isEmpty()) {
                    results = narrowed;
                }
            }
        }

        String lowerMessage = message.toLowerCase();
        if (results != null && !results.isEmpty()
                && FASHION_KEYWORDS.stream().anyMatch(lowerMessage::contains)
                && results.stream().noneMatch(this::isFashionCategoryProduct)) {
            List<Product> fashionResults = findFashionCategoryProducts(lowerMessage);
            if (!fashionResults.isEmpty()) {
                results = fashionResults;
            }
        }

        if (results == null || results.isEmpty()) {
            results = findRelevantProductsFallback(message);
        }

        return results;
    }

    private List<Product> findRelevantProductsFallback(String message) {
        String lower = message.toLowerCase();

        for (String category : productRepository.findAllCategories()) {
            String catLower = category.toLowerCase();
            String catSingular = catLower.endsWith("s") ? catLower.substring(0, catLower.length() - 1) : catLower;
            if (lower.contains(catLower) || lower.contains(catSingular)) {
                List<Product> byCategory = productRepository
                        .findByCategory(category, PageRequest.of(0, 6, Sort.by("rating").descending()))
                        .getContent();
                if (!byCategory.isEmpty()) {
                    return byCategory;
                }
            }
        }

        if (FASHION_KEYWORDS.stream().anyMatch(lower::contains)) {
            List<Product> fashionResults = findFashionCategoryProducts(lower);
            if (!fashionResults.isEmpty()) {
                return fashionResults;
            }
        }

        String cleaned = Arrays.stream(lower.split("\\s+"))
                .filter(w -> !STOP_WORDS.contains(w) && w.length() > 1)
                .collect(Collectors.joining(" "));
        String query = cleaned.isBlank() ? lower : cleaned;

        List<Product> results = productRepository
                .searchProducts(query, PageRequest.of(0, 6, Sort.by("rating").descending()))
                .getContent();

        if (results.isEmpty()) {
            for (String token : query.split("\\s+")) {
                if (token.length() < 3) {
                    continue;
                }
                results = productRepository
                        .searchProducts(token, PageRequest.of(0, 6, Sort.by("rating").descending()))
                        .getContent();
                if (!results.isEmpty()) {
                    break;
                }
            }
        }

        return results;
    }

    private boolean isFashionCategoryProduct(Product product) {
        String category = product.getCategory();
        return category != null
                && (category.equals("Men's Clothing")
                        || category.equals("Women's Clothing")
                        || category.equals("Accessories"));
    }

    private List<Product> findFashionCategoryProducts(String lower) {
        Pageable pageable = PageRequest.of(0, 6, Sort.by("rating").descending());
        boolean isWomens = WOMEN_FASHION_KEYWORDS.stream().anyMatch(lower::contains);

        String primaryCategory = isWomens ? "Women's Clothing" : "Men's Clothing";
        String secondaryCategory = isWomens ? "Men's Clothing" : "Women's Clothing";

        List<Product> results = productRepository.findByCategory(primaryCategory, pageable).getContent();
        if (results.isEmpty()) {
            results = productRepository.findByCategory(secondaryCategory, pageable).getContent();
        }
        if (results.isEmpty()) {
            results = productRepository.findByCategory("Accessories", pageable).getContent();
        }
        return results;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ChatIntent {
        public String category;
        public String brand;
        public String keyword;
        public Double minPrice;
        public Double maxPrice;
    }
}
