package com.trendburada.platform.api;

import com.trendburada.promotion.application.CreatePromotionBannerRequest;
import com.trendburada.promotion.application.PromotionBanner;
import com.trendburada.promotion.application.PromotionQueryService;
import com.trendburada.shared.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/promotions")
public class PromotionController {

    private final PromotionQueryService promotionQueryService;

    public PromotionController(PromotionQueryService promotionQueryService) {
        this.promotionQueryService = promotionQueryService;
    }

    @GetMapping("/banners")
    public ApiResponse<List<PromotionBanner>> banners() {
        return ApiResponse.ok(promotionQueryService.getHomepageBanners());
    }

    @PostMapping("/banners")
    public ApiResponse<PromotionBanner> create(@RequestBody CreatePromotionBannerRequest request) {
        return ApiResponse.ok(promotionQueryService.create(request));
    }
}
