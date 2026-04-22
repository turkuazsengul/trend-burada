package com.trendburada.favorite.application;

import com.trendburada.favorite.domain.FavoriteEntity;
import com.trendburada.favorite.domain.FavoriteRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FavoriteQueryService {

    private final FavoriteRepository favoriteRepository;

    public FavoriteQueryService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    public FavoriteSnapshot getSnapshot(String customerCode) {
        return new FavoriteSnapshot(favoriteRepository.findByCustomerCode(customerCode).size());
    }

    public List<FavoriteItem> getFavorites(String customerCode) {
        return favoriteRepository.findByCustomerCode(customerCode).stream()
                .map(item -> new FavoriteItem(item.getId(), item.getCustomerCode(), item.getProductCode()))
                .toList();
    }

    public FavoriteItem create(CreateFavoriteRequest request) {
        FavoriteEntity entity = new FavoriteEntity();
        entity.setCustomerCode(request.customerCode());
        entity.setProductCode(request.productCode());
        FavoriteEntity saved = favoriteRepository.save(entity);
        return new FavoriteItem(saved.getId(), saved.getCustomerCode(), saved.getProductCode());
    }
}
