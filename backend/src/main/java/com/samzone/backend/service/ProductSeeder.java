package com.samzone.backend.service;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.ArrayList;

@Service
public class ProductSeeder {

    @Autowired
    private ProductRepository productRepository;

    private final Random random = new Random();

    public void seedProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        String[] brands = {
            "Urban Style", "Classic Wear", "TechNova", "SmartGear", "HomeCraft",
            "SportPro", "EcoFit", "LuxLine", "FastTrack", "BlueOcean",
            "Nike", "Adidas", "Puma", "Reebok", "Gucci", "Prada", "H&M",
            "Zara", "Apple", "Samsung", "Sony", "LG", "Dell", "HP",
            "IKEA", "Pottery Barn", "West Elm", "Lululemon", "Under Armour"
        };

        String[] colors = {"Red", "Blue", "Green", "Black", "White", "Gray", "Brown", "Pink", "Yellow", "Purple", "Orange", "Navy", "Beige", "Maroon", "Teal"};
        String[] sizes = {"XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36", "38", "40"};

        // Initialize counters for category distribution
        int shirtCount = 0, pantCount = 0, shoeCount = 0, accessoryCount = 0, gadgetCount = 0;

        for (int i = 1; i <= 800; i++) {
            Product product = new Product();
            
            // Determine category based on distribution
            String category;
            if (shirtCount < 200) {
                category = "Shirts";
                shirtCount++;
            } else if (pantCount < 200) {
                category = "Pants";
                pantCount++;
            } else if (shoeCount < 150) {
                category = "Shoes";
                shoeCount++;
            } else if (accessoryCount < 100) {
                category = "Accessories";
                accessoryCount++;
            } else {
                category = "Gadgets";
                gadgetCount++;
            }
            
            product.setName(generateProductName(i, category));
            product.setBrand(brands[random.nextInt(brands.length)]);
            product.setCategory(category);
            product.setPrice(200 + random.nextDouble() * 18000);
            product.setDiscount(random.nextDouble() * 50);
            product.setRating(3.0 + random.nextDouble() * 2);
            product.setStock(random.nextInt(200));
            product.setImages(List.of(
                "https://picsum.photos/seed/product" + i + "a/400/400.jpg",
                "https://picsum.photos/seed/product" + i + "b/400/400.jpg"
            ));
            
            // Add colors and sizes based on category
            java.util.List<String> productColors = new java.util.ArrayList<>();
            java.util.List<String> productSizes = new java.util.ArrayList<>();
            
            switch (category) {
                case "Shirts":
                    productColors.add("White");
                    productColors.add("Blue");
                    productColors.add("Black");
                    productSizes.add("S");
                    productSizes.add("M");
                    productSizes.add("L");
                    productSizes.add("XL");
                    break;
                case "Pants":
                    productColors.add("Blue");
                    productColors.add("Black");
                    productColors.add("Khaki");
                    productSizes.add("30");
                    productSizes.add("32");
                    productSizes.add("34");
                    productSizes.add("36");
                    break;
                case "Shoes":
                    productColors.add("White");
                    productColors.add("Black");
                    productColors.add("Brown");
                    productSizes.add("8");
                    productSizes.add("9");
                    productSizes.add("10");
                    productSizes.add("11");
                    break;
                case "Accessories":
                    productColors.add("Black");
                    productColors.add("Brown");
                    productColors.add("Silver");
                    productSizes.add("One Size");
                    break;
                case "Gadgets":
                    productColors.add("Black");
                    productColors.add("White");
                    productColors.add("Silver");
                    productSizes.add("Standard");
                    break;
            }
            
            product.setColors(productColors);
            product.setSizes(productSizes);
            product.setDescription(generateDescription(category));
            
            productRepository.save(product);
        }
    }

    private String generateProductName(int id, String category) {
        String[] prefixes = {"Classic", "Modern", "Premium", "Eco", "Smart", "Ultra", "Pro", "Flex", "Fit", "Style"};
        String prefix = prefixes[id % prefixes.length];
        return prefix + " " + category + " " + id;
    }

    private List<String> generateSizesForCategory(String category) {
        String[] allSizes = {"XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36", "38", "40"};
        List<String> sizes = new java.util.ArrayList<>();
        
        if (category.contains("Shoes") || category.contains("Sneakers") || category.contains("Sandals")) {
            String[] shoeSizes = {"6", "7", "8", "9", "10", "11", "12"};
            sizes.add(shoeSizes[random.nextInt(shoeSizes.length)]);
            sizes.add(shoeSizes[random.nextInt(shoeSizes.length)]);
        } else if (category.contains("Pants") || category.contains("Jeans")) {
            String[] pantSizes = {"30", "32", "34", "36", "38", "40"};
            sizes.add(pantSizes[random.nextInt(pantSizes.length)]);
            sizes.add(pantSizes[random.nextInt(pantSizes.length)]);
        } else if (category.contains("Shirts") || category.contains("T-shirts") || category.contains("Dresses") || category.contains("Shorts")) {
            String[] clothingSizes = {"XS", "S", "M", "L", "XL", "XXL"};
            sizes.add(clothingSizes[random.nextInt(clothingSizes.length)]);
            sizes.add(clothingSizes[random.nextInt(clothingSizes.length)]);
        } else {
            sizes.add(allSizes[random.nextInt(allSizes.length)]);
            sizes.add(allSizes[random.nextInt(allSizes.length)]);
        }
        
        return sizes.stream().distinct().limit(3).collect(java.util.stream.Collectors.toList());
    }

    private List<String> generateColorsForCategory(String category) {
        String[] colors = {"Red", "Blue", "Green", "Black", "White", "Gray", "Brown", "Pink", "Yellow", "Purple", "Orange", "Navy", "Beige", "Maroon", "Teal"};
        List<String> selectedColors = new java.util.ArrayList<>();
        
        int numColors = 1 + random.nextInt(3);
        for (int i = 0; i < numColors; i++) {
            selectedColors.add(colors[random.nextInt(colors.length)]);
        }
        
        return selectedColors.stream().distinct().collect(java.util.stream.Collectors.toList());
    }

    private String generateDescription(String category) {
        switch (category) {
            case "Shirts":
                return "Premium quality shirt perfect for any occasion. Made from comfortable materials.";
            case "Pants":
                return "Stylish pants with perfect fit and modern design.";
            case "Shoes":
                return "Comfortable footwear with excellent support and style.";
            case "Accessories":
                return "Fashionable accessory to complete your look.";
            case "Gadgets":
                return "Latest technology with innovative features.";
            default:
                return "High-quality product with modern design.";
        }
    }

    private String generateSpecifications(String category) {
        if (category.contains("Shirts") || category.contains("T-shirts") || category.contains("Pants") || category.contains("Jeans") || category.contains("Dresses")) {
            return "Material: Premium Cotton Blend\nCare: Machine Wash Cold\nOrigin: Made in India\nFit: Regular";
        } else if (category.contains("Shoes") || category.contains("Sneakers")) {
            return "Material: Synthetic & Mesh\nCare: Spot Clean\nOrigin: Imported\nSole: Rubber";
        } else if (category.contains("Electronics") || category.contains("Headphones") || category.contains("Phones") || category.contains("Tablets")) {
            return "Warranty: 1 Year\nPower: USB Powered\nCompatibility: Universal\nOrigin: China";
        } else if (category.contains("Home") || category.contains("Furniture") || category.contains("Decor") || category.contains("Kitchen")) {
            return "Material: Premium Quality\nCare: Wipe Clean\nOrigin: Made in India\nAssembly: Required";
        } else {
            return "Material: High Quality\nCare: Follow Instructions\nOrigin: Imported\nQuality: Premium";
        }
    }
}
