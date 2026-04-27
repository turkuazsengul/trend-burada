package com.trendburada.customer.application;

import com.trendburada.customer.domain.CustomerEntity;
import com.trendburada.customer.domain.CustomerRepository;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read + write surface for customer profile data.
 *
 * <p>Two distinct call patterns live here:
 * <ul>
 *   <li>The legacy {@code /profile} / {@code /profiles} debug endpoints (controller-supplied
 *       email or no scoping at all). These are kept for backwards compatibility with the
 *       admin tooling and intentionally bypass JWT scoping.</li>
 *   <li>The JWT-scoped {@link #getMe(CustomerEntity)} / {@link #patchMe(CustomerEntity, CustomerProfileUpdateRequest)}
 *       pair that powers {@code GET|PATCH /api/v1/customer/me}. The controller is responsible
 *       for resolving the calling customer via {@code AuthenticatedCustomerResolver} and
 *       passing the entity in &mdash; the service never reads the SecurityContext directly,
 *       same convention as {@code AddressService}.</li>
 * </ul>
 */
@Service
public class CustomerQueryService {

    /** Allowed gender values, normalised to UPPERCASE before persistence. Source of truth. */
    private static final Set<String> ALLOWED_GENDERS = Set.of("MALE", "FEMALE", "UNSPECIFIED");

    private final CustomerRepository customerRepository;

    public CustomerQueryService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public CustomerProfileSummary getProfile() {
        return customerRepository.findAll().stream()
                .findFirst()
                .map(this::map)
                .orElse(null);
    }

    public CustomerProfileSummary getProfileByEmail(String email) {
        return customerRepository.findByEmail(email)
                .map(this::map)
                .orElse(null);
    }

    public List<CustomerProfileSummary> getProfiles() {
        return customerRepository.findAll().stream().map(this::map).toList();
    }

    public CustomerProfileSummary create(CreateCustomerRequest request) {
        CustomerEntity entity = new CustomerEntity();
        entity.setCustomerCode("cust-" + System.currentTimeMillis());
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setSegment(request.segment());
        entity.setPreferredCategory(request.preferredCategory());
        return map(customerRepository.save(entity));
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
