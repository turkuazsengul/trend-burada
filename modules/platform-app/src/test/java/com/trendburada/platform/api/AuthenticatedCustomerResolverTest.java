package com.trendburada.platform.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Behavioural contract for {@link AuthenticatedCustomerResolver}. Mirrors the original
 * {@code CartPrincipalResolverTest} suite (the resolver was renamed when the second
 * scoped-to-me feature was added) and adds coverage for the new
 * {@link AuthenticatedCustomerResolver#resolveCustomer(Authentication)} entity-returning method.
 */
class AuthenticatedCustomerResolverTest {

    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final AuthenticatedCustomerResolver resolver =
            new AuthenticatedCustomerResolver(customerRepository);

    @Test
    void resolves_customer_code_from_email_claim() {
        when(customerRepository.findByEmail("user@example.com"))
                .thenReturn(Optional.of(customer("cust-1001", "user@example.com")));

        String code = resolver.resolveCustomerCode(jwt(Map.of("email", "user@example.com")));

        assertThat(code).isEqualTo("cust-1001");
    }

    @Test
    void resolves_full_customer_entity_so_callers_can_use_the_uuid_for_foreign_keys() {
        CustomerEntity entity = customer("cust-1001", "user@example.com");
        when(customerRepository.findByEmail("user@example.com")).thenReturn(Optional.of(entity));

        CustomerEntity resolved = resolver.resolveCustomer(jwt(Map.of("email", "user@example.com")));

        assertThat(resolved).isSameAs(entity);
    }

    @Test
    void prefers_email_over_preferred_username() {
        when(customerRepository.findByEmail("real@example.com"))
                .thenReturn(Optional.of(customer("cust-1001", "real@example.com")));

        String code = resolver.resolveCustomerCode(jwt(Map.of(
                "email", "real@example.com",
                "preferred_username", "other@example.com"
        )));

        assertThat(code).isEqualTo("cust-1001");
    }

    @Test
    void uses_preferred_username_when_it_is_email_format_and_email_claim_missing() {
        when(customerRepository.findByEmail("user@example.com"))
                .thenReturn(Optional.of(customer("cust-1001", "user@example.com")));

        String code = resolver.resolveCustomerCode(jwt(Map.of(
                "preferred_username", "user@example.com"
        )));

        assertThat(code).isEqualTo("cust-1001");
    }

    @Test
    void rejects_non_email_preferred_username_when_email_missing() {
        // No email claim, preferred_username is a bare username — must not be used for matching.
        assertThatThrownBy(() -> resolver.resolveCustomerCode(jwt(Map.of(
                "preferred_username", "alice"
        )))).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_when_no_email_claim_at_all() {
        assertThatThrownBy(() -> resolver.resolveCustomerCode(jwt(Map.of(
                "sub", "kc-uuid-123"
        )))).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_when_customer_not_found_for_email() {
        when(customerRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resolver.resolveCustomerCode(jwt(Map.of(
                "email", "ghost@example.com"
        )))).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_when_authentication_is_null() {
        assertThatThrownBy(() -> resolver.resolveCustomerCode(null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_anonymous_authentication() {
        Authentication anon = new AnonymousAuthenticationToken(
                "key", "anon", java.util.List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS")));
        assertThatThrownBy(() -> resolver.resolveCustomerCode(anon))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_non_jwt_principal() {
        Authentication nonJwt = new UsernamePasswordAuthenticationToken(
                "user@example.com", "pwd", java.util.List.of(new SimpleGrantedAuthority("ROLE_USER")));
        assertThatThrownBy(() -> resolver.resolveCustomerCode(nonJwt))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_blank_email_claim() {
        assertThatThrownBy(() -> resolver.resolveCustomerCode(jwt(Map.of(
                "email", "   "
        )))).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void rejects_email_without_domain_dot() {
        assertThatThrownBy(() -> resolver.resolveCustomerCode(jwt(Map.of(
                "email", "user@localhost"
        )))).isInstanceOf(AccessDeniedException.class);
    }

    private static Authentication jwt(Map<String, Object> claims) {
        Map<String, Object> headers = new HashMap<>();
        headers.put("alg", "none");
        Map<String, Object> safeClaims = new HashMap<>(claims);
        if (!safeClaims.containsKey("sub")) {
            safeClaims.put("sub", "kc-uuid-test");
        }
        Jwt jwt = new Jwt("token-value", Instant.now(), Instant.now().plusSeconds(60), headers, safeClaims);
        // Use the (Jwt, authorities) constructor so the token reports authenticated=true.
        return new JwtAuthenticationToken(jwt, java.util.Collections.emptyList());
    }

    private static CustomerEntity customer(String customerCode, String email) {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode(customerCode);
        entity.setEmail(email);
        entity.setFullName("Test User");
        entity.setSegment("standard");
        entity.setPreferredCategory("general");
        return entity;
    }
}
