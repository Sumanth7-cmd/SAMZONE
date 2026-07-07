package com.samzone.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.samzone.backend.dto.OutfitPick;
import com.samzone.backend.dto.OutfitStylistRequest;
import com.samzone.backend.dto.OutfitStylistResponse;
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
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    // Outfit builder ("/api/stylist"): occasion + gender + budget -> one pick per
    // slot, across the real catalog. Its own timeout (15s, vs 30s for complete-look)
    // since it's text-only and should feel instant next to image generation.
    private static final int OUTFIT_TIMEOUT_MS = 15_000;
    private static final int CANDIDATES_PER_SLOT = 5;
    private static final double INR_PER_USD = 83.0;
    private static final String GENERIC_FALLBACK_EXPLANATION =
            "A coordinated pick from top-rated pieces within your budget - neutral tones here mix and "
                    + "match easily, so feel free to swap in your own favorites from the same colour family.";

    private static final Set<String> KNOWN_OCCASIONS = Set.of(
            "wedding", "birthday", "office", "festival", "college", "travel", "casual");

    private static final Map<String, List<String>> MEN_TOP_TERMS = Map.of(
            "wedding", List.of("sherwani", "kurta"),
            "office", List.of("formal shirt"),
            "festival", List.of("kurta"),
            "college", List.of("t-shirt", "hoodie"),
            "travel", List.of("t-shirt", "hoodie"),
            "casual", List.of("t-shirt", "casual shirt"),
            "birthday", List.of("shirt", "t-shirt"));
    private static final List<String> MEN_TOP_DEFAULT = List.of("shirt", "t-shirt");

    private static final Map<String, List<String>> MEN_BOTTOM_TERMS = Map.of(
            "wedding", List.of("formal trousers"),
            "office", List.of("formal trousers", "chinos"),
            "festival", List.of("formal trousers"),
            "college", List.of("jeans", "track pants"),
            "travel", List.of("track pants", "jeans"),
            "casual", List.of("jeans", "shorts"),
            "birthday", List.of("jeans", "chinos"));
    private static final List<String> MEN_BOTTOM_DEFAULT = List.of("jeans", "trousers");

    private static final Map<String, List<String>> WOMEN_TOP_TERMS = Map.of(
            "wedding", List.of("lehenga", "saree", "anarkali"),
            "office", List.of("top", "blouse"),
            "festival", List.of("kurti", "anarkali", "saree"),
            "college", List.of("t-shirt", "top"),
            "travel", List.of("t-shirt", "top"),
            "casual", List.of("t-shirt", "top"),
            "birthday", List.of("dress", "top"));
    private static final List<String> WOMEN_TOP_DEFAULT = List.of("top", "kurti");

    private static final Map<String, List<String>> WOMEN_BOTTOM_TERMS = Map.of(
            "wedding", List.of("salwar suit", "skirt"),
            "office", List.of("palazzo", "skirt"),
            "festival", List.of("salwar suit", "palazzo"),
            "college", List.of("jeans", "skirt"),
            "travel", List.of("jeans", "palazzo"),
            "casual", List.of("jeans", "skirt"),
            "birthday", List.of("skirt", "jeans"));
    private static final List<String> WOMEN_BOTTOM_DEFAULT = List.of("jeans", "skirt");

    private static final List<String> WOMEN_FOOTWEAR_TERMS =
            List.of("heel", "sandal", "flat", "footwear", "sneaker");

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Autowired
    private ProductRepository productRepository;

    private final RestTemplate restTemplate;
    private final RestTemplate outfitRestTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StylistService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT_MS);
        factory.setReadTimeout(TIMEOUT_MS);
        this.restTemplate = new RestTemplate(factory);

        SimpleClientHttpRequestFactory outfitFactory = new SimpleClientHttpRequestFactory();
        outfitFactory.setConnectTimeout(OUTFIT_TIMEOUT_MS);
        outfitFactory.setReadTimeout(OUTFIT_TIMEOUT_MS);
        this.outfitRestTemplate = new RestTemplate(outfitFactory);
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

    // Outfit builder: occasion + gender + budget + optional color -> one product
    // per slot (topwear, bottomwear, footwear, accessory), pulled from the real
    // catalog and coordinated by Gemini. Never returns an empty/error response -
    // falls back to a top-rated-within-budget pick per slot if Gemini is
    // unavailable or the model call fails.
    public Map<String, Object> buildOutfit(OutfitStylistRequest request) {
        boolean isWomen = "women".equalsIgnoreCase(request.getGender());
        String occasionKey = normalizeOccasion(request.getOccasion());
        Double budgetUsd = request.getBudget() != null ? request.getBudget() / INR_PER_USD : null;

        List<OutfitSlot> slots = buildSlots(isWomen, occasionKey, budgetUsd);
        if (request.getPreferredColor() != null && !request.getPreferredColor().isBlank()) {
            preferColor(slots, request.getPreferredColor());
        }

        if (slots.isEmpty()) {
            return buildOutfitResponse(List.of(),
                    "We couldn't find products in this budget right now - try raising the budget a bit.", 0);
        }

        OutfitStylistResponse aiResponse = callGeminiForOutfit(request, slots);
        List<Product> outfit = null;
        String explanation = null;
        if (aiResponse != null && aiResponse.getPicks() != null && !aiResponse.getPicks().isEmpty()) {
            outfit = resolveOutfitPicks(aiResponse.getPicks(), slots);
            explanation = aiResponse.getExplanation();
        }

        if (outfit == null || outfit.isEmpty()) {
            outfit = fallbackOutfit(slots, budgetUsd);
            explanation = GENERIC_FALLBACK_EXPLANATION;
        }

        double totalPriceUsd = outfit.stream().mapToDouble(Product::getPrice).sum();
        return buildOutfitResponse(outfit, explanation, totalPriceUsd);
    }

    private String normalizeOccasion(String occasion) {
        if (occasion == null) {
            return null;
        }
        String lower = occasion.toLowerCase();
        return KNOWN_OCCASIONS.stream().filter(lower::contains).findFirst().orElse(null);
    }

    private List<String> termsFor(Map<String, List<String>> byOccasion, List<String> defaultTerms, String occasionKey) {
        return occasionKey != null ? byOccasion.getOrDefault(occasionKey, defaultTerms) : defaultTerms;
    }

    private List<OutfitSlot> buildSlots(boolean isWomen, String occasionKey, Double budgetUsd) {
        List<OutfitSlot> slots = new ArrayList<>();
        if (isWomen) {
            slots.add(new OutfitSlot("topwear", fetchSlotCandidates("Women's Clothing",
                    termsFor(WOMEN_TOP_TERMS, WOMEN_TOP_DEFAULT, occasionKey), budgetUsd)));
            slots.add(new OutfitSlot("bottomwear", fetchSlotCandidates("Women's Clothing",
                    termsFor(WOMEN_BOTTOM_TERMS, WOMEN_BOTTOM_DEFAULT, occasionKey), budgetUsd)));
            slots.add(new OutfitSlot("footwear", fetchSlotCandidates("Accessories", WOMEN_FOOTWEAR_TERMS, budgetUsd)));
            slots.add(new OutfitSlot("accessory", fetchSlotCandidates("Accessories", List.of(), budgetUsd)));

            Set<Long> footwearIds = slots.get(2).candidates.stream().map(Product::getId).collect(Collectors.toSet());
            List<Product> accessoryOnly = slots.get(3).candidates.stream()
                    .filter(p -> !footwearIds.contains(p.getId())).collect(Collectors.toList());
            if (!accessoryOnly.isEmpty()) {
                slots.set(3, new OutfitSlot("accessory", accessoryOnly));
            }
        } else {
            slots.add(new OutfitSlot("topwear", fetchSlotCandidates("Men's Clothing",
                    termsFor(MEN_TOP_TERMS, MEN_TOP_DEFAULT, occasionKey), budgetUsd)));
            slots.add(new OutfitSlot("bottomwear", fetchSlotCandidates("Men's Clothing",
                    termsFor(MEN_BOTTOM_TERMS, MEN_BOTTOM_DEFAULT, occasionKey), budgetUsd)));
            slots.add(new OutfitSlot("footwear", fetchSlotCandidates("Men's Footwear", List.of(), budgetUsd)));
            slots.add(new OutfitSlot("accessory", fetchSlotCandidates("Accessories", List.of(), budgetUsd)));
        }
        return slots.stream().filter(s -> !s.candidates.isEmpty()).collect(Collectors.toList());
    }

    private List<Product> fetchSlotCandidates(String category, List<String> terms, Double maxPriceUsd) {
        // Once we've had to drop the budget cap because nothing matched, sort by
        // price ascending instead of rating - otherwise a wildly overpriced outlier
        // (e.g. a mis-scaled import) can win purely on rating and blow the budget.
        Sort sort = maxPriceUsd != null ? Sort.by("rating").descending() : Sort.by("price").ascending();
        Pageable pageable = PageRequest.of(0, CANDIDATES_PER_SLOT, sort);
        Map<Long, Product> found = new LinkedHashMap<>();

        if (terms.isEmpty()) {
            productRepository.findByFilters(category, null, null, null, maxPriceUsd, null, pageable)
                    .forEach(p -> found.putIfAbsent(p.getId(), p));
        } else {
            for (String term : terms) {
                if (found.size() >= CANDIDATES_PER_SLOT) {
                    break;
                }
                productRepository.findByFilters(category, null, term, null, maxPriceUsd, null, pageable)
                        .forEach(p -> found.putIfAbsent(p.getId(), p));
            }
        }

        if (found.isEmpty() && maxPriceUsd != null) {
            return fetchSlotCandidates(category, terms, null);
        }
        return new ArrayList<>(found.values());
    }

    private void preferColor(List<OutfitSlot> slots, String preferredColor) {
        String colorLower = preferredColor.toLowerCase();
        for (OutfitSlot slot : slots) {
            slot.candidates.sort(Comparator.comparingInt(p -> matchesColor(p, colorLower) ? 0 : 1));
        }
    }

    private boolean matchesColor(Product product, String colorLower) {
        return product.getColors() != null
                && product.getColors().stream().anyMatch(c -> c.toLowerCase().contains(colorLower));
    }

    @SuppressWarnings("unchecked")
    private OutfitStylistResponse callGeminiForOutfit(OutfitStylistRequest request, List<OutfitSlot> slots) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }
        try {
            String prompt = buildOutfitPrompt(request, slots);
            // Disabling "thinking" cuts latency from ~25s to ~2s for this prompt size -
            // needed to keep this endpoint feeling instant next to image generation.
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "thinkingConfig", Map.of("thinkingBudget", 0)));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = outfitRestTemplate.exchange(MODEL_URL, HttpMethod.POST, entity, Map.class);
            String text = extractText(response.getBody());
            if (text == null || text.isBlank()) {
                return null;
            }
            return objectMapper.readValue(text, OutfitStylistResponse.class);
        } catch (Exception e) {
            return null;
        }
    }

    private String buildOutfitPrompt(OutfitStylistRequest request, List<OutfitSlot> slots) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a fashion stylist for SAMZONE, an Indian e-commerce site. From these real ")
                .append("products, assemble ONE coordinated outfit for occasion: ").append(request.getOccasion())
                .append(", gender: ").append(request.getGender());
        if (request.getBudget() != null) {
            sb.append(", budget: ₹").append(Math.round(request.getBudget()));
        }
        if (request.getPreferredColor() != null && !request.getPreferredColor().isBlank()) {
            sb.append(", preferred color: ").append(request.getPreferredColor());
        }
        sb.append(". Pick exactly ONE product from EACH slot below so they work well together - ")
                .append("consider color coordination, occasion-appropriateness, and try to keep the combined ")
                .append("total within the budget. Candidates:\n");
        for (OutfitSlot slot : slots) {
            sb.append(slot.label).append(": [")
                    .append(slot.candidates.stream()
                            .map(p -> String.format("{\"productId\": %d, \"name\": \"%s\", \"price\": %d}",
                                    p.getId(), p.getName().replace("\"", "'"), Math.round(p.getPrice() * INR_PER_USD)))
                            .collect(Collectors.joining(", ")))
                    .append("]\n");
        }
        sb.append("Explain in 2-3 sentences why this exact combination works. Return ONLY valid JSON: ")
                .append("{ \"picks\": [{\"slot\": \"<slot name>\", \"productId\": <id>}], \"explanation\": \"...\" }");
        return sb.toString();
    }

    private List<Product> resolveOutfitPicks(List<OutfitPick> picks, List<OutfitSlot> slots) {
        Map<String, Map<Long, Product>> bySlot = new LinkedHashMap<>();
        Map<Long, Product> allById = new LinkedHashMap<>();
        for (OutfitSlot slot : slots) {
            Map<Long, Product> byId = slot.candidates.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a, LinkedHashMap::new));
            bySlot.put(slot.label, byId);
            allById.putAll(byId);
        }

        List<Product> resolved = new ArrayList<>();
        Set<Long> used = new HashSet<>();
        for (OutfitPick pick : picks) {
            if (pick.getProductId() == null) {
                continue;
            }
            Map<Long, Product> slotMap = bySlot.get(pick.getSlot());
            Product matched = slotMap != null ? slotMap.get(pick.getProductId()) : null;
            if (matched == null) {
                matched = allById.get(pick.getProductId());
            }
            if (matched != null && used.add(matched.getId())) {
                resolved.add(matched);
            }
        }
        return resolved;
    }

    private List<Product> fallbackOutfit(List<OutfitSlot> slots, Double budgetUsd) {
        List<Product> picks = new ArrayList<>();
        for (OutfitSlot slot : slots) {
            picks.add(slot.candidates.get(0));
        }
        if (budgetUsd == null) {
            return picks;
        }

        double total = picks.stream().mapToDouble(Product::getPrice).sum();
        for (int attempt = 0; attempt < picks.size() && total > budgetUsd; attempt++) {
            int priciestIdx = 0;
            for (int i = 1; i < picks.size(); i++) {
                if (picks.get(i).getPrice() > picks.get(priciestIdx).getPrice()) {
                    priciestIdx = i;
                }
            }
            Product cheapest = slots.get(priciestIdx).candidates.stream()
                    .min(Comparator.comparingDouble(Product::getPrice)).orElse(picks.get(priciestIdx));
            total = total - picks.get(priciestIdx).getPrice() + cheapest.getPrice();
            picks.set(priciestIdx, cheapest);
        }
        return picks;
    }

    private Map<String, Object> buildOutfitResponse(List<Product> outfit, String explanation, double totalPriceUsd) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("outfit", outfit);
        response.put("explanation", explanation);
        response.put("totalPrice", totalPriceUsd);
        return response;
    }

    private static class OutfitSlot {
        final String label;
        final List<Product> candidates;

        OutfitSlot(String label, List<Product> candidates) {
            this.label = label;
            this.candidates = candidates;
        }
    }
}
