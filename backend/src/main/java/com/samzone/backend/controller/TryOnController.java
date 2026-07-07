package com.samzone.backend.controller;

import com.samzone.backend.dto.TryOnRequest;
import com.samzone.backend.dto.TryOnResponse;
import com.samzone.backend.service.TryOnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
