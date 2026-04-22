package com.trendburada.promotion.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionBannerRepository extends JpaRepository<PromotionBannerEntity, Long> {
    List<PromotionBannerEntity> findAllByOrderBySortOrderAscIdAsc();
    Optional<PromotionBannerEntity> findByBannerCode(String bannerCode);
}
