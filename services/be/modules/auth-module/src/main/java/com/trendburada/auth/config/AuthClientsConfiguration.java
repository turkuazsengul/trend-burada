package com.trendburada.auth.config;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class AuthClientsConfiguration {

    @Bean
    public Keycloak keycloakAdminClient(AuthKeycloakProperties properties) {
        return KeycloakBuilder.builder()
                .serverUrl(properties.getBaseUrl())
                .realm("master")
                .clientId("admin-cli")
                .grantType(OAuth2Constants.PASSWORD)
                .username(properties.getAdminUsername())
                .password(properties.getAdminPassword())
                .build();
    }

    @Bean
    public RestClient restClient(RestClient.Builder builder) {
        return builder.build();
    }
}
