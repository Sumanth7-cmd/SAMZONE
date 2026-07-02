package com.samzone.backend.controller;

import com.samzone.backend.dto.ImportResult;
import com.samzone.backend.service.MyntraImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(originPatterns = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://samzone.vercel.app",
        "https://*.vercel.app"
})
public class MyntraImportController {

    @Autowired
    private MyntraImportService myntraImportService;

    @PostMapping("/import-myntra")
    public ResponseEntity<ImportResult> importMyntra() {
        ImportResult result = myntraImportService.importMyntra();
        return ResponseEntity.ok(result);
    }
}
