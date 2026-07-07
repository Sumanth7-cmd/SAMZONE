package com.samzone.backend.controller;

import com.samzone.backend.dto.TryOnRequest;
import com.samzone.backend.dto.TryOnResponse;
import com.samzone.backend.service.TryOnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Disabled: the AI photo-based try-on path (Gemini image editing) was
// unreliable in practice and has been replaced by the AI Style DNA feature
// (see StyleDnaController). The manual drag-overlay try-on in
// FixedWebcamTryOn.tsx never called this endpoint - it's pure client-side
// canvas compositing - so nothing else depends on this route. Left
// commented out rather than deleted in case the Gemini image-edit approach
// is revisited later; TryOnService itself is untouched.
@RestController
@RequestMapping("/api/tryon")
public class TryOnController {

    @Autowired
    private TryOnService tryOnService;

    // @PostMapping
    // public ResponseEntity<TryOnResponse> tryOn(@RequestBody TryOnRequest request) {
    //     if (request.getUserPhoto() == null || request.getUserPhoto().isBlank()) {
    //         return ResponseEntity.badRequest().body(TryOnResponse.error("userPhoto is required"));
    //     }
    //     if (request.getProductImage() == null || request.getProductImage().isBlank()) {
    //         return ResponseEntity.badRequest().body(TryOnResponse.error("productImage is required"));
    //     }
    //
    //     TryOnResponse result = tryOnService.generateTryOn(
    //             request.getUserPhoto(), request.getProductImage(), request.getProductName());
    //     return ResponseEntity.ok(result);
    // }
}
