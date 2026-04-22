package com.trendburada.catalog.application;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CatalogQueryService {

    public List<ProductSummary> getFeaturedProducts() {
        return List.of(
                new ProductSummary("prd-101", "Premium Oversize Triko", "kadin", "Zara", 1399.90, true),
                new ProductSummary("prd-102", "Modern Poplin Gomlek", "erkek", "Mango Man", 1199.90, true),
                new ProductSummary("prd-103", "Minimal Sneaker", "ayakkabi", "Massimo", 2199.90, false)
        );
    }
}
