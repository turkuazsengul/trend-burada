package com.trendburada.platform.api;

import com.trendburada.catalog.application.CatalogQueryService;
import com.trendburada.catalog.application.ProductSummary;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {

    private final CatalogQueryService catalogQueryService;

    public CatalogController(CatalogQueryService catalogQueryService) {
        this.catalogQueryService = catalogQueryService;
    }

    @GetMapping("/products")
    public ApiResponse<List<ProductSummary>> featuredProducts() {
        return ApiResponse.ok(catalogQueryService.getFeaturedProducts());
    }
}
