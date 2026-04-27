package com.trendburada.platform.it;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/**
 * Test slice that shadows Spring Boot's OAuth2 resource-server auto-config so the boot
 * does not try to fetch JWKs from a real Keycloak.
 *
 * <p>Tests that need an authenticated request use Spring Security's
 * {@code SecurityMockMvcRequestPostProcessors.jwt()} post-processor, which builds the
 * {@code Authentication} directly and never invokes the decoder. The decoder bean
 * declared here is therefore unreachable at runtime; it exists purely to satisfy the
 * autoconfig's bean dependency without performing a network call.
 *
 * <p>Pulled in per-test via {@code @Import(IntegrationTestConfig.class)} rather than
 * declared on the abstract base — keeps the base class agnostic about which beans
 * each test needs to override.
 */
@TestConfiguration
public class IntegrationTestConfig {

    @Bean
    @Primary
    public JwtDecoder testJwtDecoder() {
        return token -> {
            throw new UnsupportedOperationException(
                    "JwtDecoder must not be invoked from integration tests; "
                            + "use SecurityMockMvcRequestPostProcessors.jwt() instead.");
        };
    }
}
