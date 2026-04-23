package com.trendburada.favorite.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, UUID> {

    List<FavoriteEntity> findByCustomerCode(String customerCode);
    Page<FavoriteEntity> findByCustomerCode(String customerCode, Pageable pageable);
}
