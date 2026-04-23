package com.trendburada.shared;

import java.util.List;

public record PagedResult<T>(
        List<T> items,
        long totalElements,
        int page,
        int size,
        int totalPages,
        boolean hasNext
) {
    public static <T> PagedResult<T> of(List<T> items,
                                        long totalElements,
                                        int page,
                                        int size,
                                        int totalPages,
                                        boolean hasNext) {
        return new PagedResult<>(
                items,
                totalElements,
                page,
                size,
                totalPages,
                hasNext
        );
    }
}
