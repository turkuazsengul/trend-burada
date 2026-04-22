package com.trendburada.promotion.application;

import com.trendburada.promotion.domain.PromotionBannerEntity;
import com.trendburada.promotion.domain.PromotionBannerRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class PromotionQueryService {

    private final PromotionBannerRepository promotionBannerRepository;

    public PromotionQueryService(PromotionBannerRepository promotionBannerRepository) {
        this.promotionBannerRepository = promotionBannerRepository;
    }

    public List<PromotionBanner> getHomepageBanners() {
        return promotionBannerRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(this::map).toList();
    }

    public HomeCampaignContentResponse getHomeCampaignContent() {
        List<HomepageContentBlock> heroBlocks = new java.util.ArrayList<>();
        List<HomepageContentBlock> campaignBlocks = new java.util.ArrayList<>();
        List<HomepageContentBlock> showcaseBlocks = new java.util.ArrayList<>();

        for (PromotionBannerEntity entity : promotionBannerRepository.findAllByOrderBySortOrderAscIdAsc()) {
            HomepageContentBlock block = mapToHomepageBlock(entity);
            switch (normalizeBlockType(entity.getBlockType())) {
                case "HERO" -> heroBlocks.add(block);
                case "SHOWCASE" -> showcaseBlocks.add(block);
                default -> campaignBlocks.add(block);
            }
        }

        return new HomeCampaignContentResponse(heroBlocks, campaignBlocks, showcaseBlocks);
    }

    public PromotionBanner create(CreatePromotionBannerRequest request) {
        PromotionBannerEntity entity = new PromotionBannerEntity();
        entity.setBannerCode("cmp-" + System.currentTimeMillis());
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setImageUrl(request.imageUrl());
        entity.setTargetPath(request.targetUrl());
        entity.setBlockType(normalizeBlockType(request.blockType()));
        entity.setSortOrder(request.sortOrder());
        return map(promotionBannerRepository.save(entity));
    }

    private PromotionBanner map(PromotionBannerEntity entity) {
        return new PromotionBanner(
                entity.getBannerCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getImageUrl(),
                entity.getTargetPath(),
                normalizeBlockType(entity.getBlockType()),
                entity.getSortOrder()
        );
    }

    private HomepageContentBlock mapToHomepageBlock(PromotionBannerEntity entity) {
        return new HomepageContentBlock(
                entity.getBannerCode(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getImageUrl(),
                entity.getTargetPath(),
                entity.getSortOrder()
        );
    }

    private String normalizeBlockType(String blockType) {
        if (blockType == null || blockType.isBlank()) {
            return "CAMPAIGN";
        }
        return blockType.trim().toUpperCase(Locale.ROOT);
    }
}
