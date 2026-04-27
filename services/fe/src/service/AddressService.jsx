import axios from "axios";
import {ADDRESS_BASE_URL} from "../constants/UrlConstans";

/**
 * Thin axios wrapper around the customer address CRUD endpoints exposed by
 * `trend-burada-be / modules/platform-app / CustomerAddressController`.
 *
 *   GET    /api/v1/customer/me/addresses        list  -> ApiResponse<List<AddressView>>
 *   POST   /api/v1/customer/me/addresses        201   -> ApiResponse<AddressView>
 *   PUT    /api/v1/customer/me/addresses/{id}   200   -> ApiResponse<AddressView>
 *   DELETE /api/v1/customer/me/addresses/{id}   204   (empty body)
 *
 * Ownership is JWT-derived on the server (resolved from the Keycloak `email` claim) so we
 * never put a `customerId` / `customerCode` in the URL, query, or body. Mismatched ids come
 * back as 404 (not 403) to avoid leaking the existence of other customers' addresses.
 *
 * There is no separate `setDefault` endpoint by design — `isDefault` is just a field on the
 * create / update body and the server atomically clears any existing default for the same
 * customer inside the same transaction.
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

// Server returns either { data: T } (Spring's ApiResponse.ok wrapper) or {returnData: [T]}
// (legacy zarf, still in some older endpoints). Tolerate both rather than betting on one.
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

const getAddresses = () =>
    axios.get(ADDRESS_BASE_URL, {headers: buildAuthHeaders()})
        .then((response) => {
            const payload = unwrapApiResponse(response.data);
            return Array.isArray(payload) ? payload : [];
        });

const createAddress = (body) =>
    axios.post(ADDRESS_BASE_URL, body, {headers: buildAuthHeaders()})
        .then((response) => unwrapApiResponse(response.data));

const updateAddress = (id, body) =>
    axios.put(`${ADDRESS_BASE_URL}/${id}`, body, {headers: buildAuthHeaders()})
        .then((response) => unwrapApiResponse(response.data));

// Server returns 204 No Content; nothing to unwrap.
const deleteAddress = (id) =>
    axios.delete(`${ADDRESS_BASE_URL}/${id}`, {headers: buildAuthHeaders()})
        .then(() => undefined);

export default {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
};
