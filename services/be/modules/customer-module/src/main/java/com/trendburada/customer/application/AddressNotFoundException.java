package com.trendburada.customer.application;

import com.trendburada.shared.NotFoundException;
import java.util.UUID;

/**
 * Thrown by {@link AddressService} when an address is requested by id and either does not
 * exist or belongs to a different customer.
 *
 * <p>The two cases are intentionally collapsed into one error: returning &quot;exists but not
 * yours&quot; would leak the existence of another customer's address ids. The global
 * {@code ApiExceptionHandler} translates any {@link NotFoundException} subclass to HTTP 404.
 */
public class AddressNotFoundException extends NotFoundException {

    public AddressNotFoundException(UUID addressId) {
        super("Address " + addressId + " not found");
    }
}
