package com.samzone.backend.controller;

import com.samzone.backend.dto.StyleDnaRequest;
import com.samzone.backend.service.StyleDnaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/style-dna")
public class StyleDnaController {

    @Autowired
    private StyleDnaService styleDnaService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> buildProfile(@RequestBody StyleDnaRequest request) {
        if (request.getAnswers() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(styleDnaService.buildProfile(request.getAnswers()));
    }
}
