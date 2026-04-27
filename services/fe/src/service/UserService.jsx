import axios from "axios";
import {CUSTOMER_ME_URL} from "../constants/UrlConstans";

/**
 * Authenticated customer profile service. Talks to the new backend's `/api/v1/customer/me`
 * endpoint pair (GET + PATCH) — both JWT-scoped on the server, so no customer identifier is
 * passed in any URL, query, or body.
 *
 * The legacy `getUser(token)` and `updateUser(user)` helpers used to hit the legacy
 * `ms-api-user` controller (`/api/v1/user/management/get|update`). Those endpoints are no
 * longer the source of truth for the profile screen — `useCustomerProfile` (React Query) is
 * the one read/write surface. They were removed when the profile screen was migrated.
 */

const buildAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
};

// Server response is wrapped in ApiResponse<T>. Tolerate both new ({data}) and legacy
// ({returnData: [T]}) shapes the same way AddressService does — different controllers in the
// codebase still emit the older zarf, so the unwrap stays defensive.
const unwrapApiResponse = (responseData) => {
    if (responseData == null) {
        return null;
    }
    if (Object.prototype.hasOwnProperty.call(responseData, "data")) {
        return responseData.data;
    }
    if (Array.isArray(responseData.returnData) && responseData.returnData.length > 0) {
        return responseData.returnData[0];
    }
    return responseData;
};

const getMe = () =>
    axios.get(CUSTOMER_ME_URL, {headers: buildAuthHeaders()})
        .then((response) => unwrapApiResponse(response.data));

// PATCH is partial-update on the server: any field absent / null on the body is left
// untouched. Callers should send only the fields they want to change.
const updateMe = (body) =>
    axios.patch(CUSTOMER_ME_URL, body, {headers: buildAuthHeaders()})
        .then((response) => unwrapApiResponse(response.data));

export default {
    getMe,
    updateMe,
};
