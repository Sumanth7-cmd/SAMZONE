package com.samzone.backend.controller;

import com.samzone.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        long total = 0;
        for (Object[] row : productRepository.countProductsByCategory()) {
            String category = (String) row[0];
            long count = (Long) row[1];
            categoryCounts.put(category, count);
            total += count;
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProducts", total);
        stats.put("totalCategories", categoryCounts.size());
        stats.put("categoryCounts", categoryCounts);
        return ResponseEntity.ok(stats);
    }
}
