package com.trendburada.gateway.config;

import java.security.Principal;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimitConfiguration {

    @Bean
    public KeyResolver userOrIpKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .map(Principal::getName)
                .switchIfEmpty(Mono.just(resolveIp(exchange)));
    }

    private String resolveIp(ServerWebExchange exchange) {
        if (exchange.getRequest().getRemoteAddress() == null) {
            return "anonymous";
        }
        return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
    }
}
