package com.trendburada.promotion.application;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PromotionQueryService {

    public List<PromotionBanner> getHomepageBanners() {
        return List.of(
                new PromotionBanner("cmp-1", "Yeni Sezon Secimi", "https://example.com/banner-1.jpg", "/product/kadin"),
                new PromotionBanner("cmp-2", "Ayakkabida Bahar Firsatlari", "https://example.com/banner-2.jpg", "/product/ayakkabi")
        );
    }
}
