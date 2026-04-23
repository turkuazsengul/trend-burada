package com.trendburada.auth.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;

@Configuration
public class KeycloakRealmBootstrap {

    private static final Logger log = LoggerFactory.getLogger(KeycloakRealmBootstrap.class);

    private final KeycloakAdminService keycloakAdminService;

    public KeycloakRealmBootstrap(KeycloakAdminService keycloakAdminService) {
        this.keycloakAdminService = keycloakAdminService;
    }

    @EventListener(ContextRefreshedEvent.class)
    public void bootstrapRealmRolesAndUsers() {
        try {
            keycloakAdminService.ensureRealmRole(RoleNames.CUSTOMER, "Customer role");
            keycloakAdminService.ensureRealmRole(RoleNames.SELLER, "Seller role");
            keycloakAdminService.ensureRealmRole(RoleNames.ADMIN, "Administrator role");

            keycloakAdminService.ensureBootstrapUser(
                    "customer@trendburada.local",
                    "Demo",
                    "Customer",
                    "Trend123!",
                    RoleNames.CUSTOMER
            );
            keycloakAdminService.ensureBootstrapUser(
                    "seller@trendburada.local",
                    "Demo",
                    "Seller",
                    "Trend123!",
                    RoleNames.SELLER
            );
            keycloakAdminService.ensureBootstrapUser(
                    "menswear@trendburada.local",
                    "Menswear",
                    "Seller",
                    "Trend123!",
                    RoleNames.SELLER
            );
            keycloakAdminService.ensureBootstrapUser(
                    "family.active@trendburada.local",
                    "Family Active",
                    "Seller",
                    "Trend123!",
                    RoleNames.SELLER
            );
            keycloakAdminService.ensureBootstrapUser(
                    "admin@trendburada.local",
                    "Demo",
                    "Admin",
                    "Trend123!",
                    RoleNames.ADMIN
            );
        } catch (Exception ex) {
            log.warn("Keycloak role bootstrap skipped: {}", ex.getMessage());
        }
    }
}
