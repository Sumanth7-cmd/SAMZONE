package com.samzone.backend.controller;

import com.samzone.backend.service.VisualSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/visual-search")
public class VisualSearchController {

    @Autowired
    private VisualSearchService visualSearchService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> search(@RequestBody Map<String, String> body) {
        String image = body.get("image");
        if (image == null || image.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(visualSearchService.search(image));
    }
}
