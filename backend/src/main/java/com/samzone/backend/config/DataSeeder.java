package com.samzone.backend.config;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

// Fake placeholder catalog for local dev only. In prod, a fresh Postgres DB
// has count() == 0 on first boot, so this would seed 550 junk products
// (fake brands, placeholder images) ahead of the real Amazon/Myntra CSV
// import - excluded from prod so only the real catalog lands there.
@Profile("!prod")
@Configuration
public class DataSeeder {

        @Bean
        CommandLineRunner initDatabase(ProductRepository repository) {
                return args -> {
                        if (repository.count() == 0) {

                                List<Product> products = new ArrayList<>();
                                Random random = new Random();

                                String[] images = {
                                                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", // Shirt
                                                "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500", // Jacket
                                                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", // Shoe
                                                "https://images.unsplash.com/photo-1473966968600-fa804b86829b?w=500", // Pants
                                                "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500", // Dress
                                                "https://images.unsplash.com/photo-1511499767350-a1590fdb28bf?w=500", // Sunglasses
                                                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", // Watch
                                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", // Gadget
                                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", // Headphones
                                                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500" // Lifestyle
                                };

                                CategoryConfig[] categoryConfigs = {
                                                new CategoryConfig("Shirts",
                                                                new String[] { "Nike", "Adidas", "Zara", "H&M", "Uniqlo" },
                                                                new String[] { "Classic White Shirt", "Oxford Shirt", "Polo Shirt", "Linen Shirt", "Denim Shirt" }),
                                                new CategoryConfig("Pants",
                                                                new String[] { "Levi's", "Wrangler", "Zara", "Nike", "Adidas" },
                                                                new String[] { "Slim Fit Black Jeans", "Chino Pants", "Cargo Trousers", "Joggers", "Dress Pants" }),
                                                new CategoryConfig("Shoes",
                                                                new String[] { "Nike", "Adidas", "Puma", "Reebok", "New Balance" },
                                                                new String[] { "Running Sneakers", "Formal Shoes", "Boots", "Sandals", "Loafers" }),
                                                new CategoryConfig("Accessories",
                                                                new String[] { "Ray-Ban", "Fossil", "Casio", "Gucci", "Titan" },
                                                                new String[] { "Leather Belt", "Watch", "Sunglasses", "Wallet", "Backpack" }),
                                                new CategoryConfig("Electronics",
                                                                new String[] { "Apple", "Samsung", "Sony", "Bose", "JBL" },
                                                                new String[] { "Wireless Headphones", "Smart Watch", "Gaming Mouse", "Bluetooth Speaker", "Power Bank" }),
                                                new CategoryConfig("Home",
                                                                new String[] { "IKEA", "Urban Ladder", "Pepperfry", "Godrej", "Nilkamal" },
                                                                new String[] { "Ergonomic Office Chair", "Wooden Study Desk", "Bookshelf", "Table Lamp", "Wall Clock" }),
                                                new CategoryConfig("Sports",
                                                                new String[] { "Decathlon", "Nike", "Adidas", "Puma", "Reebok" },
                                                                new String[] { "Yoga Mat", "Dumbbells", "Tennis Racket", "Football", "Cricket Bat" }),
                                                new CategoryConfig("Beauty",
                                                                new String[] { "Lakme", "Maybelline", "MAC", "Nykaa", "Biotique" },
                                                                new String[] { "Lipstick", "Face Cream", "Perfume", "Face Wash", "Hair Oil" }),
                                                new CategoryConfig("Books",
                                                                new String[] { "Penguin", "Rupa", "Bloomsbury", "HarperCollins", "Scholastic" },
                                                                new String[] { "Fiction Novel", "Self-Help Book", "Biography", "Cookbook", "Textbook" }),
                                                new CategoryConfig("Toys",
                                                                new String[] { "LEGO", "Mattel", "Hasbro", "Funskool", "Hot Wheels" },
                                                                new String[] { "Building Blocks", "Action Figure", "Board Game", "Puzzle", "Remote Control Car" })
                                };

                                for (int i = 1; i <= 550; i++) {
                                        CategoryConfig config = categoryConfigs[random.nextInt(categoryConfigs.length)];
                                        String brand = config.brands[random.nextInt(config.brands.length)];
                                        String type = config.types[random.nextInt(config.types.length)];
                                        String name = brand + " " + type + " #" + i;

                                        double price = 499 + (random.nextDouble() * 15000);
                                        double rating = 3.5 + (random.nextDouble() * 1.5);
                                        String image = images[random.nextInt(images.length)];
                                        String description = "Experience the premium quality of " + brand
                                                        + " in our latest " + config.name + " collection. This " + type
                                                        + " is designed for modern comfort.";

                                        Product product = new Product();
                                        product.setName(name);
                                        product.setBrand(brand);
                                        product.setCategory(config.name);
                                        product.setPrice(price);
                                        product.setRating(rating);
                                        product.setStock(random.nextInt(200));
                                        product.setImages(List.of(image));
                                        product.setSizes(List.of("S", "M", "L", "XL"));
                                        product.setColors(List.of("Red", "Blue", "Green", "Black", "White"));
                                        product.setDescription(description);
                                        product.setSpecifications("Material: Premium Blend\nCare: Machine Wash\nOrigin: Made in India");
                                        product.setDiscount(random.nextDouble() * 50);
                                        products.add(product);
                                }

                                repository.saveAll(products);
                                System.out.println("Seeded 550 realistic products into the database.");
                        }
                };
        }

        private static class CategoryConfig {
                String name;
                String[] brands;
                String[] types;

                CategoryConfig(String name, String[] brands, String[] types) {
                        this.name = name;
                        this.brands = brands;
                        this.types = types;
                }
        }
}
