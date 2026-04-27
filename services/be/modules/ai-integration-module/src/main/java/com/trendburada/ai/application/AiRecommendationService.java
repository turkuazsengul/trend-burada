package com.trendburada.ai.application;

import com.trendburada.catalog.application.CatalogQueryService;
import com.trendburada.catalog.application.ProductSummary;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiRecommendationService {

    private final CatalogQueryService catalogQueryService;

    public AiRecommendationService(CatalogQueryService catalogQueryService) {
        this.catalogQueryService = catalogQueryService;
    }

    public AiRecommendationResponse recommend(AiRecommendationRequest request, String callerFullName) {
        List<String> productIds = catalogQueryService.getFeaturedProducts().stream()
                .filter(product -> matchesCategory(request.category(), product))
                .map(ProductSummary::id)
                .limit(3)
                .toList();

        String summary = "Selected for %s using %s style and %s usage."
                .formatted(callerFullName, request.style(), request.usage());

        return new AiRecommendationResponse("RULE_BASED_PLACEHOLDER", summary, productIds);
    }

    private boolean matchesCategory(String requestedCategory, ProductSummary product) {
        if (requestedCategory == null || requestedCategory.isBlank()) {
            return true;
        }
        return requestedCategory.equalsIgnoreCase(product.category());
    }
}
