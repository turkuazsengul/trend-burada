package com.trendburada.customer.application;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bridges identity (Keycloak) with the local customer record.
 *
 * <p>The contract is deliberately narrow: given a verified email and a display name, return
 * the {@link CustomerEntity} that belongs to that identity, creating one if it does not yet
 * exist. This is the seam every code path that turns &quot;a Keycloak user&quot; into &quot;a
 * customer in our system&quot; should go through &mdash; auth-module's confirm flow, the
 * startup backfill runner, and any future SSO / IdP integration.
 *
 * <p>Idempotency is the load-bearing property: the method is safe to call from multiple
 * places without coordinating, and concurrent first-time provisions for the same email
 * resolve to a single row because {@code customers.email} carries a {@code UNIQUE}
 * constraint at the DB level (see {@link CustomerEntity}). If a race leads to a unique
 * violation on insert, we re-read and return the row the other thread won.
 */
@Service
public class CustomerProvisioningService {

    private static final String DEFAULT_SEGMENT = "standard";
    private static final String DEFAULT_PREFERRED_CATEGORY = "general";

    private final CustomerRepository customerRepository;

    public CustomerProvisioningService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * @param email     verified email from the identity provider; will be lower-cased and trimmed
     *                  before matching, because that is the form {@code customers.email} is
     *                  always stored in (see {@code AuthService.register})
     * @param fullName  display name used only when a row is created; existing rows are NOT
     *                  re-named, because the customer profile may have been edited locally
     *                  after creation and we do not want IdP-side renames to clobber that
     * @return the existing or newly-created {@link CustomerEntity}
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CustomerEntity ensureCustomer(String email, String fullName) {
        // REQUIRES_NEW is intentional: the auth-module calls this from inside its own
        // confirm() transaction. If provisioning fails (e.g. concurrent insert race that
        // even our retry below can't recover from), the outer email-verification tx must
        // still commit — the user has done their part, and the startup backfill runner will
        // retry provisioning on the next boot. Without REQUIRES_NEW, a thrown-and-caught
        // exception inside the inner save would still mark the outer tx rollback-only.
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        String normalizedEmail = email.trim().toLowerCase();

        return customerRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> createCustomer(normalizedEmail, fullName));
    }

    private CustomerEntity createCustomer(String email, String fullName) {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode(generateCustomerCode());
        entity.setEmail(email);
        entity.setFullName(coalesce(fullName, email));
        entity.setSegment(DEFAULT_SEGMENT);
        entity.setPreferredCategory(DEFAULT_PREFERRED_CATEGORY);
        try {
            return customerRepository.saveAndFlush(entity);
        } catch (org.springframework.dao.DataIntegrityViolationException race) {
            // Another concurrent provision (e.g. backfill runner + first authenticated request)
            // beat us to the unique(email) insert. Re-read so the caller still gets a row.
            return customerRepository.findByEmail(email)
                    .orElseThrow(() -> race);
        }
    }

    private static String coalesce(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    /**
     * Generates a human-readable, time-suffixed customer code. Uniqueness is enforced by the
     * DB ({@code customers.customer_code} is UNIQUE) so the timestamp here is a hint for
     * humans tailing logs, not a guarantee. If two concurrent provisions land on the same
     * millisecond, one will fail the unique check and the catch in
     * {@link #createCustomer(String, String)} will resolve to the winning row.
     */
    private static String generateCustomerCode() {
        return "cust-" + System.currentTimeMillis();
    }
}
