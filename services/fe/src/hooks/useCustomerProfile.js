import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import UserService from "../service/UserService";

/**
 * React Query bindings for the authenticated customer profile.
 *
 * Cross-surface sync rationale:
 *   The profile object (fullName / email / gender / birthDate / phone) is consumed by the
 *   profile page (MyUserInfo) today and will be picked up by the navbar avatar dropdown
 *   next. Going through React Query with a single ['customer','me'] key means a successful
 *   PATCH mutation here re-renders every consumer with no manual prop drilling — the same
 *   pattern useAddresses already follows for the ['addresses'] key.
 *
 * Auth note:
 *   The query is enabled only when a Bearer token exists in localStorage. Guests don't
 *   trigger a 401 round-trip; the UI can render the empty / login-required state instantly.
 *
 * Mirrors the legacy contract that MyUserInfo.js consumes:
 *   - useCustomerProfile()         -> { data, isLoading, isError, error, ... }
 *   - useUpdateCustomerProfile()   -> mutation with .mutate(body, { onSuccess, onError }), .isLoading
 *   - extractFieldErrors(error)    -> { fieldName: message, ... } parsed from a 400 response
 */

const CUSTOMER_ME_QUERY_KEY = ["customer", "me"];

const hasAuthToken = () =>
    typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

export const useCustomerProfile = () =>
    useQuery({
        queryKey: CUSTOMER_ME_QUERY_KEY,
        queryFn: UserService.getMe,
        // Skip the request for guests so the network tab stays clean and the UI can render
        // its login-required branch without waiting on a 401.
        enabled: hasAuthToken(),
        // Profile mutates rarely. A short stale time gives the rest of the app a fresh copy
        // when the tab regains focus (e.g. user changed gender in another tab) without
        // hammering the backend.
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
            // Don't retry on 401 / 403: the bearer token is missing or revoked, retrying
            // can only produce more 401s. The component watches `error.response.status`
            // and bounces the user to /login when it sees one.
            const status = error && error.response && error.response.status;
            if (status === 401 || status === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });

export const useUpdateCustomerProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body) => UserService.updateMe(body),
        onSuccess: () => {
            // Invalidate so every consumer (current page + future navbar avatar) refetches
            // the new profile body. Server returns the updated entity on PATCH but we'd
            // rather re-derive from the canonical GET to stay in sync with any server-side
            // computed fields (e.g. customerCode rebuild) that PATCH may not echo back.
            queryClient.invalidateQueries({queryKey: CUSTOMER_ME_QUERY_KEY});
        },
    });
};

/**
 * Pull a {field: message} map out of an axios error returned by /api/v1/customer/me PATCH.
 *
 * Server contract (ApiExceptionHandler.handleValidation in services/be):
 *   HTTP 400, body = { success: false, data: { phone: "invalid", ... }, message: "Validation failed" }
 *
 * We also tolerate two older shapes that other controllers in the codebase still emit, so a
 * future BE handler swap doesn't silently break this UI:
 *   - { fieldErrors: { phone: "..." } }
 *   - { errors: [{ field: "phone", defaultMessage: "..." }] }   // raw Spring DefaultErrorAttributes
 *
 * Returns an empty object when the error is not a structured validation error (network
 * error, 500, missing payload, etc.) so the caller can safely spread it into setState.
 */
export const extractFieldErrors = (error) => {
    const payload = error && error.response && error.response.data;
    if (!payload || typeof payload !== "object") {
        return {};
    }

    // New ApiResponse<Map<String,String>> shape from ApiExceptionHandler.
    if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
        const nested = payload.data;
        // Make sure the values look like error messages (strings) before trusting them —
        // a 200 GET response also has `data` but it's the profile object, not a field map.
        if (Object.values(nested).every((value) => typeof value === "string")) {
            return {...nested};
        }
    }

    // Legacy { fieldErrors: {...} } shape.
    if (payload.fieldErrors && typeof payload.fieldErrors === "object") {
        return {...payload.fieldErrors};
    }

    // Raw Spring DefaultErrorAttributes shape.
    if (Array.isArray(payload.errors)) {
        return payload.errors.reduce((acc, item) => {
            if (item && item.field) {
                acc[item.field] = item.defaultMessage || item.message || "invalid";
            }
            return acc;
        }, {});
    }

    return {};
};
