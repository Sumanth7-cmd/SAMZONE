package com.samzone.backend.controller;

import com.samzone.backend.dto.ImportResult;
import com.samzone.backend.service.MyntraImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class MyntraImportController {

    @Autowired
    private MyntraImportService myntraImportService;

    @PostMapping("/import-myntra")
    public ResponseEntity<ImportResult> importMyntra() {
        ImportResult result = myntraImportService.importMyntra();
        return ResponseEntity.ok(result);
    }
}
