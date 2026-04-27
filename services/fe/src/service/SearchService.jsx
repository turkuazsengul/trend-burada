import axios from "axios";
import ProductService from "./ProductService";
import {SEARCH_URL, USE_STATIC_SEARCH_DATA} from "../constants/UrlConstans";

const unwrapList = (payload) => {
    const list = payload?.returnData || payload?.data || payload?.products || payload?.results || [];
    return Array.isArray(list) ? list : [];
};

const normalizeProduct = (item) => {
    if (!item || typeof item !== "object") {
        return null;
    }

    return {
        id: item.id,
        title: item.title,
        mark: item.mark || item.brand || item.sellerName || "Marka",
        price: Number(item.price || 0),
        oldPrice: Number(item.oldPrice || item.listPrice || item.price || 0),
        discountRate: Number(item.discountRate || item.discount || 0),
        rating: Number(item.rating || 0),
        reviewCount: Number(item.reviewCount || item.commentCount || 0),
        img: item.img || item.imageUrl || item.image,
        color: item.color || "Standart",
        size: item.size || "M",
        sizeOptions: Array.isArray(item.sizeOptions) ? item.sizeOptions : [],
        colorOptions: Array.isArray(item.colorOptions) ? item.colorOptions : [],
        isFreeCargo: Boolean(item.isFreeCargo),
        isFastDelivery: Boolean(item.isFastDelivery),
        sellerScore: Number(item.sellerScore || 0),
        installmentText: item.installmentText || "Peşin fiyatına",
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        attributes: Array.isArray(item.attributes) ? item.attributes : []
    };
};

const normalizeSearchTerm = (value = "") => String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSearchText = (product = {}) => {
    const attributes = Array.isArray(product.attributes)
        ? product.attributes.map((item) => `${item?.label || ""} ${item?.value || ""}`).join(" ")
        : "";

    return normalizeSearchTerm([
        product.mark,
        product.title,
        product.color,
        product.size,
        product.installmentText,
        attributes
    ].filter(Boolean).join(" "));
};

const scoreProduct = (product, normalizedQuery) => {
    const haystack = buildSearchText(product);
    if (!haystack || !normalizedQuery) {
        return 0;
    }

    if (haystack === normalizedQuery) {
        return 120;
    }

    if (String(product.mark || "").toLowerCase() === normalizedQuery) {
        return 110;
    }

    if (haystack.startsWith(normalizedQuery)) {
        return 100;
    }

    if (String(product.title || "").toLowerCase().includes(normalizedQuery)) {
        return 80;
    }

    if (String(product.mark || "").toLowerCase().includes(normalizedQuery)) {
        return 70;
    }

    if (haystack.includes(normalizedQuery)) {
        return 60;
    }

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);
    const matchedTokenCount = queryTokens.filter((token) => haystack.includes(token)).length;
    return matchedTokenCount > 0 ? (matchedTokenCount * 12) : 0;
};

const searchStaticProducts = (query) => {
    const normalizedQuery = normalizeSearchTerm(query);
    if (!normalizedQuery) {
        return Promise.resolve([]);
    }

    return ProductService.getAllProducts().then((products) => {
        const safeProducts = Array.isArray(products) ? products : [];
        return safeProducts
            .map((product) => ({
                product,
                score: scoreProduct(product, normalizedQuery)
            }))
            .filter((item) => item.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return Number(b.product.reviewCount || 0) - Number(a.product.reviewCount || 0);
            })
            .map((item) => item.product);
    });
};

const searchProducts = (query) => {
    const normalizedQuery = normalizeSearchTerm(query);
    if (!normalizedQuery) {
        return Promise.resolve([]);
    }

    if (USE_STATIC_SEARCH_DATA || !SEARCH_URL) {
        return searchStaticProducts(normalizedQuery);
    }

    return axios.get(SEARCH_URL, {params: {q: normalizedQuery}})
        .then((response) => unwrapList(response?.data).map(normalizeProduct).filter(Boolean))
        .catch(() => searchStaticProducts(normalizedQuery));
};

export default {
    searchProducts
};
