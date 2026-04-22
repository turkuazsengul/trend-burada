package com.trendburada.auth.api;

public record BasicLoginRequest(
        String username,
        String password
) {
}
