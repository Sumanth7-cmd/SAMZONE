package com.samzone.backend.service;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

// Not run on startup - triggered on demand via POST /api/admin/seed-fashion.
// Fills out catalog variety (suits, sarees, hoodies, kurtas...) that the
// Amazon/Myntra CSV imports don't have, so occasion search, try-on product
// pickers, and the chatbot have real fashion items to surface.
@Service
public class FashionCatalogSeeder {

    private static final int PRODUCTS_PER_TYPE = 13;
    private static final int BATCH_SIZE = 100;

    @Autowired
    private ProductRepository productRepository;

    private static final List<String> MEN_TYPES = List.of(
            "Formal Suit", "Blazer", "Formal Shirt", "Casual Shirt", "T-Shirt", "Hoodie",
            "Sweatshirt", "Kurta", "Sherwani", "Nehru Jacket", "Jeans", "Chinos",
            "Formal Trousers", "Track Pants", "Shorts");

    private static final List<String> WOMEN_TYPES = List.of(
            "Saree", "Lehenga", "Kurti", "Anarkali", "Salwar Suit", "Dress", "Gown", "Top",
            "Blouse", "Jeans", "Palazzo", "Skirt", "Hoodie", "Blazer", "T-Shirt");

    private static final List<String> BRANDS = List.of(
            "Raymond", "Allen Solly", "Van Heusen", "Peter England", "Manyavar", "FabIndia",
            "Biba", "W", "Libas", "H&M", "Zara", "Levis", "US Polo", "Roadster", "HRX");

    private static final List<String> COLORS = List.of(
            "Black", "White", "Navy", "Maroon", "Beige", "Green", "Red", "Pink", "Yellow", "Grey");

    private static final List<String> OCCASIONS = List.of(
            "wedding", "party", "office", "casual", "festival", "birthday", "college", "travel");

    private static final Map<String, String> OCCASION_PHRASE = Map.of(
            "wedding", "Perfect for wedding celebrations and festive occasions.",
            "party", "Perfect for party nights and celebrations.",
            "office", "Perfect for office wear and formal meetings.",
            "casual", "Perfect for casual outings and everyday comfort.",
            "festival", "Perfect for festival celebrations and traditional gatherings.",
            "birthday", "Perfect for birthday parties and fun celebrations.",
            "college", "Perfect for college days and casual campus style.",
            "travel", "Perfect for travel days and on-the-go comfort.");

    // {min, max} USD price per garment type, approximating the four price
    // tiers from the spec (suits/sherwanis/lehengas, sarees/gowns/blazers,
    // shirts/kurtas/dresses, t-shirts/tops) across every type in the matrix.
    private static final Map<String, double[]> PRICE_RANGE = Map.ofEntries(
            Map.entry("Formal Suit", new double[]{30, 90}),
            Map.entry("Sherwani", new double[]{30, 90}),
            Map.entry("Lehenga", new double[]{30, 90}),
            Map.entry("Saree", new double[]{15, 50}),
            Map.entry("Gown", new double[]{15, 50}),
            Map.entry("Blazer", new double[]{15, 50}),
            Map.entry("Nehru Jacket", new double[]{15, 50}),
            Map.entry("Formal Shirt", new double[]{6, 20}),
            Map.entry("Casual Shirt", new double[]{6, 20}),
            Map.entry("Kurta", new double[]{6, 20}),
            Map.entry("Kurti", new double[]{6, 20}),
            Map.entry("Anarkali", new double[]{6, 20}),
            Map.entry("Salwar Suit", new double[]{6, 20}),
            Map.entry("Dress", new double[]{6, 20}),
            Map.entry("Hoodie", new double[]{6, 20}),
            Map.entry("Sweatshirt", new double[]{6, 20}),
            Map.entry("Jeans", new double[]{6, 20}),
            Map.entry("Chinos", new double[]{6, 20}),
            Map.entry("Formal Trousers", new double[]{6, 20}),
            Map.entry("Track Pants", new double[]{6, 20}),
            Map.entry("Palazzo", new double[]{6, 20}),
            Map.entry("Skirt", new double[]{6, 20}),
            Map.entry("T-Shirt", new double[]{3, 10}),
            Map.entry("Top", new double[]{3, 10}),
            Map.entry("Blouse", new double[]{3, 10}),
            Map.entry("Shorts", new double[]{3, 10}));

    private final Random random = new Random(42);

    @Transactional
    public int seed() {
        int inserted = 0;
        List<Product> batch = new ArrayList<>();

        inserted += seedGender("Men", MEN_TYPES, "Men's Clothing", batch);
        inserted += seedGender("Women", WOMEN_TYPES, "Women's Clothing", batch);

        if (!batch.isEmpty()) {
            productRepository.saveAll(batch);
        }

        return inserted;
    }

    private int seedGender(String gender, List<String> types, String category, List<Product> batch) {
        int inserted = 0;
        for (String type : types) {
            String externalIdPrefix = "FASHION-" + gender.toUpperCase()
                    + "-" + type.toUpperCase().replace(" ", "-").replace("'", "");

            for (int i = 1; i <= PRODUCTS_PER_TYPE; i++) {
                String externalId = externalIdPrefix + "-" + i;
                if (productRepository.existsByExternalId(externalId)) {
                    continue;
                }

                Product product = buildProduct(gender, type, category, externalId, i);
                batch.add(product);
                inserted++;

                if (batch.size() >= BATCH_SIZE) {
                    productRepository.saveAll(batch);
                    batch.clear();
                }
            }
        }
        return inserted;
    }

    private Product buildProduct(String gender, String type, String category, String externalId, int index) {
        String brand = BRANDS.get(random.nextInt(BRANDS.size()));
        List<String> colors = pickColors();
        String occasion = OCCASIONS.get(random.nextInt(OCCASIONS.size()));
        String primaryColor = colors.get(0);

        String name = String.format("%s %s %s %s - %s Wear", brand, gender, primaryColor, type, capitalize(occasion));

        double[] range = PRICE_RANGE.getOrDefault(type, new double[]{6, 20});
        double price = round2(range[0] + random.nextDouble() * (range[1] - range[0]));

        double rating = round1(3.8 + random.nextDouble() * 1.2);
        int stock = 20 + random.nextInt(131);

        Product product = new Product();
        product.setExternalId(externalId);
        product.setName(name);
        product.setBrand(brand);
        product.setCategory(category);
        product.setPrice(price);
        product.setDiscount(0.0);
        product.setRating(rating);
        product.setStock(stock);
        product.setDescription(brand + " presents this stylish " + primaryColor.toLowerCase()
                + " " + type.toLowerCase() + " crafted for " + gender.toLowerCase() + " fashion. "
                + OCCASION_PHRASE.get(occasion));
        product.setSpecifications(null);
        product.setImages(List.of(CategoryImages.getImageForGarmentType(type, category, name)));
        product.setColors(colors);
        product.setSizes("Saree".equals(type) ? List.of("Free Size") : List.of("XS", "S", "M", "L", "XL", "XXL"));

        return product;
    }

    private List<String> pickColors() {
        int count = 2 + random.nextInt(2); // 2 or 3
        Set<String> picked = new LinkedHashSet<>();
        while (picked.size() < count) {
            picked.add(COLORS.get(random.nextInt(COLORS.size())));
        }
        return new ArrayList<>(picked);
    }

    private String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
