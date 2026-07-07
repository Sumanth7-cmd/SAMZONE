package com.samzone.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.samzone.backend.dto.StyleDnaAnswers;
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
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// AI Style DNA: a 6-question quiz -> Gemini assigns a named style archetype
// breakdown (percentages summing to 100), a color palette and keywords, then
// those are used to pull a real mood board + top picks from the catalog.
// Falls back to a rule-based archetype (no LLM) if Gemini is unavailable -
// the mood board always comes from the real DB either way, never empty.
@Service
public class StyleDnaService {

    private static final int TIMEOUT_MS = 15_000;
    private static final String MODEL_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private static final int PER_SLOT_CANDIDATES = 6;
    private static final int CANDIDATE_POOL = 24;
    private static final int MOOD_BOARD_TARGET = 16;
    private static final int MOOD_BOARD_MIN = 12;
    private static final int TOP_PICKS_COUNT = 5;
    private static final double INR_PER_USD = 83.0;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Autowired
    private ProductRepository productRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StyleDnaService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT_MS);
        factory.setReadTimeout(TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);
    }

    private static final Set<String> BASIC_COLORS = Set.of(
            "black", "white", "red", "blue", "green", "yellow", "purple", "pink",
            "orange", "brown", "grey", "gray", "navy", "maroon", "beige", "teal");

    // Same "map fashion shade names down to the catalog's basic colors" trick
    // used in ChatService.COLOR_FAMILY_FALLBACK - Gemini's colorPalette entries
    // are things like "Charcoal"/"Mustard" that never appear verbatim in the
    // seeded product colors.
    private static final Map<String, List<String>> COLOR_FAMILY_FALLBACK = Map.ofEntries(
            Map.entry("coral", List.of("red")),
            Map.entry("mustard", List.of("yellow", "green")),
            Map.entry("charcoal", List.of("black", "grey")),
            Map.entry("cream", List.of("beige", "white")),
            Map.entry("tan", List.of("beige", "brown")),
            Map.entry("burgundy", List.of("maroon", "red")),
            Map.entry("olive", List.of("green")),
            Map.entry("emerald", List.of("green")),
            Map.entry("royal blue", List.of("blue")),
            Map.entry("navy blue", List.of("navy", "blue")),
            Map.entry("lavender", List.of("blue")),
            Map.entry("gold", List.of("yellow", "beige")),
            Map.entry("khaki", List.of("beige", "green")));

    private static final Set<String> KNOWN_OCCASIONS =
            Set.of("office/formal", "casual-everyday", "party/going-out", "ethnic/festive");

    private static final Map<String, List<String>> MEN_TOP_TERMS = Map.of(
            "office/formal", List.of("formal shirt"),
            "casual-everyday", List.of("t-shirt", "casual shirt"),
            "party/going-out", List.of("shirt", "blazer"),
            "ethnic/festive", List.of("kurta"));
    private static final List<String> MEN_TOP_DEFAULT = List.of("shirt", "t-shirt");

    private static final Map<String, List<String>> MEN_BOTTOM_TERMS = Map.of(
            "office/formal", List.of("formal trousers", "chinos"),
            "casual-everyday", List.of("jeans"),
            "party/going-out", List.of("jeans", "trousers"),
            "ethnic/festive", List.of("formal trousers"));
    private static final List<String> MEN_BOTTOM_DEFAULT = List.of("jeans", "trousers");

    private static final Map<String, List<String>> WOMEN_TOP_TERMS = Map.of(
            "office/formal", List.of("top", "blouse"),
            "casual-everyday", List.of("t-shirt", "top"),
            "party/going-out", List.of("dress", "top"),
            "ethnic/festive", List.of("kurti", "anarkali", "saree"));
    private static final List<String> WOMEN_TOP_DEFAULT = List.of("top", "kurti");

    private static final Map<String, List<String>> WOMEN_BOTTOM_TERMS = Map.of(
            "office/formal", List.of("palazzo", "skirt"),
            "casual-everyday", List.of("jeans", "skirt"),
            "party/going-out", List.of("skirt", "dress"),
            "ethnic/festive", List.of("salwar suit", "palazzo"));
    private static final List<String> WOMEN_BOTTOM_DEFAULT = List.of("jeans", "skirt");

    private static final List<String> WOMEN_FOOTWEAR_TERMS =
            List.of("heel", "sandal", "flat", "sneaker", "footwear");

    public Map<String, Object> buildProfile(StyleDnaAnswers answers) {
        StyleDnaProfile profile = callGemini(answers);
        if (profile == null || profile.archetypes == null || profile.archetypes.isEmpty()) {
            profile = fallbackProfile(answers);
        }
        if (profile.colorPalette == null || profile.colorPalette.isEmpty()) {
            profile.colorPalette = fallbackColorPalette(lower(answers.getColorPreference()));
        }

        List<Product> moodBoard = buildMoodBoard(answers, profile.colorPalette);
        List<Product> topPicks = moodBoard.stream()
                .sorted(Comparator.comparingDouble(
                        (Product p) -> p.getRating() != null ? p.getRating() : 0).reversed())
                .limit(TOP_PICKS_COUNT)
                .collect(Collectors.toList());

        Map<String, Object> profileMap = new LinkedHashMap<>();
        profileMap.put("archetypes", profile.archetypes);
        profileMap.put("profileTitle", profile.profileTitle);
        profileMap.put("description", profile.description);
        profileMap.put("colorPalette", profile.colorPalette);
        profileMap.put("keywords", profile.keywords);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile", profileMap);
        response.put("moodBoard", moodBoard);
        response.put("topPicks", topPicks);
        return response;
    }

    @SuppressWarnings("unchecked")
    private StyleDnaProfile callGemini(StyleDnaAnswers answers) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }
        try {
            String prompt = buildPrompt(answers);
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "thinkingConfig", Map.of("thinkingBudget", 0)));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(MODEL_URL, HttpMethod.POST, entity, Map.class);
            String text = extractText(response.getBody());
            if (text == null || text.isBlank()) {
                return null;
            }
            StyleDnaProfile profile = objectMapper.readValue(text, StyleDnaProfile.class);
            normalizePercentages(profile);
            return profile;
        } catch (Exception e) {
            return null;
        }
    }

    private String buildPrompt(StyleDnaAnswers answers) {
        return "You are a fashion analyst for SAMZONE, an Indian e-commerce site. A user answered a short style "
                + "quiz - color preference: " + answers.getColorPreference()
                + ", fit preference: " + answers.getFitPreference()
                + ", occasion focus: " + answers.getOccasionFocus()
                + ", their own words describing their style icon/inspiration: \"" + answers.getStyleIcon() + "\""
                + ", budget range: " + answers.getBudgetRange()
                + ", gender: " + answers.getGender()
                + ". Based on ALL of these answers - especially their own words for style icon - determine their "
                + "personal style DNA. Return ONLY valid JSON in this exact shape: "
                + "{ \"archetypes\": [{\"name\": \"...\", \"percentage\": <integer>}], "
                + "\"profileTitle\": \"The ...\", "
                + "\"description\": \"2-3 sentences, specific to their answers, not generic\", "
                + "\"colorPalette\": [\"...\"], \"keywords\": [\"...\", \"...\", \"...\"] }. "
                + "Use 2-4 archetypes and make the percentages sum to exactly 100. colorPalette entries should be "
                + "common color names (black, white, navy, beige, red, olive, etc).";
    }

    // Gemini is asked for percentages summing to 100 but LLM arithmetic isn't
    // guaranteed - rescale proportionally and force the last entry to absorb
    // any rounding remainder so the UI's percentage bars always add up.
    private void normalizePercentages(StyleDnaProfile profile) {
        if (profile.archetypes == null || profile.archetypes.isEmpty()) {
            return;
        }
        int sum = profile.archetypes.stream().mapToInt(a -> a.percentage != null ? a.percentage : 0).sum();
        if (sum == 100 || sum <= 0) {
            return;
        }
        int running = 0;
        for (int i = 0; i < profile.archetypes.size(); i++) {
            StyleDnaArchetype a = profile.archetypes.get(i);
            int pct = a.percentage != null ? a.percentage : 0;
            if (i == profile.archetypes.size() - 1) {
                a.percentage = 100 - running;
            } else {
                int scaled = (int) Math.round(pct * 100.0 / sum);
                a.percentage = scaled;
                running += scaled;
            }
        }
    }

    private StyleDnaProfile fallbackProfile(StyleDnaAnswers answers) {
        String occasion = lower(answers.getOccasionFocus());
        String fit = lower(answers.getFitPreference());
        String color = lower(answers.getColorPreference());

        String primary;
        if ("ethnic/festive".equals(occasion)) {
            primary = "Traditional Trendsetter";
        } else if ("relaxed/oversized".equals(fit) && "bold".equals(color)) {
            primary = "Bold Streetwear";
        } else if ("office/formal".equals(occasion) && "fitted/tailored".equals(fit)) {
            primary = "Classic Professional";
        } else if ("monochrome".equals(color)) {
            primary = "Modern Minimalist";
        } else if ("pastel".equals(color)) {
            primary = "Soft Romantic";
        } else if ("party/going-out".equals(occasion)) {
            primary = "Bold Trendsetter";
        } else {
            primary = "Versatile Classic";
        }

        List<StyleDnaArchetype> archetypes = new ArrayList<>();
        archetypes.add(new StyleDnaArchetype(primary, 55));
        archetypes.add(new StyleDnaArchetype("Casual Comfort", 30));
        archetypes.add(new StyleDnaArchetype("Trend Explorer", 15));

        List<String> keywords = fallbackKeywords(fit, occasion);
        String styleIcon = answers.getStyleIcon();
        String styleIconPart = (styleIcon != null && !styleIcon.isBlank())
                ? " Inspired by your own words - \"" + styleIcon + "\" - that comes through in pieces with "
                        + String.join(" and ", keywords.subList(0, Math.min(2, keywords.size()))) + "."
                : "";
        String description = "Your style leans toward " + (occasion != null ? occasion : "versatile")
                + " looks with a " + (fit != null ? fit : "balanced") + " silhouette, built around "
                + (color != null ? color : "neutral") + " tones." + styleIconPart;

        StyleDnaProfile profile = new StyleDnaProfile();
        profile.archetypes = archetypes;
        profile.profileTitle = "The " + primary;
        profile.description = description;
        profile.colorPalette = fallbackColorPalette(color);
        profile.keywords = keywords;
        return profile;
    }

    private List<String> fallbackColorPalette(String color) {
        if (color == null) {
            return List.of("Black", "White", "Beige");
        }
        switch (color) {
            case "bold": return List.of("Red", "Black", "Yellow");
            case "neutral": return List.of("Beige", "Grey", "White");
            case "pastel": return List.of("Pink", "White", "Blue");
            case "monochrome": return List.of("Black", "White", "Grey");
            default: return List.of("Black", "White", "Beige");
        }
    }

    private List<String> fallbackKeywords(String fit, String occasion) {
        List<String> keywords = new ArrayList<>();
        if ("relaxed/oversized".equals(fit)) {
            keywords.add("relaxed silhouettes");
        } else if ("fitted/tailored".equals(fit)) {
            keywords.add("tailored fit");
        } else {
            keywords.add("easy layering");
        }
        if ("office/formal".equals(occasion)) {
            keywords.add("polished basics");
        } else if ("ethnic/festive".equals(occasion)) {
            keywords.add("festive craftsmanship");
        } else if ("party/going-out".equals(occasion)) {
            keywords.add("statement pieces");
        } else {
            keywords.add("everyday comfort");
        }
        keywords.add("quality basics");
        return keywords;
    }

    private String lower(String s) {
        return (s == null || s.isBlank()) ? null : s.trim().toLowerCase();
    }

    private List<Product> buildMoodBoard(StyleDnaAnswers answers, List<String> colorPalette) {
        boolean isWomen = "women".equalsIgnoreCase(answers.getGender());
        String occasionKey = normalizeOccasionKey(answers.getOccasionFocus());
        Double maxPriceUsd = budgetToMaxUsd(answers.getBudgetRange());

        List<ProductSlot> slots = isWomen
                ? List.of(
                        new ProductSlot("Women's Clothing", termsFor(WOMEN_TOP_TERMS, WOMEN_TOP_DEFAULT, occasionKey)),
                        new ProductSlot("Women's Clothing", termsFor(WOMEN_BOTTOM_TERMS, WOMEN_BOTTOM_DEFAULT, occasionKey)),
                        new ProductSlot("Accessories", WOMEN_FOOTWEAR_TERMS),
                        new ProductSlot("Accessories", List.of()))
                : List.of(
                        new ProductSlot("Men's Clothing", termsFor(MEN_TOP_TERMS, MEN_TOP_DEFAULT, occasionKey)),
                        new ProductSlot("Men's Clothing", termsFor(MEN_BOTTOM_TERMS, MEN_BOTTOM_DEFAULT, occasionKey)),
                        new ProductSlot("Men's Footwear", List.of()),
                        new ProductSlot("Accessories", List.of()));

        List<List<Product>> perSlotCandidates = new ArrayList<>();
        for (ProductSlot slot : slots) {
            perSlotCandidates.add(fetchSlotProducts(slot.category, slot.terms, colorPalette, maxPriceUsd));
        }

        List<Product> moodBoard = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        roundRobinFill(moodBoard, seen, perSlotCandidates, MOOD_BOARD_TARGET);

        // Still short (tight color+budget combo starved every slot) - widen the
        // net ignoring color/budget so the mood board is never sparse/empty.
        if (moodBoard.size() < MOOD_BOARD_MIN) {
            List<List<Product>> widerCandidates = new ArrayList<>();
            for (ProductSlot slot : slots) {
                widerCandidates.add(fetchSlotProducts(slot.category, slot.terms, null, null));
            }
            roundRobinFill(moodBoard, seen, widerCandidates, MOOD_BOARD_MIN);
        }
        return moodBoard;
    }

    // Fills round-robin (one item from each slot's candidate list per pass)
    // instead of greedily draining the first slots first - otherwise 3 slots
    // at PER_SLOT_CANDIDATES=6 each (18) reach the target before the 4th slot
    // (e.g. accessories) ever contributes, leaving the mood board without
    // representation across all categories.
    private void roundRobinFill(List<Product> moodBoard, Set<Long> seen, List<List<Product>> perSlotCandidates,
            int target) {
        int idx = 0;
        boolean addedAny = true;
        while (moodBoard.size() < target && addedAny) {
            addedAny = false;
            for (List<Product> candidates : perSlotCandidates) {
                if (moodBoard.size() >= target) {
                    break;
                }
                if (idx < candidates.size()) {
                    Product p = candidates.get(idx);
                    if (seen.add(p.getId())) {
                        moodBoard.add(p);
                        addedAny = true;
                    }
                }
            }
            idx++;
        }
    }

    private List<Product> fetchSlotProducts(String category, List<String> terms, List<String> colorPalette,
            Double maxPriceUsd) {
        // Pull a wide candidate pool per term before filtering by color - fetching
        // only a handful of top-rated rows and then filtering by color routinely
        // throws away every real match (see ChatService.findByColorAndTarget for
        // the same bug found and fixed there).
        Pageable pool = PageRequest.of(0, CANDIDATE_POOL, Sort.by("rating").descending());
        List<Product> candidates = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        List<String> termList = terms.isEmpty() ? java.util.Collections.singletonList(null) : terms;
        for (String term : termList) {
            List<Product> matches = productRepository
                    .findByFilters(category, null, term, null, maxPriceUsd, null, pool)
                    .getContent();
            for (Product p : matches) {
                if (seen.add(p.getId())) {
                    candidates.add(p);
                }
            }
        }

        if (candidates.isEmpty() && maxPriceUsd != null) {
            return fetchSlotProducts(category, terms, colorPalette, null);
        }

        if (colorPalette != null && !colorPalette.isEmpty()) {
            List<Product> colorFiltered = candidates.stream()
                    .filter(p -> matchesAnyColor(p, colorPalette))
                    .limit(PER_SLOT_CANDIDATES)
                    .collect(Collectors.toList());
            if (!colorFiltered.isEmpty()) {
                return colorFiltered;
            }
        }

        return candidates.stream().limit(PER_SLOT_CANDIDATES).collect(Collectors.toList());
    }

    private boolean matchesAnyColor(Product product, List<String> colorPalette) {
        for (String color : colorPalette) {
            for (String candidate : resolveColorCandidates(color)) {
                if (matchesColor(product, candidate)) {
                    return true;
                }
            }
        }
        return false;
    }

    private List<String> resolveColorCandidates(String colorWord) {
        String lower = colorWord.toLowerCase();
        List<String> candidates = new ArrayList<>();
        candidates.add(lower);
        candidates.addAll(COLOR_FAMILY_FALLBACK.getOrDefault(lower, List.of()));
        for (String word : lower.split("\\s+")) {
            if (BASIC_COLORS.contains(word) && !candidates.contains(word)) {
                candidates.add(word);
            }
        }
        return candidates;
    }

    private boolean matchesColor(Product product, String colorLower) {
        if (product.getColors() != null
                && product.getColors().stream().anyMatch(c -> c != null && c.toLowerCase().contains(colorLower))) {
            return true;
        }
        return product.getName() != null && product.getName().toLowerCase().contains(colorLower);
    }

    private String normalizeOccasionKey(String occasionFocus) {
        if (occasionFocus == null) {
            return null;
        }
        String lower = occasionFocus.trim().toLowerCase();
        return KNOWN_OCCASIONS.contains(lower) ? lower : null;
    }

    private List<String> termsFor(Map<String, List<String>> byOccasion, List<String> defaultTerms, String occasionKey) {
        return occasionKey != null ? byOccasion.getOrDefault(occasionKey, defaultTerms) : defaultTerms;
    }

    private Double budgetToMaxUsd(String budgetRange) {
        if (budgetRange == null) {
            return null;
        }
        switch (budgetRange.trim().toLowerCase()) {
            case "budget": return 1500.0 / INR_PER_USD;
            case "mid-range": case "mid": return 6000.0 / INR_PER_USD;
            default: return null; // premium, or unrecognized - no cap
        }
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

    private static class ProductSlot {
        final String category;
        final List<String> terms;

        ProductSlot(String category, List<String> terms) {
            this.category = category;
            this.terms = terms;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class StyleDnaProfile {
        public List<StyleDnaArchetype> archetypes;
        public String profileTitle;
        public String description;
        public List<String> colorPalette;
        public List<String> keywords;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class StyleDnaArchetype {
        public String name;
        public Integer percentage;

        public StyleDnaArchetype() {
        }

        StyleDnaArchetype(String name, Integer percentage) {
            this.name = name;
            this.percentage = percentage;
        }
    }
}
