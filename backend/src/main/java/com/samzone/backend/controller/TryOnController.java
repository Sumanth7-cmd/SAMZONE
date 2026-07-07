package com.samzone.backend.controller;

import com.samzone.backend.dto.TryOnRequest;
import com.samzone.backend.dto.TryOnResponse;
import com.samzone.backend.service.TryOnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/tryon")
public class TryOnController {

    @Autowired
    private TryOnService tryOnService;

    // AI-generated try-on: renders the uploaded photo actually wearing the
    // selected garment via Gemini image editing. See TryOnService for the
    // fallback contract the frontend relies on.
    @PostMapping
    public ResponseEntity<TryOnResponse> tryOn(@RequestBody TryOnRequest request) {
        if (request.getUserPhoto() == null || request.getUserPhoto().isBlank()) {
            return ResponseEntity.badRequest().body(TryOnResponse.error("userPhoto is required"));
        }
        if (request.getProductImage() == null || request.getProductImage().isBlank()) {
            return ResponseEntity.badRequest().body(TryOnResponse.error("productImage is required"));
        }

        TryOnResponse result = tryOnService.generateTryOn(
                request.getUserPhoto(), request.getProductImage(), request.getProductName());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, String>> processTryOn(
            @RequestParam("userImage") MultipartFile userImage,
            @RequestParam("productId") Long productId) {

        // In a real implementation, this would:
        // 1. Save the uploaded image
        // 2. Call an AI model to overlay the product on the user
        // 3. Return the processed image URL

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Try-on processing completed (mock)");
        response.put("resultImageUrl", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{jobId}")
    public ResponseEntity<Map<String, String>> getTryOnStatus(@PathVariable String jobId) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "completed");
        response.put("jobId", jobId);

        return ResponseEntity.ok(response);
    }
}
