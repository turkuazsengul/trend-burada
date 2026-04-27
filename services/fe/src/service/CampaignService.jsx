import axios from "axios";
import {CAMPAIGN_ITEMS_URL} from "../constants/UrlConstans";

const mapCampaignItem = (item, index) => {
    if (!item) {
        return null;
    }

    if (typeof item === "string") {
        return {
            id: index + 1,
            value: item,
            description: "Yeni Sezon"
        };
    }

    const imageUrl = item.value || item.imageUrl || item.url || item.src || item.bannerUrl;

    if (!imageUrl) {
        return null;
    }

    return {
        id: item.id || index + 1,
        value: imageUrl,
        description: item.description || item.title || item.name || "Yeni Sezon"
    };
};

const getCampaignItems = () => {
    if (!CAMPAIGN_ITEMS_URL) {
        return Promise.resolve([]);
    }

    return axios.get(CAMPAIGN_ITEMS_URL)
        .then((response) => {
            const payload = response?.data;
            const rawList = payload?.returnData || payload?.data || payload || [];

            if (!Array.isArray(rawList)) {
                return [];
            }

            return rawList.map(mapCampaignItem).filter(Boolean);
        })
        .catch((error) => {
            console.log('error ' + error);
            return [];
        });
};

export default {
    getCampaignItems,
};
