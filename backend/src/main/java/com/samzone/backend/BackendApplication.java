package com.samzone.backend;

import com.samzone.backend.service.AmazonImportService;
import com.samzone.backend.service.MyntraImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication implements CommandLineRunner {

    @Autowired
    private AmazonImportService amazonImportService;

    @Autowired
    private MyntraImportService myntraImportService;

    @Value("${samzone.import.on-startup:false}")
    private boolean importOnStartup;

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        if (importOnStartup) {
            amazonImportService.importAllCsvFiles();
            myntraImportService.importMyntra();
        }
    }
}
