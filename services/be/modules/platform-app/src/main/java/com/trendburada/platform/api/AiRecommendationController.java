package com.trendburada.platform.api;

import com.trendburada.ai.application.AiRecommendationRequest;
import com.trendburada.ai.application.AiRecommendationResponse;
import com.trendburada.ai.application.AiRecommendationService;
import com.trendburada.shared.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;

    public AiRecommendationController(AiRecommendationService aiRecommendationService) {
        this.aiRecommendationService = aiRecommendationService;
    }

    @PostMapping("/recommendations")
    public ApiResponse<AiRecommendationResponse> recommend(@RequestBody AiRecommendationRequest request) {
        return ApiResponse.ok(aiRecommendationService.recommend(request));
    }
}
