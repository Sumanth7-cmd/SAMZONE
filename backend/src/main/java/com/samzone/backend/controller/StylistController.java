package com.samzone.backend.controller;

import com.samzone.backend.service.StylistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stylist")
public class StylistController {

    @Autowired
    private StylistService stylistService;

    @PostMapping("/complete-look")
    public ResponseEntity<Map<String, Object>> completeLook(@RequestBody Map<String, Object> body) {
        Object rawId = body.get("productId");
        if (rawId == null) {
            return ResponseEntity.badRequest().build();
        }

        Long productId = Long.valueOf(rawId.toString());
        Map<String, Object> result = stylistService.completeLook(productId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
