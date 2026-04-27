import axios from "axios";
import {ACCOUNT_STATUS_URL, LOGIN_URL, LOGOUT_URL} from "../constants/UrlConstans";

const STORAGE_KEYS = {
    token: 'token',
    user: 'user'
};

const readJsonStorage = (key) => {
    try {
        const rawValue = localStorage.getItem(key);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
        return null;
    }
};

const decodeJwtPayload = (token) => {
    if (!token || typeof token !== 'string') {
        return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
        return null;
    }

    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        return JSON.parse(atob(normalized));
    } catch (error) {
        return null;
    }
};

const getCurrentUser = () => readJsonStorage(STORAGE_KEYS.user);

const getBearerToken = () => localStorage.getItem(STORAGE_KEYS.token);

const getTokenExpiry = () => {
    const payload = decodeJwtPayload(getBearerToken());
    return Number(payload?.exp || 0);
};

const isTokenExpired = () => {
    const token = getBearerToken();
    if (!token) {
        return true;
    }

    const expiry = getTokenExpiry();
    if (!expiry) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return expiry <= now + 5;
};

const hasValidSession = () => {
    const user = getCurrentUser();
    const token = getBearerToken();
    if (!user || !token) {
        return false;
    }
    return !isTokenExpired();
};

const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
};

const login = (username, password) => {
    const credentials = `${username}:${password}`;
    const base64EncodedCredentials = btoa(credentials);

    return axios.post(LOGIN_URL, {}, {
        headers: {
            'Authorization': `Basic ${base64EncodedCredentials}`
        }
    });
};

const lookupAccountStatus = (email) => {
    return axios.get(ACCOUNT_STATUS_URL, {
        params: {email}
    }).then((response) => {
        return response?.data?.returnData?.[0];
    });
};

const checkRole = (role) => {
    const userData = getCurrentUser();
    const roles = Array.isArray(userData?.roleList) ? userData.roleList : [];
    return roles.some((item) => item?.name === role);
};

const logout = (userId) => {
    const token = getBearerToken();
    return axios.post(LOGOUT_URL, {userId: userId}, {
        headers: {'Authorization': `Bearer ${token}`}
    });
};

export default {
    lookupAccountStatus,
    login,
    getCurrentUser,
    getBearerToken,
    getTokenExpiry,
    isTokenExpired,
    hasValidSession,
    clearSession,
    checkRole,
    logout
};
