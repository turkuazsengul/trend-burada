package com.trendburada.auth.application;

import java.util.Map;

public record LoginResult(
        Map<String, Object> accessTokenResponse,
        AuthenticatedUser user
) {
}
