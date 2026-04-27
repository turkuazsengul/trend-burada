package com.trendburada.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfiguration {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/actuator/health", "/actuator/info").permitAll()
                        .pathMatchers("/api/v1/auth/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/home/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/catalog/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/promotions/**").permitAll()
                        .pathMatchers("/fallback/**").permitAll()
                        .pathMatchers("/api/v1/**").authenticated()
                        .anyExchange().permitAll()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> {}))
                .build();
    }
}
