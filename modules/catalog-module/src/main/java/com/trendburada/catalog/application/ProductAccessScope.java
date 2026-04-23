package com.trendburada.catalog.application;

public record ProductAccessScope(
        boolean authenticated,
        boolean seller,
        boolean admin,
        String principalEmail
) {

    public static ProductAccessScope anonymous() {
        return new ProductAccessScope(false, false, false, null);
    }

    public boolean isSellerScoped() {
        return authenticated && seller && !admin && principalEmail != null && !principalEmail.isBlank();
    }

    public String normalizedPrincipalEmail() {
        return principalEmail == null ? null : principalEmail.trim().toLowerCase();
    }
}
