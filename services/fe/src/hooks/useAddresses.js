import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import AddressService from "../service/AddressService";

/**
 * React Query bindings for the customer address feature.
 *
 * Cross-surface sync rationale:
 *   The address list is read by both the profile page (MyUserInfo) and the checkout page
 *   (CartPage). Without a shared cache they would each have their own useState copy and any
 *   mutation in one would silently drift from the other. By going through React Query with
 *   a single ['addresses'] key, every mutation that calls `invalidateQueries(['addresses'])`
 *   re-renders both surfaces with no manual prop drilling.
 *
 * Auth note:
 *   Every query is enabled only when a Bearer token exists. Guests don't hit the backend
 *   (they would get 401 anyway, but pre-empting it keeps the network tab clean and lets
 *   the UI render an empty list instantly).
 */

const ADDRESSES_QUERY_KEY = ["addresses"];

const hasAuthToken = () =>
    typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

export const useAddresses = () =>
    useQuery({
        queryKey: ADDRESSES_QUERY_KEY,
        queryFn: AddressService.getAddresses,
        // Don't fire for guests — UI can render the empty state without a 401 round trip.
        enabled: hasAuthToken(),
        // Server already orders by isDefault desc + createdAt desc. Keep stale time short
        // so a tab regaining focus refetches if another tab created an address (the cross-
        // tab sync is handled automatically by RQ refetchOnWindowFocus).
        staleTime: 30 * 1000,
    });

const useAddressMutation = (mutationFn) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ADDRESSES_QUERY_KEY});
        },
    });
};

export const useCreateAddress = () =>
    useAddressMutation((body) => AddressService.createAddress(body));

export const useUpdateAddress = () =>
    useAddressMutation(({id, body}) => AddressService.updateAddress(id, body));

export const useDeleteAddress = () =>
    useAddressMutation((id) => AddressService.deleteAddress(id));

/**
 * Helper: building a "set as default" body from an existing AddressView.
 *
 * Backend's PUT is full-replace (intentionally — see AddressRequest javadoc), so making one
 * address the default means re-sending every field with `isDefault: true`. The server will
 * atomically clear isDefault on the previous default in the same transaction.
 *
 * Callers do:
 *   const updateMutation = useUpdateAddress();
 *   updateMutation.mutate({ id: address.id, body: buildSetDefaultBody(address) });
 */
export const buildSetDefaultBody = (address) => ({
    title: address.title || "",
    fullName: address.fullName || "",
    phone: address.phone || "",
    country: address.country || "Türkiye",
    city: address.city || "",
    district: address.district || "",
    neighborhood: address.neighborhood || "",
    addressLine: address.addressLine || "",
    postalCode: address.postalCode || "",
    isDefault: true,
});
