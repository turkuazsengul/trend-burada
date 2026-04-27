package com.trendburada.customer.application;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read + write surface for the JWT-scoped customer profile.
 *
 * <p>The service exposes only the {@link #getMe(CustomerEntity)} /
 * {@link #patchMe(CustomerEntity, CustomerProfileUpdateRequest)} pair that powers
 * {@code GET|PATCH /api/v1/customer/me}. The controller resolves the calling customer via
 * {@code AuthenticatedCustomerResolver} and passes the entity in &mdash; the service never
 * reads the SecurityContext directly, same convention as {@code AddressService}.
 *
 * <p>The previous unscoped debug endpoints ({@code /profile}, {@code /profiles},
 * {@code POST /profiles}) were removed because they leaked PII to any authenticated
 * caller (they were not behind an admin role guard).
 */
@Service
public class CustomerQueryService {

    /** Allowed gender values, normalised to UPPERCASE before persistence. Source of truth. */
    private static final Set<String> ALLOWED_GENDERS = Set.of("MALE", "FEMALE", "UNSPECIFIED");

    private final CustomerRepository customerRepository;

    public CustomerQueryService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Read the JWT-resolved caller's profile. The argument is the full entity (not the id)
     * so the controller's resolver does the single DB read; this method maps without a
     * second round trip.
     */
    public CustomerProfileSummary getMe(CustomerEntity caller) {
        if (caller == null) {
            throw new IllegalArgumentException("caller is required");
        }
        return map(caller);
    }

    /**
     * Apply a partial update to the caller's profile and persist. {@code null} fields on the
     * request are skipped (PATCH semantics); non-null values are normalised before write
     * (gender uppercased, birthDate parsed to {@link LocalDate}).
     *
     * <p>The {@code @Pattern} annotations on
     * {@link CustomerProfileUpdateRequest} have already rejected obviously bad input by the
     * time we get here, so the only thing that can still fail is {@code LocalDate.parse}
     * raising on calendar-impossible dates (e.g. Feb 31). We surface those as
     * {@link IllegalArgumentException}, which the controller advice maps to a 400 just like
     * the bean-validation path would.
     */
    @Transactional
    public CustomerProfileSummary patchMe(CustomerEntity caller, CustomerProfileUpdateRequest request) {
        if (caller == null) {
            throw new IllegalArgumentException("caller is required");
        }
        if (request == null) {
            // Empty body is a no-op rather than an error: PATCH with no fields is a valid
            // (if pointless) request and the caller may rely on the round-trip to read the
            // current state. Just re-map the existing entity.
            return map(caller);
        }

        if (request.gender() != null) {
            String normalised = request.gender().trim().toUpperCase(Locale.ROOT);
            if (!ALLOWED_GENDERS.contains(normalised)) {
                // Defensive: regex on the DTO already covers this, but if a future caller
                // bypasses the controller (e.g. internal admin script), we still reject.
                throw new InvalidCustomerProfileFieldException(
                        "gender", "gender must be one of: male, female, unspecified");
            }
            caller.setGender(normalised);
        }

        if (request.birthDate() != null) {
            try {
                caller.setBirthDate(LocalDate.parse(request.birthDate().trim()));
            } catch (DateTimeParseException ex) {
                // Calendar-impossible dates land here (regex passed but Feb 31 etc).
                throw new InvalidCustomerProfileFieldException(
                        "birthDate", "birthDate is not a valid calendar date");
            }
        }

        if (request.phone() != null) {
            caller.setPhone(request.phone().trim());
        }

        return map(customerRepository.save(caller));
    }

    private CustomerProfileSummary map(CustomerEntity entity) {
        return new CustomerProfileSummary(
                entity.getCustomerCode(),
                entity.getFullName(),
                entity.getEmail(),
                entity.getSegment(),
                entity.getPreferredCategory(),
                entity.getGender(),
                entity.getBirthDate() == null ? null : entity.getBirthDate().toString(),
                entity.getPhone()
        );
    }
}
