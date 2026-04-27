package com.trendburada.auth.application;

import java.util.List;

public record LegacyResponse<T>(
        int returnCode,
        List<T> returnData,
        String message,
        LegacyErrorDetail detail
) {
    public static <T> LegacyResponse<T> success(T data) {
        return new LegacyResponse<>(99, List.of(data), "SUCCESS", null);
    }

    public static <T> LegacyResponse<T> successWithoutData() {
        return new LegacyResponse<>(99, List.of(), "SUCCESS", null);
    }

    public static <T> LegacyResponse<T> failure(String message) {
        return new LegacyResponse<>(11, List.of(), "FAIL", new LegacyErrorDetail(message));
    }

    public record LegacyErrorDetail(String exceptionDetailMessage) {
    }
}
