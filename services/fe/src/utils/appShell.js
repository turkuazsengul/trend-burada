import {
    APP_ADMIN_HOSTS,
    APP_CUSTOMER_HOSTS,
    APP_SELLER_HOSTS
} from "../constants/UrlConstans";

const normalizeHost = (value = "") => String(value).trim().toLowerCase();

export const getCurrentHostname = () => {
    if (typeof window === "undefined") {
        return "";
    }

    return normalizeHost(window.location.hostname);
};

export const detectShellMode = (hostname = getCurrentHostname()) => {
    const safeHostname = normalizeHost(hostname);

    if (APP_SELLER_HOSTS.includes(safeHostname)) {
        return "seller";
    }

    if (APP_ADMIN_HOSTS.includes(safeHostname)) {
        return "admin";
    }

    if (APP_CUSTOMER_HOSTS.includes(safeHostname)) {
        return "customer";
    }

    return "customer";
};

export const normalizeSellerPath = (pathname = "/") => {
    if (!pathname || pathname === "/") {
        return "/seller";
    }

    return pathname.startsWith("/seller") ? pathname : `/seller${pathname}`;
};
