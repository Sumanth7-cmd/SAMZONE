package com.samzone.backend;

import com.samzone.backend.repository.ProductRepository;
import com.samzone.backend.service.AmazonImportService;
import com.samzone.backend.service.MyntraImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication implements CommandLineRunner {

    // Below this, the DB is considered "not yet seeded"; above it, importers
    // are skipped entirely regardless of samzone.import.on-startup. Their
    // per-row dedup checks are meant to make re-running a no-op, but a
    // mismatch between the raw and cleaned name let 15,000+ duplicates
    // through on a redeploy - this guard is the hard backstop against that
    // class of bug happening again.
    private static final long ALREADY_SEEDED_THRESHOLD = 1000;

    @Autowired
    private AmazonImportService amazonImportService;

    @Autowired
    private MyntraImportService myntraImportService;

    @Autowired
    private ProductRepository productRepository;

    @Value("${samzone.import.on-startup:false}")
    private boolean importOnStartup;

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        if (!importOnStartup) {
            return;
        }

        long existingCount = productRepository.count();
        if (existingCount > ALREADY_SEEDED_THRESHOLD) {
            System.out.println("Products already exist (" + existingCount + "), skipping import");
            return;
        }

        amazonImportService.importAllCsvFiles();
        myntraImportService.importMyntra();
    }
}
