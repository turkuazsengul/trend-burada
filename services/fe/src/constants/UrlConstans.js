const runtimeConfig = typeof window !== "undefined" && window.__APP_CONFIG__ ? window.__APP_CONFIG__ : {};
const getConfigValue = (key, fallbackValue = "") => runtimeConfig[key] || process.env[key] || fallbackValue;
const getBooleanConfigValue = (key, fallbackValue) => {
    const rawValue = runtimeConfig[key] || process.env[key];
    if (rawValue === undefined) {
        return fallbackValue;
    }
    return String(rawValue).toLowerCase() === "true";
}
const getListConfigValue = (key, fallbackValue = []) => {
    const rawValue = runtimeConfig[key] || process.env[key];
    if (!rawValue) {
        return fallbackValue;
    }

    return String(rawValue)
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
}

export const KEYCLOAK_BASE_URL = getConfigValue("REACT_APP_KEYCLOAK_BASE_URL")
export const KEYCLOAK_TOKEN_URL = getConfigValue("REACT_APP_KEYCLOAK_TOKEN_URL")


export const LOGIN_URL = getConfigValue("REACT_APP_LOGIN_URL")
export const USER_INFO_URL = getConfigValue("REACT_APP_USER_INFO_URL")
export const USER_UPDATE_URL = getConfigValue("REACT_APP_USER_UPDATE_URL")
export const REGISTER_URL = getConfigValue("REACT_APP_REGISTER_URL")
export const LOGOUT_URL = getConfigValue("REACT_APP_LOGOUT_URL")
export const USER_SERVICE_BASE_URL = getConfigValue("REACT_APP_USER_SERVICE_BASE_URL")
export const ACCOUNT_STATUS_URL = getConfigValue("REACT_APP_ACCOUNT_STATUS_URL", `${USER_SERVICE_BASE_URL}/auth/account-status`)
export const REGISTER_CONFIRM_URL = getConfigValue("REACT_APP_REGISTER_CONFIRM_URL", `${USER_SERVICE_BASE_URL}/auth/confirm`)
export const REGISTER_CREATE_CONFIRM_URL = getConfigValue("REACT_APP_REGISTER_CREATE_CONFIRM_URL", `${USER_SERVICE_BASE_URL}/auth/createConfirm`)

export const KEYCLOAK_CLIENT_ID = getConfigValue("REACT_APP_KEYCLOAK_CLIENT_ID")
export const KEYCLOAK_GRANT_TYPE = getConfigValue("REACT_APP_KEYCLOAK_GRANT_TYPE")
export const USE_DEMO_LOCAL_AUTH = getBooleanConfigValue("REACT_APP_USE_DEMO_LOCAL_AUTH", true)


export const MY_USER_INFO_URL = getConfigValue("REACT_APP_MY_USER_INFO_URL")
export const MY_ORDER_URL = getConfigValue("REACT_APP_MY_ORDER_URL")
export const MY_ADDRESS_URL = getConfigValue("REACT_APP_MY_ADDRESS_URL", "/hesabÄ±m/Adreslerim")

// Self-service customer profile (GET + PATCH). Same fallback pattern as ADDRESS_BASE_URL —
// derive from USER_SERVICE_BASE_URL when the explicit env var is missing so a single base
// URL change keeps every customer endpoint pointing at the right host.
export const CUSTOMER_ME_URL = getConfigValue(
    "REACT_APP_CUSTOMER_ME_URL",
    USER_SERVICE_BASE_URL ? `${USER_SERVICE_BASE_URL}/customer/me` : ""
)

// Backend address CRUD endpoint base. Falls back to user-service base + the controller path
// so a single REACT_APP_USER_SERVICE_BASE_URL change keeps everything pointing at the right
// host even if REACT_APP_ADDRESS_BASE_URL is forgotten in an env file.
export const ADDRESS_BASE_URL = getConfigValue(
    "REACT_APP_ADDRESS_BASE_URL",
    USER_SERVICE_BASE_URL ? `${USER_SERVICE_BASE_URL}/customer/me/addresses` : ""
)

export const PROMO_IMAGES_URL = getConfigValue("REACT_APP_PROMO_IMAGES_URL")
export const USE_STATIC_PROMO_IMAGES = getBooleanConfigValue("REACT_APP_USE_STATIC_PROMO_IMAGES", true)
export const CAMPAIGN_ITEMS_URL = getConfigValue("REACT_APP_CAMPAIGN_ITEMS_URL")
export const USE_STATIC_CAMPAIGN_ITEMS = getBooleanConfigValue("REACT_APP_USE_STATIC_CAMPAIGN_ITEMS", true)

export const PRODUCT_LIST_URL = getConfigValue("REACT_APP_PRODUCT_LIST_URL")
export const PRODUCT_DETAIL_URL = getConfigValue("REACT_APP_PRODUCT_DETAIL_URL")
export const PRODUCT_FACETS_URL = getConfigValue("REACT_APP_PRODUCT_FACETS_URL")
export const USE_STATIC_PRODUCT_DATA = getBooleanConfigValue("REACT_APP_USE_STATIC_PRODUCT_DATA", true)
export const SEARCH_URL = getConfigValue("REACT_APP_SEARCH_URL")
export const USE_STATIC_SEARCH_DATA = getBooleanConfigValue("REACT_APP_USE_STATIC_SEARCH_DATA", true)

export const FAVORITE_LIST_URL = getConfigValue("REACT_APP_FAVORITE_LIST_URL")
export const FAVORITE_TOGGLE_URL = getConfigValue("REACT_APP_FAVORITE_TOGGLE_URL")
export const USE_STATIC_FAVORITE_DATA = getBooleanConfigValue("REACT_APP_USE_STATIC_FAVORITE_DATA", true)

export const APP_CUSTOMER_HOSTS = getListConfigValue("REACT_APP_CUSTOMER_HOSTS", ["trendburada.local", "localhost"])
export const APP_SELLER_HOSTS = getListConfigValue("REACT_APP_SELLER_HOSTS", ["seller.trendburada.local"])
export const APP_ADMIN_HOSTS = getListConfigValue("REACT_APP_ADMIN_HOSTS", ["admin.trendburada.local"])
