package com.trendburada.promotion.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionBannerRepository extends JpaRepository<PromotionBannerEntity, Long> {
    List<PromotionBannerEntity> findAllByOrderBySortOrderAscIdAsc();
}
