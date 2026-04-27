package com.trendburada.platform.api;

import com.trendburada.promotion.application.HomeCampaignContentResponse;
import com.trendburada.promotion.application.PromotionQueryService;
import com.trendburada.shared.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
public class HomeContentController {

    private final PromotionQueryService promotionQueryService;

    public HomeContentController(PromotionQueryService promotionQueryService) {
        this.promotionQueryService = promotionQueryService;
    }

    @GetMapping("/campaigns")
    public ApiResponse<HomeCampaignContentResponse> campaigns() {
        return ApiResponse.ok(promotionQueryService.getHomeCampaignContent());
    }
}
