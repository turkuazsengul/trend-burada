package com.trendburada.platform.it;

import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Shared harness for full-context integration tests.
 *
 * <p>Spins up a Postgres 16 container once per JVM (the field is {@code static}, so JUnit
 * Jupiter reuses it across every subclass in the run), wires its JDBC URL into the
 * Spring context via {@link ServiceConnection}, and exposes {@link MockMvc} for
 * subclasses to drive HTTP traffic.
 *
 * <p>Subclasses get a real Spring context: every controller, service, repository, the
 * security filter chain and Flyway baseline marker all boot. What is <i>not</i> real:
 * Keycloak (no JwtDecoder is wired; tests authenticate via Spring Security's
 * {@code SecurityMockMvcRequestPostProcessors.jwt()} which bypasses the decoder), the
 * remote config server (turned off in {@code application-test.yml}), and any outbound
 * mail (Spring Boot's autoconfigured JavaMailSender points at unreachable localhost:1
 * for tests; controllers that catch and log mail failures keep working).
 *
 * <p>Use {@link IntegrationTestConfig} via {@code @Import} to add a stub {@code JwtDecoder}
 * so the OAuth2 resource-server auto-config doesn't try to fetch JWKs from a real
 * Keycloak at startup.
 *
 * <p><b>Opt-in execution.</b> The integration tests do not run on a plain
 * {@code mvn test} or {@code mvn package}. They start a Postgres container, which:
 * <ul>
 *   <li>requires a working Testcontainers ↔ Docker connection — on macOS Docker Desktop
 *       you need to enable
 *       <i>Settings → Advanced → "Allow the default Docker socket to be used"</i>,
 *       otherwise the engine answers Testcontainers' {@code /info} probe with a 400
 *       redirect and every connection strategy fails;</li>
 *   <li>adds ~10–20 s of cold-boot overhead per test run, which we don't want on every
 *       compile loop.</li>
 * </ul>
 *
 * <p>Run them explicitly with:
 * <pre>{@code
 *   ./mvnw -pl modules/platform-app -am test -Dtests.integration=true
 * }</pre>
 *
 * <p>(or {@code -Dtest='*IntegrationTest' -Dtests.integration=true} to run only this
 * suite). The {@link EnabledIfSystemProperty} below gates the entire class hierarchy.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@EnabledIfSystemProperty(named = "tests.integration", matches = "true")
public abstract class AbstractIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("trend_burada_test")
            .withUsername("trend")
            .withPassword("trend");

    /**
     * The OAuth2 resource server auto-config requires either {@code issuer-uri} or
     * {@code jwk-set-uri} to be set; in tests we don't want either to do a real lookup.
     * Setting an empty issuer-uri property here disables the auto-config's network probe
     * — combined with the stub {@code JwtDecoder} bean in {@link IntegrationTestConfig}
     * that's enough to start a Spring context with security wired but Keycloak absent.
     */
    @DynamicPropertySource
    static void neutralizeOauth2(DynamicPropertyRegistry registry) {
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> "");
        registry.add("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", () -> "");
    }

    @Autowired
    protected MockMvc mockMvc;
}
