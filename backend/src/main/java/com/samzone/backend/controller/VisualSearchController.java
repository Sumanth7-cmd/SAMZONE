package com.samzone.backend.controller;

import com.samzone.backend.service.VisualSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/visual-search")
public class VisualSearchController {

    // A base64 image is ~4/3 its binary size. Keep request memory bounded even
    // when callers bypass the browser's file-size validation.
    private static final int MAX_IMAGE_DATA_URL_LENGTH = 14 * 1024 * 1024;

    @Autowired
    private VisualSearchService visualSearchService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> search(@RequestBody Map<String, String> body) {
        String image = body.get("image");
        if (image == null || image.isBlank()
                || image.length() > MAX_IMAGE_DATA_URL_LENGTH
                || !image.startsWith("data:image/")) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(visualSearchService.search(image));
    }
}
