package com.trendburada.promotion.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionBannerRepository extends JpaRepository<PromotionBannerEntity, UUID> {
    List<PromotionBannerEntity> findAllByOrderBySortOrderAscBannerCodeAsc();
    Optional<PromotionBannerEntity> findByBannerCode(String bannerCode);
}
