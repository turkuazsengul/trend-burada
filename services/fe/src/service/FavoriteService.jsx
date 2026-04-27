import axios from "axios";
import {FAVORITE_LIST_URL, FAVORITE_TOGGLE_URL, USE_STATIC_FAVORITE_DATA} from "../constants/UrlConstans";

const FAVORITES_STORAGE_KEY = 'favoriteProducts';
const FAVORITES_UPDATED_EVENT = 'favorites-updated';

let favoriteCache = [];
let initialized = false;

const getUser = () => {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
};

const getUserId = () => {
    const user = getUser();
    return user?.id || user?.userId || user?.email || 'anonymous';
};

const getStorageKey = () => `${FAVORITES_STORAGE_KEY}:${getUserId()}`;

const readStorage = () => {
    try {
        const raw = localStorage.getItem(getStorageKey());
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const persistAndNotify = (favorites) => {
    favoriteCache = Array.isArray(favorites) ? favorites : [];
    localStorage.setItem(getStorageKey(), JSON.stringify(favoriteCache));
    initialized = true;
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
};

const normalizeFavoriteList = (payload) => {
    const list = payload?.returnData || payload?.data || payload?.favorites || payload || [];
    return Array.isArray(list) ? list : [];
};

const getFavorites = () => {
    if (!initialized) {
        favoriteCache = readStorage();
        initialized = true;
    }
    return favoriteCache;
};

const getFavoritesFromService = () => {
    if (!localStorage.getItem('token')) {
        persistAndNotify([]);
        return Promise.resolve([]);
    }

    if (USE_STATIC_FAVORITE_DATA || !FAVORITE_LIST_URL) {
        const staticFavorites = readStorage();
        persistAndNotify(staticFavorites);
        return Promise.resolve(staticFavorites);
    }

    return axios.get(FAVORITE_LIST_URL, {
        params: {userId: getUserId()}
    }).then((response) => {
        const favorites = normalizeFavoriteList(response?.data);
        persistAndNotify(favorites);
        return favorites;
    }).catch((error) => {
        console.log('error ' + error);
        const fallback = readStorage();
        persistAndNotify(fallback);
        return fallback;
    });
};

const initFavorites = () => {
    return getFavoritesFromService();
};

const isFavorite = (productId) => {
    if (!productId) {
        return false;
    }
    return getFavorites().some((item) => String(item.id) === String(productId));
};

const sendToggleToService = (product, favorite) => {
    if (USE_STATIC_FAVORITE_DATA || !FAVORITE_TOGGLE_URL) {
        return Promise.resolve(true);
    }

    return axios.post(FAVORITE_TOGGLE_URL, {
        userId: getUserId(),
        productId: product.id,
        favorite,
        product
    }).then(() => true).catch((error) => {
        console.log('error ' + error);
        return false;
    });
};

const toggleFavorite = async (product) => {
    if (!product || !product.id) {
        return false;
    }

    const current = getFavorites();
    const existingIndex = current.findIndex((item) => String(item.id) === String(product.id));
    const willBeFavorite = existingIndex < 0;
    const nextFavorites = [...current];

    if (willBeFavorite) {
        nextFavorites.unshift(product);
    } else {
        nextFavorites.splice(existingIndex, 1);
    }

    // Optimistic UI + local cache persistence.
    persistAndNotify(nextFavorites);
    await sendToggleToService(product, willBeFavorite);
    return willBeFavorite;
};

const getFavoriteRouteId = (product) => product?.routeId || product?.productCode || product?.id || '';

export {
    FAVORITES_UPDATED_EVENT,
    getFavoriteRouteId,
    getFavorites,
    getFavoritesFromService,
    initFavorites,
    isFavorite,
    toggleFavorite
};
