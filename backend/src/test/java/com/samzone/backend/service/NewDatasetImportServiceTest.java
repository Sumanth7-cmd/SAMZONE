package com.samzone.backend.service;

import com.samzone.backend.entity.Product;
import com.samzone.backend.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(NewDatasetImportService.class)
class NewDatasetImportServiceTest {

    @Autowired
    private NewDatasetImportService importService;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void importsProductsAndCategoriesFromCsv() throws Exception {
        Path tempDir = Files.createTempDirectory("samzone-import-test");
        Files.writeString(tempDir.resolve("categories.csv"), "id,category_name\n1,Electronics\n");
        Files.writeString(tempDir.resolve("products.csv"), "asin,title,imgUrl,productURL,stars,reviews,price,listPrice,category_id,isBestSeller,boughtInLastMonth\nASIN1,Wireless Mouse,https://img.example/mouse.jpg,https://example.com/p/1,4.5,10,29.99,39.99,1,false,100\n");

        importService.importFromFiles(tempDir.resolve("categories.csv"), tempDir.resolve("products.csv"), 10);

        assertThat(productRepository.count()).isEqualTo(1);
        Product saved = productRepository.findAll().get(0);
        assertThat(saved.getCategory()).isEqualTo("Electronics");
        assertThat(saved.getBrand()).isEqualTo("Generic");
        assertThat(saved.getImageUrl()).contains("https://img.example");
    }
}
