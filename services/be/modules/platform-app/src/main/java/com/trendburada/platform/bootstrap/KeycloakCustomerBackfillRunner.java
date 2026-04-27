package com.trendburada.platform.bootstrap;

import com.trendburada.auth.application.KeycloakAdminService;
import com.trendburada.customer.application.CustomerProvisioningService;
import java.util.List;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * On application startup, walks every email-verified user in the Keycloak realm and ensures
 * that each one has a matching {@code customer.customers} row.
 *
 * <p>Why this exists: until now, customer rows were only created via an admin-only HTTP
 * endpoint, so any Keycloak user that signed up before {@code AuthService.confirm} learned
 * to provision was orphaned &mdash; their JWTs were valid but {@code AuthenticatedCustomerResolver}
 * could not find them, returning HTTP 403 from every {@code /customer/me/*} endpoint. This
 * runner backfills those orphans on the next boot, so operators do not have to write SQL by
 * hand. New signups going forward are provisioned at confirm time and never reach this code
 * path.
 *
 * <p>Failure isolation: any per-user failure (Keycloak network blip, DB unique race, etc.)
 * is caught and logged so it cannot abort the runner or, more importantly, abort the whole
 * application boot. Provisioning is idempotent, so a partial run can simply be retried by
 * restarting again.
 *
 * <p>Performance: pages users 100 at a time and stops at the first empty page. For a realm
 * with thousands of users this is a one-time per-boot scan; for a realm with millions of
 * users you would want to gate this behind a config flag &mdash; left as a follow-up.
 */
@Component
@Order(100) // run after Keycloak realm bootstrap (which has no @Order, so it runs at default
public class KeycloakCustomerBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(KeycloakCustomerBackfillRunner.class);
    private static final int PAGE_SIZE = 100;

    private final KeycloakAdminService keycloakAdminService;
    private final CustomerProvisioningService customerProvisioningService;

    public KeycloakCustomerBackfillRunner(KeycloakAdminService keycloakAdminService,
                                          CustomerProvisioningService customerProvisioningService) {
        this.keycloakAdminService = keycloakAdminService;
        this.customerProvisioningService = customerProvisioningService;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting Keycloak → customer backfill scan");
        long scanned = 0;
        long provisioned = 0;
        long skippedUnverified = 0;
        long failed = 0;

        int offset = 0;
        while (true) {
            List<UserRepresentation> page = safeListPage(offset, PAGE_SIZE);
            if (page == null || page.isEmpty()) {
                break;
            }
            for (UserRepresentation user : page) {
                scanned++;
                try {
                    if (!Boolean.TRUE.equals(user.isEmailVerified())) {
                        // Unverified users intentionally do not get customer rows; they
                        // would never make it past /auth/login anyway (login refuses
                        // unverified emails) so a provisioned row would be dead weight.
                        skippedUnverified++;
                        continue;
                    }
                    String email = user.getEmail();
                    if (email == null || email.isBlank()) {
                        // Service-only users with no email — e.g. a Keycloak service
                        // account — cannot ever be matched by the email-based resolver.
                        skippedUnverified++;
                        continue;
                    }
                    customerProvisioningService.ensureCustomer(email, buildDisplayName(user));
                    provisioned++;
                } catch (RuntimeException ex) {
                    failed++;
                    log.warn("Backfill failed for Keycloak user {} ({}): {}",
                            user.getId(), user.getEmail(), ex.getMessage());
                }
            }
            if (page.size() < PAGE_SIZE) {
                break;
            }
            offset += page.size();
        }

        log.info("Keycloak → customer backfill done: scanned={}, ensured={}, skipped(unverified/no-email)={}, failed={}",
                scanned, provisioned, skippedUnverified, failed);
    }

    private List<UserRepresentation> safeListPage(int offset, int pageSize) {
        try {
            return keycloakAdminService.listUsers(offset, pageSize);
        } catch (RuntimeException ex) {
            // Don't crash boot if Keycloak is briefly unreachable. Log and stop the scan;
            // next boot will retry.
            log.warn("Could not list Keycloak users at offset {}: {} — aborting backfill",
                    offset, ex.getMessage());
            return null;
        }
    }

    private static String buildDisplayName(UserRepresentation user) {
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String combined = (first + " " + last).trim();
        if (!combined.isEmpty()) {
            return combined;
        }
        return user.getEmail();
    }
}
