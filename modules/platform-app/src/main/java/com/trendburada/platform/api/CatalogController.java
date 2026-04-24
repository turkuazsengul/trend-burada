package com.trendburada.platform.api;

import com.trendburada.auth.application.RoleNames;
import com.trendburada.catalog.application.CatalogQueryService;
import com.trendburada.catalog.application.CatalogReferenceService;
import com.trendburada.catalog.application.CategoryTreeNode;
import com.trendburada.catalog.application.CreateProductRequest;
import com.trendburada.catalog.application.ProductDetail;
import com.trendburada.catalog.application.ProductAccessScope;
import com.trendburada.catalog.application.ProductFacet;
import com.trendburada.catalog.application.ProductSummary;
import com.trendburada.catalog.application.UpdateProductRequest;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {

    private final CatalogQueryService catalogQueryService;
    private final CatalogReferenceService catalogReferenceService;

    public CatalogController(CatalogQueryService catalogQueryService,
                             CatalogReferenceService catalogReferenceService) {
        this.catalogQueryService = catalogQueryService;
        this.catalogReferenceService = catalogReferenceService;
    }

    @GetMapping("/products")
    public ApiResponse<?> featuredProducts(Authentication authentication,
                                           @RequestParam(required = false) String category,
                                           @RequestParam(required = false) String productId,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "24") int size) {
        ProductAccessScope accessScope = toAccessScope(authentication);
        if (productId != null && !productId.isBlank()) {
            return ApiResponse.ok(catalogQueryService.getProductById(accessScope, productId).map(List::of).orElseGet(List::of));
        }
        return ApiResponse.ok(catalogQueryService.getProducts(accessScope, category, page, size));
    }

    @GetMapping("/facets")
    public ApiResponse<List<ProductFacet>> facets(Authentication authentication,
                                                  @RequestParam(required = false) String category) {
        return ApiResponse.ok(catalogQueryService.getFacets(toAccessScope(authentication), category));
    }

    @GetMapping("/products/{productId}")
    public ApiResponse<ProductDetail> productDetail(@PathVariable String productId) {
        return ApiResponse.ok(catalogQueryService.getProductDetailById(productId).orElse(null));
    }

    @GetMapping("/categories/tree")
    public ApiResponse<List<CategoryTreeNode>> categoryTree() {
        return ApiResponse.ok(catalogReferenceService.getCategoryTree());
    }

    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    @PostMapping("/products")
    public ApiResponse<ProductSummary> createProduct(Authentication authentication,
                                                     @RequestBody CreateProductRequest request) {
        return ApiResponse.ok(catalogQueryService.create(toAccessScope(authentication), request));
    }

    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    @PutMapping("/products/{productId}")
    public ApiResponse<ProductSummary> updateProduct(Authentication authentication,
                                                     @PathVariable String productId,
                                                     @RequestBody UpdateProductRequest request) {
        return ApiResponse.ok(catalogQueryService.update(toAccessScope(authentication), productId, request).orElse(null));
    }

    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    @DeleteMapping("/products/{productId}")
    public ApiResponse<Boolean> deleteProduct(Authentication authentication,
                                              @PathVariable String productId) {
        return ApiResponse.ok(catalogQueryService.delete(toAccessScope(authentication), productId));
    }

    private ProductAccessScope toAccessScope(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return ProductAccessScope.anonymous();
        }

        boolean seller = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + RoleNames.SELLER));
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + RoleNames.ADMIN));

        String principalEmail = null;
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            principalEmail = jwt.getClaimAsString("preferred_username");
            if (principalEmail == null || principalEmail.isBlank()) {
                principalEmail = jwt.getClaimAsString("email");
            }
            if (principalEmail == null || principalEmail.isBlank()) {
                principalEmail = jwt.getSubject();
            }
        } else if (authentication.getName() != null) {
            principalEmail = authentication.getName();
        }

        return new ProductAccessScope(true, seller, admin, principalEmail);
    }
}
