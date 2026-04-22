package com.trendburada.platform.api;

import com.trendburada.catalog.application.CatalogQueryService;
import com.trendburada.catalog.application.CreateProductRequest;
import com.trendburada.catalog.application.ProductFacet;
import com.trendburada.catalog.application.ProductSummary;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {

    private final CatalogQueryService catalogQueryService;

    public CatalogController(CatalogQueryService catalogQueryService) {
        this.catalogQueryService = catalogQueryService;
    }

    @GetMapping("/products")
    public ApiResponse<?> featuredProducts(@RequestParam(required = false) String category,
                                           @RequestParam(required = false) String productId) {
        if (productId != null && !productId.isBlank()) {
            return ApiResponse.ok(catalogQueryService.getProductById(productId).map(List::of).orElseGet(List::of));
        }
        return ApiResponse.ok(catalogQueryService.getProducts(category));
    }

    @GetMapping("/facets")
    public ApiResponse<List<ProductFacet>> facets(@RequestParam(required = false) String category) {
        return ApiResponse.ok(catalogQueryService.getFacets(category));
    }

    @PostMapping("/products")
    public ApiResponse<ProductSummary> createProduct(@RequestBody CreateProductRequest request) {
        return ApiResponse.ok(catalogQueryService.create(request));
    }
}
