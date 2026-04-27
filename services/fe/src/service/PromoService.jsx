import axios from "axios";
import {PROMO_IMAGES_URL} from "../constants/UrlConstans";

const mapUrl = (item) => {
    if (typeof item === "string") {
        return item;
    }

    if (item && typeof item === "object") {
        return item.imageUrl || item.url || item.src || item.bannerUrl || null;
    }

    return null;
};

const getPromoImages = () => {
    if (!PROMO_IMAGES_URL) {
        return Promise.resolve([]);
    }

    return axios.get(PROMO_IMAGES_URL)
        .then((response) => {
            const payload = response?.data;
            const rawList = payload?.returnData || payload?.data || payload || [];

            if (!Array.isArray(rawList)) {
                return [];
            }

            return rawList.map(mapUrl).filter(Boolean);
        })
        .catch((error) => {
            console.log('error ' + error);
            return [];
        });
};

export default {
    getPromoImages,
};
