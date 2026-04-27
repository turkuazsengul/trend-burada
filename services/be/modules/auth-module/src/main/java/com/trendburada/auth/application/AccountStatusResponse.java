package com.trendburada.auth.application;

public record AccountStatusResponse(
        String email,
        boolean exists,
        boolean emailVerified
) {
}
