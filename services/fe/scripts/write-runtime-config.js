const fs = require("fs");
const path = require("path");

const configKeys = [
    "REACT_APP_KEYCLOAK_BASE_URL",
    "REACT_APP_KEYCLOAK_TOKEN_URL",
    "REACT_APP_USER_SERVICE_BASE_URL",
    "REACT_APP_LOGIN_URL",
    "REACT_APP_USER_INFO_URL",
    "REACT_APP_USER_UPDATE_URL",
    "REACT_APP_REGISTER_URL",
    "REACT_APP_REGISTER_CONFIRM_URL",
    "REACT_APP_REGISTER_CREATE_CONFIRM_URL",
    "REACT_APP_LOGOUT_URL",
    "REACT_APP_KEYCLOAK_CLIENT_ID",
    "REACT_APP_KEYCLOAK_GRANT_TYPE",
    "REACT_APP_MY_USER_INFO_URL",
    "REACT_APP_MY_ORDER_URL",
    "REACT_APP_MY_ADDRESS_URL",
    "REACT_APP_USE_DEMO_LOCAL_AUTH",
    "REACT_APP_PROMO_IMAGES_URL",
    "REACT_APP_USE_STATIC_PROMO_IMAGES",
    "REACT_APP_CAMPAIGN_ITEMS_URL",
    "REACT_APP_USE_STATIC_CAMPAIGN_ITEMS",
    "REACT_APP_PRODUCT_LIST_URL",
    "REACT_APP_PRODUCT_DETAIL_URL",
    "REACT_APP_PRODUCT_FACETS_URL",
    "REACT_APP_USE_STATIC_PRODUCT_DATA",
    "REACT_APP_SEARCH_URL",
    "REACT_APP_USE_STATIC_SEARCH_DATA",
    "REACT_APP_FAVORITE_LIST_URL",
    "REACT_APP_FAVORITE_TOGGLE_URL",
    "REACT_APP_USE_STATIC_FAVORITE_DATA",
    "REACT_APP_CUSTOMER_HOSTS",
    "REACT_APP_SELLER_HOSTS",
    "REACT_APP_ADMIN_HOSTS"
];

const targetArg = process.argv[2];
const outputPath = targetArg
    ? path.resolve(process.cwd(), targetArg)
    : path.resolve(process.cwd(), "public", "runtime-config.js");

const config = configKeys.reduce((acc, key) => {
    if (process.env[key] !== undefined && process.env[key] !== "") {
        acc[key] = process.env[key];
    }
    return acc;
}, {});

const output = `window.__APP_CONFIG__ = ${JSON.stringify(config, null, 4)};\n`;

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, output, "utf8");

console.log(`runtime config written to ${outputPath}`);
