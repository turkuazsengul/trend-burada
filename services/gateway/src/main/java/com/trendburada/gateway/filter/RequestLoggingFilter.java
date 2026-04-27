package com.trendburada.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getAttribute(CorrelationIdFilter.ATTRIBUTE_NAME);
        String method = exchange.getRequest().getMethod() == null ? "UNKNOWN" : exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getRawPath();
        long start = System.currentTimeMillis();

        log.info("Incoming request method={} path={} correlationId={}", method, path, correlationId);

        return chain.filter(exchange)
                .doFinally(signalType -> {
                    int status = exchange.getResponse().getStatusCode() == null ? 0 : exchange.getResponse().getStatusCode().value();
                    long duration = System.currentTimeMillis() - start;
                    log.info("Completed request method={} path={} status={} durationMs={} correlationId={}",
                            method, path, status, duration, correlationId);
                });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
