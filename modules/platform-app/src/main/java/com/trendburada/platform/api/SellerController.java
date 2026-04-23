package com.trendburada.platform.api;

import com.trendburada.catalog.application.BrandOption;
import com.trendburada.catalog.application.CatalogReferenceService;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/seller")
public class SellerController {

    private final CatalogReferenceService catalogReferenceService;

    public SellerController(CatalogReferenceService catalogReferenceService) {
        this.catalogReferenceService = catalogReferenceService;
    }

    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    @GetMapping("/brands")
    public ApiResponse<List<BrandOption>> brands() {
        return ApiResponse.ok(catalogReferenceService.getBrands());
    }
}
