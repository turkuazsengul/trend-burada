package com.trendburada.customer.application;

import com.trendburada.customer.domain.AddressEntity;
import com.trendburada.customer.domain.AddressRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for the &quot;my addresses&quot; feature.
 *
 * <p>Every method takes the {@code customerId} explicitly. The controller is responsible for
 * resolving the authenticated customer from the JWT (via
 * {@code AuthenticatedCustomerResolver}) and passing the UUID in. The service NEVER reads the
 * SecurityContext directly &mdash; this keeps it usable from non-HTTP contexts (admin tools,
 * batch jobs, future GraphQL layer) and makes ownership semantics obvious from the signature.
 *
 * <p>Ownership is enforced at the query level via
 * {@link AddressRepository#findByIdAndCustomerId(UUID, UUID)} and
 * {@link AddressRepository#deleteByIdAndCustomerId(UUID, UUID)}. Mismatches surface as
 * {@link AddressNotFoundException} (which the controller advice maps to 404) rather than
 * {@code AccessDenied} so we don't leak the existence of other customers' address ids.
 */
@Service
public class AddressService {

    private final AddressRepository addressRepository;

    public AddressService(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    @Transactional(readOnly = true)
    public List<AddressView> listForCustomer(UUID customerId) {
        return addressRepository
                .findAllByCustomerIdOrderByIsDefaultDescCreatedAtDesc(customerId)
                .stream()
                .map(AddressService::toView)
                .toList();
    }

    @Transactional
    public AddressView create(UUID customerId, AddressRequest request) {
        // Order matters: clear any existing default BEFORE inserting a new default row.
        // The DB enforces &quot;at most one default per customer&quot; via a partial unique
        // index, so inserting a second is_default=true row for the same customer would
        // otherwise raise a constraint violation at flush time.
        if (request.isDefault()) {
            addressRepository.clearAllDefaultsForCustomer(customerId);
        }

        AddressEntity entity = new AddressEntity();
        entity.setCustomerId(customerId);
        applyRequest(entity, request);
        return toView(addressRepository.save(entity));
    }

    @Transactional
    public AddressView update(UUID customerId, UUID addressId, AddressRequest request) {
        AddressEntity entity = addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new AddressNotFoundException(addressId));

        // Same flip-others-first ordering as create: if this row is becoming THE default,
        // wipe the existing default first so the unique partial index does not fire when
        // our own UPDATE flushes. We exclude this row's id so the clear is a no-op for it
        // (the subsequent save will set is_default=true on it).
        if (request.isDefault() && !entity.isDefault()) {
            addressRepository.clearDefaultForCustomerExcept(customerId, entity.getId());
        }

        applyRequest(entity, request);
        return toView(addressRepository.save(entity));
    }

    @Transactional
    public void delete(UUID customerId, UUID addressId) {
        long removed = addressRepository.deleteByIdAndCustomerId(addressId, customerId);
        if (removed == 0L) {
            // Either the id doesn't exist or it belongs to another customer. Treat both
            // identically so we don't leak existence; see class Javadoc.
            throw new AddressNotFoundException(addressId);
        }
    }

    private static void applyRequest(AddressEntity entity, AddressRequest request) {
        entity.setTitle(request.title().trim());
        entity.setFullName(request.fullName().trim());
        entity.setPhone(request.phone().trim());
        entity.setCountry(request.country().trim());
        entity.setCity(request.city().trim());
        entity.setDistrict(request.district().trim());
        entity.setNeighborhood(trimToNull(request.neighborhood()));
        entity.setAddressLine(request.addressLine().trim());
        entity.setPostalCode(trimToNull(request.postalCode()));
        entity.setDefault(request.isDefault());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static AddressView toView(AddressEntity entity) {
        return new AddressView(
                entity.getId(),
                entity.getTitle(),
                entity.getFullName(),
                entity.getPhone(),
                entity.getCountry(),
                entity.getCity(),
                entity.getDistrict(),
                entity.getNeighborhood(),
                entity.getAddressLine(),
                entity.getPostalCode(),
                entity.isDefault(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
