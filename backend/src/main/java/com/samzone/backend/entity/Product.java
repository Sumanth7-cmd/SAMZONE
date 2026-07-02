package com.samzone.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = true)
    private String externalId;

    @Column(nullable = false, length = 1024)
    private String name;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double price;

    private Double discount;

    private Double rating;

    @Column(nullable = false)
    private Integer stock;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> images;

    @Transient
    public String getImageUrl() {
        return (images != null && !images.isEmpty()) ? images.get(0) : "https://picsum.photos/300";
    }

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_sizes", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "size")
    private List<String> sizes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_colors", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "color")
    private List<String> colors;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String specifications;
}
