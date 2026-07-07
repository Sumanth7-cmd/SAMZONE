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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
            "outfit", "wear", "clothing", "fashion", "ethnic", "formal", "casual", "party",
            "hoodie", "sweatshirt", "suit", "blazer", "sherwani", "lehenga", "kurti",
            "anarkali", "gown", "palazzo", "chinos");

    private static final Set<String> WOMEN_FASHION_KEYWORDS = Set.of(
            "dress", "saree", "blouse", "kurti", "women", "womens", "women's", "skirt", "gown",
            "lehenga", "anarkali", "palazzo");

    private static final List<String> EXACT_GREETINGS = List.of(
            "hi", "hello", "hey", "hii", "helo",
            "how are you", "how r u", "whats up", "what's up",
            "thanks", "thank you", "bye", "goodbye");

    private static final String GREETING_REPLY =
            "Hello! I'm S.A.M., your Smart Assistant for Modern Shopping. How can I help you today?";

    private static final Set<String> OUTFIT_KEYWORDS = Set.of(
            "outfit", "complete look", "what to wear");

    private static final Set<String> ADVICE_KEYWORDS = Set.of(
            "what should i wear", "styling tip", "style tip", "goes with", "what goes with",
            "how to style", "what matches", "matching colors", "matching color",
            "what color matches", "what colour matches", "color match", "colour match",
            "pair with", "pairs with");

    private static final Set<String> BASIC_COLORS = Set.of(
            "black", "white", "red", "blue", "green", "yellow", "purple", "pink",
            "orange", "brown", "grey", "gray", "navy", "maroon", "beige", "teal");

    private static final Map<String, List<String>> COLOR_HARMONY = Map.ofEntries(
            Map.entry("red", List.of("Navy", "White", "Beige", "Grey")),
            Map.entry("navy", List.of("White", "Mustard", "Coral", "Grey")),
            Map.entry("black", List.of("White", "Red", "Gold", "Any color")),
            Map.entry("white", List.of("Navy", "Black", "Olive", "Any color")),
            Map.entry("green", List.of("Beige", "Brown", "White", "Navy")),
            Map.entry("yellow", List.of("Navy", "Grey", "White", "Purple")),
            Map.entry("blue", List.of("Orange", "White", "Grey", "Brown")));

    private static final Map<String, List<String>> OCCASION_MAP = Map.of(
            "wedding", List.of("kurta", "sherwani", "formal", "ethnic"),
            "college", List.of("casual", "tshirt", "jeans", "sneaker"),
            "office", List.of("formal", "shirt", "trouser"),
            "party", List.of("party", "dress", "blazer"),
            "festival", List.of("ethnic", "kurta", "traditional"),
            "travel", List.of("casual", "comfortable", "shorts"),
            "birthday", List.of("party", "dress", "casual", "shirt", "birthday"));

    private static final Pattern BETWEEN_PATTERN = Pattern.compile(
            "between\\s*[₹rs.]*\\s*([\\d,]+)\\s*(?:and|-|to)\\s*[₹rs.]*\\s*([\\d,]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RANGE_PATTERN = Pattern.compile(
            "[₹rs.]*\\s*([\\d,]+)\\s*(?:-|to)\\s*[₹rs.]*\\s*([\\d,]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern UNDER_PATTERN = Pattern.compile(
            "(?:under|below|less than|cheaper than|within)\\s*[₹rs.]*\\s*([\\d,]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern OVER_PATTERN = Pattern.compile(
            "(?:above|over|more than)\\s*[₹rs.]*\\s*([\\d,]+)", Pattern.CASE_INSENSITIVE);

    private static final double INR_TO_USD = 83.0;

    private static final String[] REPLY_TEMPLATES = {
            "Here are %d great picks for you! 🛍️",
            "Found %d options you might love! ✨",
            "Check out these %d products! 👇",
            "I picked %d items matching your style! 🎯",
    };

    private static final Map<String, String> OCCASION_REPLY = Map.of(
            "wedding", "Perfect for a wedding! Here are my picks: 💍",
            "college", "Great college looks coming up! 🎒",
            "office", "Sharp office looks, coming right up! 💼",
            "party", "Party-ready picks incoming! 🎉",
            "festival", "Festive picks for the occasion! 🪔",
            "travel", "Comfy travel-ready picks! ✈️",
            "birthday", "Birthday party picks coming up! 🎂");

    private static final String NO_MATCH_REPLY =
            "I couldn't find exactly that, but here are similar items. Try being more specific "
                    + "— like 'blue formal shirt' or 'running shoes under 3000'.";

    private final Random random = new Random();

    private String buildReply(String lower, List<Product> products, Double[] priceRange) {
        if (products.isEmpty()) {
            return NO_MATCH_REPLY;
        }

        String occasionKey = OCCASION_MAP.keySet().stream().filter(lower::contains).findFirst().orElse(null);
        String reply = occasionKey != null && OCCASION_REPLY.containsKey(occasionKey)
                ? OCCASION_REPLY.get(occasionKey)
                : String.format(REPLY_TEMPLATES[random.nextInt(REPLY_TEMPLATES.length)], products.size());

        if (priceRange != null && priceRange[1] != null) {
            long budgetInr = Math.round(priceRange[1] * INR_TO_USD);
            reply += " All within your ₹" + budgetInr + " budget! 💰";
        }

        return reply;
    }

    public ChatResponse chat(String message) {
        if (message == null || message.isBlank()) {
            return ChatResponse.builder()
                    .reply("Feel free to ask me about products, styles, or outfit recommendations!")
                    .products(List.of())
                    .success(true)
                    .build();
        }

        String lower = message.toLowerCase().trim();

        boolean isGreeting = EXACT_GREETINGS.stream().anyMatch(g ->
                lower.equals(g) || lower.equals(g + "!") || lower.equals(g + "."));
        if (isGreeting) {
            return ChatResponse.builder().reply(GREETING_REPLY).products(List.of()).success(true).build();
        }

        if (ADVICE_KEYWORDS.stream().anyMatch(lower::contains)) {
            return buildAdviceResponse(lower);
        }

        if (OUTFIT_KEYWORDS.stream().anyMatch(lower::contains)) {
            return buildOutfitResponse(lower);
        }

        ChatIntent intent = extractIntent(message);
        if (intent != null && "advice".equalsIgnoreCase(intent.intent) && intent.reply != null && !intent.reply.isBlank()) {
            List<Product> products = findRelevantProducts(message, intent);
            if (products.isEmpty()) {
                products = findFashionCategoryProducts(lower, extractPriceRange(lower));
            }
            return ChatResponse.builder().reply(intent.reply).products(products).success(true).build();
        }

        List<Product> products = findRelevantProducts(message, intent);
        String reply = buildReply(lower, products, extractPriceRange(lower));

        return ChatResponse.builder()
                .reply(reply)
                .products(products)
                .success(true)
                .build();
    }

    private ChatResponse buildAdviceResponse(String lower) {
        String colorHint = BASIC_COLORS.stream().filter(lower::contains).findFirst().orElse(null);
        List<String> harmonyColors = colorHint != null
                ? COLOR_HARMONY.getOrDefault(colorHint, List.of())
                : List.of();

        String reply;
        if (!harmonyColors.isEmpty()) {
            reply = capitalize(colorHint) + " pairs beautifully with " + String.join(", ", harmonyColors)
                    + ". Here are some options to match:";
        } else {
            reply = "Here's a styling tip: keep one statement piece per outfit and balance it with neutral basics. "
                    + "Here are some products to get you started:";
        }

        List<Product> products = new ArrayList<>();
        Pageable pageable = PageRequest.of(0, 3, Sort.by("rating").descending());
        for (String harmonyColor : harmonyColors) {
            if (products.size() >= 6) {
                break;
            }
            List<Product> matches = productRepository
                    .findByFilters("Men's Clothing", null, harmonyColor, null, null, null, pageable)
                    .getContent();
            products.addAll(matches);
        }
        if (products.isEmpty()) {
            products = findFashionCategoryProducts(lower, null);
        }

        return ChatResponse.builder()
                .reply(reply)
                .products(products.stream().distinct().limit(6).collect(Collectors.toList()))
                .success(true)
                .build();
    }

    private ChatResponse buildOutfitResponse(String lower) {
        Double[] priceRange = extractPriceRange(lower);
        Double minPrice = priceRange[0];
        Double maxPrice = priceRange[1];

        boolean isWomens = WOMEN_FASHION_KEYWORDS.stream().anyMatch(lower::contains);
        String clothingCategory = isWomens ? "Women's Clothing" : "Men's Clothing";

        String occasionKey = OCCASION_MAP.keySet().stream().filter(lower::contains).findFirst().orElse(null);
        List<String> topTerms = occasionKey != null
                ? OCCASION_MAP.get(occasionKey)
                : List.of("shirt", "t-shirt", "kurta");

        Pageable twoResults = PageRequest.of(0, 2, Sort.by("rating").descending());

        List<Product> tops = findFirstNonEmptyByTerms(clothingCategory, topTerms, minPrice, maxPrice, twoResults);
        if (tops.isEmpty()) {
            tops = productRepository
                    .findByFilters(clothingCategory, null, null, minPrice, maxPrice, null, twoResults).getContent();
        }

        List<String> bottomTerms = List.of("pant", "jean", "trouser");
        List<Product> bottoms = findFirstNonEmptyByTerms(clothingCategory, bottomTerms, minPrice, maxPrice, twoResults);
        if (bottoms.isEmpty()) {
            bottoms = findFirstNonEmptyByTerms(clothingCategory, bottomTerms, null, null, twoResults);
        }

        List<Product> shoes = productRepository
                .findByFilters("Men's Footwear", null, null, minPrice, maxPrice, null, twoResults).getContent();
        if (shoes.isEmpty()) {
            shoes = productRepository
                    .findByFilters("Men's Footwear", null, null, null, null, null, twoResults).getContent();
        }

        List<Product> outfit = new ArrayList<>();
        outfit.addAll(tops);
        outfit.addAll(bottoms);
        outfit.addAll(shoes);

        return ChatResponse.builder()
                .reply("Here's a complete outfit for you! 👕 Top, 👖 Bottom, 👟 Shoes")
                .products(outfit)
                .success(true)
                .build();
    }

    private List<Product> findFirstNonEmptyByTerms(String category, List<String> terms, Double minPrice,
            Double maxPrice, Pageable pageable) {
        for (String term : terms) {
            List<Product> matches = productRepository
                    .findByFilters(category, null, term, minPrice, maxPrice, null, pageable).getContent();
            if (!matches.isEmpty()) {
                return matches;
            }
        }
        return List.of();
    }

    private String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
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
                "keys (omit any you cannot determine): category, brand, keyword, minPrice, maxPrice, intent, reply. " +
                "Prices in the database are in USD. Convert rupee amounts by dividing by 83. " +
                "Available categories in database: Laptops, Mobiles, Men's Clothing, Men's Footwear, " +
                "Cameras, Car Accessories, Toys, Movies, Audio & Video, Women's Clothing, Accessories, Kids. " +
                "Always map user requests to the closest matching category. " +
                "If the user asks for styling advice, set intent=advice and write helpful fashion guidance " +
                "in the reply field, plus extract any product filters mentioned. " +
                "No markdown, no explanation, just the JSON.";
    }

    private List<Product> findRelevantProducts(String message, ChatIntent intent) {
        List<Product> results = null;
        Pageable pageable = PageRequest.of(0, 6, Sort.by("rating").descending());

        if (intent != null) {
            if (intent.category != null) {
                results = productRepository
                        .findByFilters(intent.category, intent.brand, null, intent.minPrice, intent.maxPrice, null, pageable)
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
            List<Product> fashionResults = findFashionCategoryProducts(lowerMessage, extractPriceRange(lowerMessage));
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
        Double[] priceRange = extractPriceRange(lower);
        Double minPrice = priceRange[0];
        Double maxPrice = priceRange[1];
        Pageable pageable = PageRequest.of(0, 6, Sort.by("rating").descending());

        for (String category : productRepository.findAllCategories()) {
            String catLower = category.toLowerCase();
            String catSingular = catLower.endsWith("s") ? catLower.substring(0, catLower.length() - 1) : catLower;
            if (lower.contains(catLower) || lower.contains(catSingular)) {
                List<Product> byCategory = productRepository
                        .findByFilters(category, null, null, minPrice, maxPrice, null, pageable)
                        .getContent();
                if (!byCategory.isEmpty()) {
                    return byCategory;
                }
            }
        }

        String occasionKey = OCCASION_MAP.keySet().stream().filter(lower::contains).findFirst().orElse(null);
        if (occasionKey != null) {
            List<Product> occasionResults = findOccasionProducts(occasionKey, lower, minPrice, maxPrice);
            if (!occasionResults.isEmpty()) {
                return occasionResults;
            }
        }

        if (FASHION_KEYWORDS.stream().anyMatch(lower::contains)) {
            List<Product> fashionResults = findFashionCategoryProducts(lower, priceRange);
            if (!fashionResults.isEmpty()) {
                return fashionResults;
            }
        }

        String cleaned = Arrays.stream(lower.split("\\s+"))
                .filter(w -> !STOP_WORDS.contains(w) && w.length() > 1)
                .collect(Collectors.joining(" "));
        String query = cleaned.isBlank() ? lower : cleaned;

        List<Product> results = productRepository
                .findByFilters(null, null, query, minPrice, maxPrice, null, pageable)
                .getContent();

        if (results.isEmpty()) {
            for (String token : query.split("\\s+")) {
                if (token.length() < 3) {
                    continue;
                }
                results = productRepository
                        .findByFilters(null, null, token, minPrice, maxPrice, null, pageable)
                        .getContent();
                if (!results.isEmpty()) {
                    break;
                }
            }
        }

        return results;
    }

    private List<Product> findOccasionProducts(String occasionKey, String lower, Double minPrice, Double maxPrice) {
        List<String> expansions = OCCASION_MAP.get(occasionKey);
        boolean isWomens = WOMEN_FASHION_KEYWORDS.stream().anyMatch(lower::contains);
        String primaryCategory = isWomens ? "Women's Clothing" : "Men's Clothing";
        String secondaryCategory = isWomens ? "Men's Clothing" : "Women's Clothing";
        Pageable pageable = PageRequest.of(0, 6, Sort.by("rating").descending());

        for (String category : List.of(primaryCategory, secondaryCategory)) {
            for (String term : expansions) {
                List<Product> matches = productRepository
                        .findByFilters(category, null, term, minPrice, maxPrice, null, pageable)
                        .getContent();
                if (!matches.isEmpty()) {
                    return matches;
                }
            }
        }

        for (String category : List.of(primaryCategory, secondaryCategory)) {
            List<Product> matches = productRepository
                    .findByFilters(category, null, null, minPrice, maxPrice, null, pageable)
                    .getContent();
            if (!matches.isEmpty()) {
                return matches;
            }
        }

        return List.of();
    }

    private boolean isFashionCategoryProduct(Product product) {
        String category = product.getCategory();
        return category != null
                && (category.equals("Men's Clothing")
                        || category.equals("Women's Clothing")
                        || category.equals("Accessories"));
    }

    private static final Set<String> NON_GARMENT_FASHION_WORDS = Set.of(
            "wear", "clothing", "fashion", "outfit", "formal", "casual", "party");

    private List<Product> findFashionCategoryProducts(String lower, Double[] priceRange) {
        Pageable pageable = PageRequest.of(0, 6, Sort.by("rating").descending());
        boolean isWomens = WOMEN_FASHION_KEYWORDS.stream().anyMatch(lower::contains);
        Double minPrice = priceRange != null ? priceRange[0] : null;
        Double maxPrice = priceRange != null ? priceRange[1] : null;

        String primaryCategory = isWomens ? "Women's Clothing" : "Men's Clothing";
        String secondaryCategory = isWomens ? "Men's Clothing" : "Women's Clothing";

        String colorHint = BASIC_COLORS.stream().filter(lower::contains).findFirst().orElse(null);
        String garmentKeyword = FASHION_KEYWORDS.stream()
                .filter(k -> !NON_GARMENT_FASHION_WORDS.contains(k) && lower.contains(k))
                .findFirst().orElse(null);

        // Prefer matching the actual garment named in the message (e.g. "shirt", "kurta")
        // over just returning the top-rated item in the category, which can be unrelated.
        if (garmentKeyword != null) {
            for (String category : List.of(primaryCategory, secondaryCategory)) {
                List<Product> matches = productRepository
                        .findByFilters(category, null, garmentKeyword, minPrice, maxPrice, null, pageable)
                        .getContent();
                if (matches.isEmpty()) {
                    continue;
                }
                if (colorHint != null) {
                    List<Product> colorFiltered = matches.stream()
                            .filter(p -> matchesColor(p, colorHint))
                            .collect(Collectors.toList());
                    if (!colorFiltered.isEmpty()) {
                        return colorFiltered;
                    }
                }
                return matches;
            }
        }

        if (colorHint != null) {
            for (String category : List.of(primaryCategory, secondaryCategory)) {
                List<Product> colorResults = productRepository
                        .findByFilters(category, null, colorHint, minPrice, maxPrice, null, pageable)
                        .getContent();
                if (!colorResults.isEmpty()) {
                    return colorResults;
                }
            }
        }

        List<Product> results = productRepository
                .findByFilters(primaryCategory, null, null, minPrice, maxPrice, null, pageable).getContent();
        if (results.isEmpty()) {
            results = productRepository
                    .findByFilters(secondaryCategory, null, null, minPrice, maxPrice, null, pageable).getContent();
        }
        if (results.isEmpty()) {
            results = productRepository
                    .findByFilters("Accessories", null, null, minPrice, maxPrice, null, pageable).getContent();
        }
        return results;
    }

    private boolean matchesColor(Product product, String colorHint) {
        if (product.getColors() != null
                && product.getColors().stream().anyMatch(c -> c != null && c.toLowerCase().contains(colorHint))) {
            return true;
        }
        return product.getName() != null && product.getName().toLowerCase().contains(colorHint);
    }

    private Double[] extractPriceRange(String lower) {
        Matcher m = BETWEEN_PATTERN.matcher(lower);
        if (m.find()) {
            return toUsdRange(m.group(1), m.group(2));
        }
        m = UNDER_PATTERN.matcher(lower);
        if (m.find()) {
            return new Double[]{null, toUsd(m.group(1))};
        }
        m = OVER_PATTERN.matcher(lower);
        if (m.find()) {
            return new Double[]{toUsd(m.group(1)), null};
        }
        m = RANGE_PATTERN.matcher(lower);
        if (m.find()) {
            return toUsdRange(m.group(1), m.group(2));
        }
        return new Double[]{null, null};
    }

    private Double[] toUsdRange(String a, String b) {
        double v1 = toUsd(a);
        double v2 = toUsd(b);
        return new Double[]{Math.min(v1, v2), Math.max(v1, v2)};
    }

    private double toUsd(String rupeeAmount) {
        String digits = rupeeAmount.replace(",", "");
        return Double.parseDouble(digits) / INR_TO_USD;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ChatIntent {
        public String category;
        public String brand;
        public String keyword;
        public Double minPrice;
        public Double maxPrice;
        public String intent;
        public String reply;
    }
}
