package com.trendburada.platform.it;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

/**
 * End-to-end smoke for the JWT-scoped {@code /api/v1/customer/me} surface.
 *
 * <p>Covers the contract introduced in TB-02: the controller refuses to return any
 * profile when the JWT email does not map to a row in {@code customer.customers},
 * and returns the caller's own row when it does. No customer identifier is accepted
 * on the request; ownership is solely email-driven.
 *
 * <p>Auth is simulated via Spring Security's {@code jwt()} post-processor — no real
 * Keycloak round trip — but the rest of the stack is real: the resolver hits the
 * Postgres Testcontainer, the controller, the service, the JPA mapping all run.
 */
@Import(IntegrationTestConfig.class)
@EnabledIfSystemProperty(named = "tests.integration", matches = "true")
class CustomerMeIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    CustomerRepository customerRepository;

    @Test
    void getMeReturnsTheCallerRowResolvedFromJwtEmail() throws Exception {
        CustomerEntity row = new CustomerEntity();
        row.setCustomerCode("cust-it-1");
        row.setEmail("alice@example.com");
        row.setFullName("Alice Example");
        row.setSegment("standard");
        row.setPreferredCategory("kadin");
        customerRepository.save(row);

        mockMvc.perform(get("/api/v1/customer/me")
                        .with(jwt().jwt(builder -> builder.claim("email", "alice@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("alice@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Alice Example"));
    }

    @Test
    void getMeReturns403WhenJwtEmailHasNoMatchingCustomer() throws Exception {
        // No customer row inserted for this email — resolver throws AccessDeniedException,
        // which Spring Security's BearerTokenAccessDeniedHandler translates to 403.
        // Specifically asserted because TB-02's IDOR fix relies on this behaviour: we
        // refuse rather than fall back to the legacy "first row in the table".
        mockMvc.perform(get("/api/v1/customer/me")
                        .with(jwt().jwt(builder -> builder.claim("email", "ghost@example.com"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMeReturns401WhenNoJwtSupplied() throws Exception {
        mockMvc.perform(get("/api/v1/customer/me"))
                .andExpect(status().isUnauthorized());
    }
}
