package com.trendburada.auth.application;

import java.util.List;

public record AuthenticatedUser(
        String pkId,
        String id,
        String name,
        String surname,
        String email,
        boolean emailVerified,
        List<RoleItem> roleList
) {
    public record RoleItem(String name) {
    }
}
