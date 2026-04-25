package com.trendburada.customer.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.trendburada.customer.domain.AddressEntity;
import com.trendburada.customer.domain.AddressRepository;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Pure-unit coverage for {@link AddressService}. The repository is mocked so the test stays
 * focused on the service's invariants:
 * <ul>
 *   <li>{@code create} stamps the resolved customer's UUID onto the entity, not whatever the
 *       caller might have set (defence-in-depth even though the controller already enforces
 *       this — the service is callable from non-HTTP contexts).</li>
 *   <li>{@code create} / {@code update} flip other defaults off when {@code isDefault=true},
 *       and DON'T touch them when {@code isDefault=false}.</li>
 *   <li>{@code update} / {@code delete} translate cross-customer / unknown ids into
 *       {@link AddressNotFoundException} (controller advice maps to 404).</li>
 * </ul>
 */
class AddressServiceTest {

    private static final UUID CUSTOMER_A = UUID.fromString("00000000-0000-0000-0000-000000000A11");
    private static final UUID CUSTOMER_B = UUID.fromString("00000000-0000-0000-0000-000000000B22");

    private final AddressRepository addressRepository = mock(AddressRepository.class);
    private final AddressService service = new AddressService(addressRepository);

    @Test
    void list_delegates_to_ordered_repo_query() {
        AddressEntity e = entityWithId(UUID.randomUUID(), CUSTOMER_A, true);
        when(addressRepository.findAllByCustomerIdOrderByIsDefaultDescCreatedAtDesc(CUSTOMER_A))
                .thenReturn(List.of(e));

        List<AddressView> result = service.listForCustomer(CUSTOMER_A);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isDefault()).isTrue();
    }

    @Test
    void create_stamps_customer_id_from_argument_not_from_request() {
        when(addressRepository.save(any(AddressEntity.class)))
                .thenAnswer(inv -> {
                    AddressEntity arg = inv.getArgument(0);
                    setId(arg, UUID.randomUUID());
                    return arg;
                });

        service.create(CUSTOMER_A, sampleRequest(false));

        ArgumentCaptor<AddressEntity> captor = ArgumentCaptor.forClass(AddressEntity.class);
        verify(addressRepository).save(captor.capture());
        assertThat(captor.getValue().getCustomerId()).isEqualTo(CUSTOMER_A);
    }

    @Test
    void create_with_default_clears_existing_defaults_BEFORE_saving_new_row() {
        UUID newId = UUID.randomUUID();
        when(addressRepository.save(any(AddressEntity.class)))
                .thenAnswer(inv -> {
                    AddressEntity arg = inv.getArgument(0);
                    setId(arg, newId);
                    return arg;
                });

        service.create(CUSTOMER_A, sampleRequest(true));

        // Order matters here: the partial unique index would reject a second default row
        // unless the existing default is cleared first. Ordered verification proves that
        // contract.
        var inOrder = org.mockito.Mockito.inOrder(addressRepository);
        inOrder.verify(addressRepository).clearAllDefaultsForCustomer(CUSTOMER_A);
        inOrder.verify(addressRepository).save(any(AddressEntity.class));
    }

    @Test
    void create_without_default_does_not_touch_other_defaults() {
        when(addressRepository.save(any(AddressEntity.class)))
                .thenAnswer(inv -> {
                    AddressEntity arg = inv.getArgument(0);
                    setId(arg, UUID.randomUUID());
                    return arg;
                });

        service.create(CUSTOMER_A, sampleRequest(false));

        verify(addressRepository, never()).clearAllDefaultsForCustomer(any());
        verify(addressRepository, never()).clearDefaultForCustomerExcept(any(), any());
    }

    @Test
    void update_throws_not_found_when_address_belongs_to_another_customer() {
        UUID addressId = UUID.randomUUID();
        // The repo's ownership-aware query already returns empty for cross-customer ids.
        when(addressRepository.findByIdAndCustomerId(addressId, CUSTOMER_A))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(CUSTOMER_A, addressId, sampleRequest(false)))
                .isInstanceOf(AddressNotFoundException.class);

        verify(addressRepository, never()).save(any());
        verify(addressRepository, never()).clearDefaultForCustomerExcept(any(), any());
        verify(addressRepository, never()).clearAllDefaultsForCustomer(any());
    }

    @Test
    void update_flipping_to_default_clears_other_defaults_BEFORE_save() {
        UUID addressId = UUID.randomUUID();
        AddressEntity existing = entityWithId(addressId, CUSTOMER_A, false);
        when(addressRepository.findByIdAndCustomerId(addressId, CUSTOMER_A))
                .thenReturn(Optional.of(existing));
        when(addressRepository.save(any(AddressEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(CUSTOMER_A, addressId, sampleRequest(true));

        // The target row's own update is excluded (so the clear is a no-op for it) and the
        // clear must happen BEFORE the save flush, otherwise the unique partial index fires.
        var inOrder = org.mockito.Mockito.inOrder(addressRepository);
        inOrder.verify(addressRepository).clearDefaultForCustomerExcept(CUSTOMER_A, addressId);
        inOrder.verify(addressRepository).save(any(AddressEntity.class));
    }

    @Test
    void update_already_default_to_default_does_not_re_clear() {
        // No state change for the default flag → no need to touch the other rows. This
        // keeps repeated PUTs of an unchanged payload free of pointless UPDATE traffic.
        UUID addressId = UUID.randomUUID();
        AddressEntity existing = entityWithId(addressId, CUSTOMER_A, true);
        when(addressRepository.findByIdAndCustomerId(addressId, CUSTOMER_A))
                .thenReturn(Optional.of(existing));
        when(addressRepository.save(any(AddressEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(CUSTOMER_A, addressId, sampleRequest(true));

        verify(addressRepository, never()).clearDefaultForCustomerExcept(any(), any());
        verify(addressRepository, never()).clearAllDefaultsForCustomer(any());
    }

    @Test
    void delete_throws_not_found_when_repo_returns_zero_rows_affected() {
        UUID addressId = UUID.randomUUID();
        when(addressRepository.deleteByIdAndCustomerId(addressId, CUSTOMER_A)).thenReturn(0L);

        assertThatThrownBy(() -> service.delete(CUSTOMER_A, addressId))
                .isInstanceOf(AddressNotFoundException.class);
    }

    @Test
    void delete_succeeds_silently_when_repo_returns_one_row_affected() {
        UUID addressId = UUID.randomUUID();
        when(addressRepository.deleteByIdAndCustomerId(addressId, CUSTOMER_A)).thenReturn(1L);

        service.delete(CUSTOMER_A, addressId);

        verify(addressRepository, times(1)).deleteByIdAndCustomerId(addressId, CUSTOMER_A);
    }

    @Test
    void delete_for_other_customers_address_does_not_touch_it() {
        // Belt-and-braces: even if a service caller passes the wrong customerId, the repo's
        // ownership-aware delete returns 0 and we surface 404. There is no path that lets a
        // mistake here corrupt customer B's data.
        UUID addressId = UUID.randomUUID();
        when(addressRepository.deleteByIdAndCustomerId(addressId, CUSTOMER_A)).thenReturn(0L);

        assertThatThrownBy(() -> service.delete(CUSTOMER_A, addressId))
                .isInstanceOf(AddressNotFoundException.class);
        verify(addressRepository, never()).deleteByIdAndCustomerId(eq(addressId), eq(CUSTOMER_B));
    }

    private static AddressRequest sampleRequest(boolean isDefault) {
        return new AddressRequest(
                "Ev",
                "Ali Veli",
                "+90 555 111 22 33",
                "Turkiye",
                "Istanbul",
                "Kadikoy",
                "Caferaga",
                "Sahil yolu No:1",
                "34710",
                isDefault
        );
    }

    private static AddressEntity entityWithId(UUID id, UUID customerId, boolean isDefault) {
        AddressEntity e = new AddressEntity();
        setId(e, id);
        e.setCustomerId(customerId);
        e.setTitle("Ev");
        e.setFullName("Ali Veli");
        e.setPhone("+90 555 111 22 33");
        e.setCountry("Turkiye");
        e.setCity("Istanbul");
        e.setDistrict("Kadikoy");
        e.setNeighborhood("Caferaga");
        e.setAddressLine("Sahil yolu No:1");
        e.setPostalCode("34710");
        e.setDefault(isDefault);
        return e;
    }

    private static void setId(AddressEntity entity, UUID id) {
        try {
            Field field = AddressEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
