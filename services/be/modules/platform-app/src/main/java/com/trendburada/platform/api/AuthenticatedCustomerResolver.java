package com.trendburada.platform.api;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Resolves the {@link CustomerEntity} of the currently authenticated user.
 *
 * <p>Lookup is intentionally narrow: only a trusted email is used to find the customer.
 * The Keycloak {@code email} claim is preferred; {@code preferred_username} is accepted only
 * when it is in email format. The Keycloak {@code sub} is NOT used as a fallback because the
 * customer table currently has no {@code keycloak_sub} column to match against.
 *
 * <p>Returns 403 ({@link AccessDeniedException}) when no email claim is available or when no
 * matching {@link CustomerEntity} exists. This guarantees that endpoints that scope to the
 * authenticated customer (cart, addresses, etc.) can never be steered at a customer the caller
 * does not own &mdash; even if the caller supplies a different customer code in the request.
 *
 * <p>This component used to be named {@code CartPrincipalResolver}. It was renamed when the
 * second &quot;scoped to me&quot; feature (customer addresses) was added, so that the name
 * reflects its general role rather than the original caller.
 */
@Component
public class AuthenticatedCustomerResolver {

    private final CustomerRepository customerRepository;

    public AuthenticatedCustomerResolver(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Resolves the full {@link CustomerEntity} for the caller. Prefer this over
     * {@link #resolveCustomerCode(Authentication)} when you need the customer's UUID
     * (e.g. to set a foreign key) so we don't pay for a second DB round trip.
     */
    public CustomerEntity resolveCustomer(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new AccessDeniedException("Authentication required");
        }

        String email = extractTrustedEmail(authentication);
        if (email == null) {
            throw new AccessDeniedException("Access requires a trusted email claim");
        }

        return customerRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException(
                        "No customer is linked to the authenticated user"));
    }

    /**
     * Convenience overload that returns just the business-facing customer code.
     */
    public String resolveCustomerCode(Authentication authentication) {
        return resolveCustomer(authentication).getCustomerCode();
    }

    private String extractTrustedEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof Jwt jwt)) {
            return null;
        }

        String email = jwt.getClaimAsString("email");
        if (isEmail(email)) {
            return email.trim();
        }

        // preferred_username may carry the email in some Keycloak configurations.
        // Accept it ONLY when it actually looks like an email; never fall back to a bare username,
        // because that would bypass the customer.email match contract.
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        if (isEmail(preferredUsername)) {
            return preferredUsername.trim();
        }

        return null;
    }

    private static boolean isEmail(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return false;
        }
        int at = trimmed.indexOf('@');
        if (at <= 0 || at != trimmed.lastIndexOf('@') || at == trimmed.length() - 1) {
            return false;
        }
        // Reject whitespace inside the value.
        for (int i = 0; i < trimmed.length(); i++) {
            if (Character.isWhitespace(trimmed.charAt(i))) {
                return false;
            }
        }
        // Domain must contain a dot.
        return trimmed.indexOf('.', at + 1) > 0;
    }
}
