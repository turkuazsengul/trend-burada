package com.trendburada.favorite.application;

import com.trendburada.favorite.domain.FavoriteEntity;
import com.trendburada.favorite.domain.FavoriteRepository;
import com.trendburada.shared.PagedResult;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    public PagedResult<FavoriteItem> getFavorites(String customerCode, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                normalizeSize(size),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        Page<FavoriteEntity> favorites = favoriteRepository.findByCustomerCode(customerCode, pageable);
        Page<FavoriteItem> mappedPage = favorites.map(this::map);
        return PagedResult.of(
                mappedPage.getContent(),
                mappedPage.getTotalElements(),
                mappedPage.getNumber(),
                mappedPage.getSize(),
                mappedPage.getTotalPages(),
                mappedPage.hasNext()
        );
    }

    public FavoriteItem create(CreateFavoriteRequest request) {
        FavoriteEntity entity = new FavoriteEntity();
        entity.setCustomerCode(request.customerCode());
        entity.setProductCode(request.productCode());
        entity.setCreatedAt(OffsetDateTime.now());
        FavoriteEntity saved = favoriteRepository.save(entity);
        return map(saved);
    }

    private FavoriteItem map(FavoriteEntity item) {
        return new FavoriteItem(item.getId(), item.getCustomerCode(), item.getProductCode());
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return 20;
        }
        return Math.min(size, 50);
    }
}
