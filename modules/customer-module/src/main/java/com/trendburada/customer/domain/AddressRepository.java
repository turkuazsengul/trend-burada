package com.trendburada.customer.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AddressRepository extends JpaRepository<AddressEntity, UUID> {

    /**
     * All addresses owned by the given customer, newest-default first then by creation time
     * descending. Sort is encoded here so the controller can stay free of presentation logic.
     */
    List<AddressEntity> findAllByCustomerIdOrderByIsDefaultDescCreatedAtDesc(UUID customerId);

    /**
     * Ownership-aware lookup. Used for PUT/DELETE so the service can reject a request that
     * targets an address owned by a different customer with a single query rather than
     * loading the entity and then comparing fields (which races with concurrent deletes).
     */
    Optional<AddressEntity> findByIdAndCustomerId(UUID id, UUID customerId);

    /**
     * Ownership-aware delete. Returns the row count so the caller can distinguish
     * "not found / not yours" (0) from "deleted" (1).
     */
    long deleteByIdAndCustomerId(UUID id, UUID customerId);

    /**
     * Clears the default flag on every address belonging to a customer. Used by the create
     * path: before inserting a new default, we wipe any existing default for that customer
     * so the {@code uq_addresses_one_default_per_customer} partial unique index does not
     * fire on the INSERT.
     *
     * <p>Must run inside a transaction. {@code flushAutomatically=false} is intentional:
     * there are no pending entity changes at this point in the create flow, and we don't
     * want to accidentally flush a half-built entity that is already in the persistence
     * context.
     */
    @Modifying(flushAutomatically = false, clearAutomatically = true)
    @Query("update AddressEntity a set a.isDefault = false "
            + "where a.customerId = :customerId and a.isDefault = true")
    int clearAllDefaultsForCustomer(@Param("customerId") UUID customerId);

    /**
     * Same as {@link #clearAllDefaultsForCustomer(UUID)} but excludes one address id. Used
     * by the update path when flipping an existing row to default: the row's own UPDATE
     * will set {@code is_default=true} at flush time, so we only want to clear the OTHER
     * rows.
     */
    @Modifying(flushAutomatically = false, clearAutomatically = true)
    @Query("update AddressEntity a set a.isDefault = false "
            + "where a.customerId = :customerId and a.id <> :excludingId and a.isDefault = true")
    int clearDefaultForCustomerExcept(@Param("customerId") UUID customerId,
                                      @Param("excludingId") UUID excludingId);
}
