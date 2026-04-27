package com.trendburada.platform.api;

import com.trendburada.ai.application.AiRecommendationRequest;
import com.trendburada.ai.application.AiRecommendationResponse;
import com.trendburada.ai.application.AiRecommendationService;
import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.shared.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final AuthenticatedCustomerResolver customerResolver;

    public AiRecommendationController(AiRecommendationService aiRecommendationService,
                                      AuthenticatedCustomerResolver customerResolver) {
        this.aiRecommendationService = aiRecommendationService;
        this.customerResolver = customerResolver;
    }

    @PostMapping("/recommendations")
    public ApiResponse<AiRecommendationResponse> recommend(Authentication authentication,
                                                           @RequestBody AiRecommendationRequest request) {
        CustomerEntity caller = customerResolver.resolveCustomer(authentication);
        return ApiResponse.ok(aiRecommendationService.recommend(request, caller.getFullName()));
    }
}
