package com.samzone.backend.service;

import com.samzone.backend.dto.ImportResult;
import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MyntraImportServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private MyntraImportService service;

    @Test
    void importMyntraShouldPersistInsertedRowsAndReportCounts() throws IOException {
        Path csvFile = Files.createTempFile("myntra-import", ".csv");
        Files.writeString(csvFile, "ProductID,ProductName,ProductBrand,Gender,Price (INR),NumImages,Description,PrimaryColor\n"
                + "1001,Test Jacket,BrandX,Men,1999,1,Comfortable jacket,Black\n",
                StandardCharsets.UTF_8);

        when(productRepository.count()).thenReturn(74626L, 74627L);
        when(productRepository.existsByExternalId("1001")).thenReturn(false);
        when(productRepository.existsByNameIgnoreCaseAndBrandIgnoreCase("Test Jacket", "BrandX")).thenReturn(false);
        when(productRepository.existsByNameIgnoreCaseAndPrice("Test Jacket", 1999.0)).thenReturn(false);
        when(productRepository.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        ImportResult result = service.importMyntra(csvFile.toString());

        assertEquals(1, result.getInserted());
        assertEquals(1, result.getTotalRead());
        assertEquals(74627L, result.getFinalDatabaseCount());
        verify(productRepository).saveAllAndFlush(anyList());
        Files.deleteIfExists(csvFile);
    }
}
