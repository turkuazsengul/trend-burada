import axios from "axios";
import {
    PRODUCT_DETAIL_URL,
    PRODUCT_FACETS_URL,
    PRODUCT_LIST_URL,
    USE_STATIC_PRODUCT_DATA
} from "../constants/UrlConstans";
import {getAllCategoryKeys, getCategoryMeta, getCategoryProducts} from "../data/demoProductData";
import {normalizeColorOption, resolveColorHex, resolveColorLabel} from "../utils/colorOptions";

const STATIC_TARGET_COUNT = 54;

const BRAND_POOL = [
    "Zara", "Mango", "Koton", "Ipekyol", "Mavi", "Stradivarius", "H&M", "LCW Vision", "Massimo"
];

const COLOR_POOL = [
    "Siyah", "Beyaz", "Bej", "Lacivert", "Haki", "Kırmızı", "Gri", "Mavi", "Krem", "Pembe"
];

const SIZE_POOL = ["XS", "S", "M", "L", "XL"];

const INSTALLMENT_POOL = ["Peşin fiyatına", "2 taksit", "3 taksit", "4 taksit", "6 taksit"];

const IMAGE_POOL = [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1800&q=90"
];

const TITLE_PREFIX = [
    "Premium", "Modern", "Minimal", "Zamansız", "Şık", "Günlük", "Klasik", "Rahat", "Trend", "Yumuşak Dokulu"
];

const FIT_POOL = ["Regular Fit", "Slim Fit", "Oversize", "Relaxed Fit"];
const FABRIC_POOL = ["Pamuk", "Pamuk - Elastan", "Viskon", "Keten Karışımlı", "Modal"];
const ORIGIN_POOL = ["Türkiye", "İtalya", "Portekiz", "İspanya"];
const DETAIL_SUFFIX_POOL = [
    "Günlük Kullanıma Uygun",
    "Yumuşak Dokulu Tasarım",
    "Modern ve Rahat Kesim",
    "Şehir Stiline Uyumlu",
    "Premium Görünümlü Duruş"
];

const unwrapList = (payload) => {
    const list = payload?.returnData || payload?.data || payload?.products || payload || [];
    return Array.isArray(list) ? list : [];
};

const unwrapPaged = (payload) => {
    const container = payload?.returnData || payload?.data || payload?.products || payload || {};
    const items = Array.isArray(container?.items)
        ? container.items
        : unwrapList(container);
    const normalizedSize = Number(container?.size || items.length || 0);

    return {
        items,
        totalElements: Number(container?.totalElements ?? items.length ?? 0),
        page: Number(container?.page || 0),
        size: normalizedSize,
        totalPages: Number(container?.totalPages || (normalizedSize > 0 ? Math.ceil(items.length / normalizedSize) : (items.length > 0 ? 1 : 0))),
        hasNext: Boolean(container?.hasNext)
    };
};

const unwrapItem = (payload) => payload?.returnData || payload?.data || payload?.product || payload || null;

const resolveProductDetailUrl = (productId) => {
    const baseUrl = PRODUCT_DETAIL_URL || PRODUCT_LIST_URL;
    if (!baseUrl || !productId) {
        return "";
    }
    return `${String(baseUrl).replace(/\/$/, "")}/${encodeURIComponent(productId)}`;
};

const normalizeStringList = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => typeof item === "string" ? item.trim() : "")
        .filter(Boolean);
};

const normalizeColorOptions = (items, fallbackImage = "") => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => normalizeColorOption(item, fallbackImage))
        .filter(Boolean);
};

const normalizeAttributes = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map((item) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        const label = item.label || item.key || item.name || "";
        const value = item.value || item.text || "";
        if (!label || !value) {
            return null;
        }

        return {label, value};
    }).filter(Boolean);
};

const normalizeProduct = (item) => {
    if (!item || typeof item !== "object") {
        return null;
    }

    const routeId = item.productCode || item.routeId || item.code || item.slug || item.id;
    const imageUrl = item.img || item.imageUrl || item.image || "";
    const sizeOptions = normalizeStringList(
        Array.isArray(item.sizeOptions) ? item.sizeOptions : item.sizes
    );
    const colorOptions = normalizeColorOptions(
        Array.isArray(item.colorOptions) ? item.colorOptions : item.colors,
        imageUrl
    );
    const attributes = normalizeAttributes(
        Array.isArray(item.attributes) ? item.attributes : item.specifications
    );

    return {
        id: item.id,
        productCode: item.productCode || routeId,
        routeId,
        title: item.title,
        mark: item.mark || item.brand || item.sellerName || "Marka",
        brand: item.brand || item.mark || item.sellerName || "Marka",
        category: item.category || "",
        price: Number(item.price || 0),
        oldPrice: Number(item.oldPrice || item.listPrice || item.price || 0),
        discountRate: Number(item.discountRate || item.discount || 0),
        rating: Number(item.rating || 0),
        reviewCount: Number(item.reviewCount || item.commentCount || 0),
        img: imageUrl,
        imageUrl,
        color: item.color || "Standart",
        size: item.size || "M",
        sizeOptions,
        colorOptions,
        freeCargo: Boolean(item.isFreeCargo ?? item.freeCargo),
        isFreeCargo: Boolean(item.isFreeCargo ?? item.freeCargo),
        fastDelivery: Boolean(item.isFastDelivery ?? item.fastDelivery),
        isFastDelivery: Boolean(item.isFastDelivery ?? item.fastDelivery),
        sellerScore: Number(item.sellerScore || 0),
        installmentText: item.installmentText || "Peşin fiyatına",
        highlights: normalizeStringList(
            Array.isArray(item.highlights) ? item.highlights : item.keyFeatures
        ),
        attributes
    };
};

const normalizeFacets = (raw) => {
    if (Array.isArray(raw)) {
        return raw;
    }

    if (!raw || typeof raw !== "object") {
        return [];
    }

    const entries = Object.entries(raw);
    return entries.map(([key, value]) => {
        if (!Array.isArray(value)) {
            return null;
        }

        return {
            key,
            title: key,
            options: value
        };
    }).filter(Boolean);
};

const getStaticProductsByCategory = (categoryKey) => {
    const categoryMeta = getCategoryMeta(categoryKey);
    const base = getCategoryProducts(categoryKey) || [];
    const coreWords = categoryMeta?.productWords || ["Koleksiyon"];
    const suffix = categoryMeta?.suffixLabel || "Ürün";
    const imagePool = Array.isArray(categoryMeta?.imagePool) && categoryMeta.imagePool.length > 0
        ? categoryMeta.imagePool
        : IMAGE_POOL;

    const products = [];

    for (let i = 0; i < STATIC_TARGET_COUNT; i += 1) {
        const seed = base[i % Math.max(base.length, 1)] || {};
        const mark = BRAND_POOL[(i + categoryKey.length) % BRAND_POOL.length];
        const color = COLOR_POOL[(i * 2 + categoryKey.length) % COLOR_POOL.length];
        const primaryColorHex = resolveColorHex(color);
        const size = SIZE_POOL[(i + 1) % SIZE_POOL.length];
        const sizeOptions = [
            SIZE_POOL[(i + 0) % SIZE_POOL.length],
            SIZE_POOL[(i + 1) % SIZE_POOL.length],
            SIZE_POOL[(i + 2) % SIZE_POOL.length],
            SIZE_POOL[(i + 3) % SIZE_POOL.length]
        ];
        const img = imagePool[(i + categoryKey.length) % imagePool.length] || seed.img;
        const colorOptions = [
            {
                name: resolveColorLabel(color),
                hex: primaryColorHex,
                image: img
            },
            {
                name: resolveColorLabel(COLOR_POOL[(i + 1 + categoryKey.length) % COLOR_POOL.length]),
                hex: resolveColorHex(COLOR_POOL[(i + 1 + categoryKey.length) % COLOR_POOL.length]),
                image: imagePool[(i + 2 + categoryKey.length) % imagePool.length]
            },
            {
                name: resolveColorLabel(COLOR_POOL[(i + 3 + categoryKey.length) % COLOR_POOL.length]),
                hex: resolveColorHex(COLOR_POOL[(i + 3 + categoryKey.length) % COLOR_POOL.length]),
                image: imagePool[(i + 4 + categoryKey.length) % imagePool.length]
            }
        ];
        const prefix = TITLE_PREFIX[(i + 3) % TITLE_PREFIX.length];
        const core = coreWords[i % coreWords.length];
        const fit = FIT_POOL[i % FIT_POOL.length];
        const fabric = FABRIC_POOL[i % FABRIC_POOL.length];
        const detailSuffix = DETAIL_SUFFIX_POOL[i % DETAIL_SUFFIX_POOL.length];
        const title = `${prefix} ${core} ${suffix} ${fit} ${fabric} ${detailSuffix}`;

        const basePrice = 650 + ((i % 12) * 130) + (categoryKey.length * 17);
        const oldPrice = basePrice + 220 + ((i % 5) * 90);
        const discountRate = Math.max(0, Math.round(((oldPrice - basePrice) / oldPrice) * 100));

        products.push({
            id: `${categoryKey}-${i + 1}`,
            productCode: `${categoryKey}-${i + 1}`,
            routeId: `${categoryKey}-${i + 1}`,
            title,
            mark,
            price: basePrice,
            oldPrice,
            discountRate,
            rating: 3 + ((i + 1) % 3),
            reviewCount: 35 + (i * 19),
            img,
            color,
            size,
            sizeOptions: Array.from(new Set(sizeOptions)),
            colorOptions,
            isFreeCargo: i % 2 === 0,
            isFastDelivery: i % 3 !== 0,
            sellerScore: Number((8.8 + ((i % 10) * 0.1)).toFixed(1)),
            installmentText: INSTALLMENT_POOL[i % INSTALLMENT_POOL.length],
            highlights: [
                "Nefes alan kumaş yapısı",
                "Gün boyu konfor sağlayan kesim",
                "Sezon kombinlerine uyumlu modern tasarım"
            ],
            attributes: [
                {label: "Kalıp", value: fit},
                {label: "Materyal", value: fabric},
                {label: "Renk", value: color},
                {label: "Beden", value: size},
                {label: "Menşei", value: ORIGIN_POOL[i % ORIGIN_POOL.length]}
            ]
        });
    }

    return products;
};

const resolveCategoryFromProductId = (routeId = '') => {
    if (!routeId) {
        return null;
    }

    const normalized = String(routeId).toLowerCase();
    const keys = getAllCategoryKeys().sort((a, b) => b.length - a.length);
    return keys.find((key) => normalized.startsWith(`${key}-`)) || null;
};

const findStaticProductById = (routeId) => {
    const preferredCategory = resolveCategoryFromProductId(routeId);

    if (preferredCategory) {
        const preferredProducts = getStaticProductsByCategory(preferredCategory);
        const preferred = preferredProducts.find((item) => String(item.routeId || item.productCode || item.id) === String(routeId));
        if (preferred) {
            return preferred;
        }
    }

    const allKeys = getAllCategoryKeys();
    for (let i = 0; i < allKeys.length; i += 1) {
        const key = allKeys[i];
        const list = getStaticProductsByCategory(key);
        const found = list.find((item) => String(item.routeId || item.productCode || item.id) === String(routeId));
        if (found) {
            return found;
        }
    }

    return null;
};

const getStaticFacetsByProducts = (products) => {
    const countBy = (key) => products.reduce((acc, item) => {
        const value = item[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    const mapOptions = (counts) => Object.keys(counts).map((value) => ({
        value,
        label: value,
        count: counts[value]
    }));

    const ratingOptions = [
        {value: '4.5+', label: '4.5 ve Üzeri', count: products.filter((p) => Number(p.rating || 0) >= 4.5).length},
        {value: '4.0+', label: '4.0 ve Üzeri', count: products.filter((p) => Number(p.rating || 0) >= 4.0).length},
        {value: '3.5+', label: '3.5 ve Üzeri', count: products.filter((p) => Number(p.rating || 0) >= 3.5).length}
    ];

    const sellerScoreOptions = [
        {value: '9.5+', label: '9.5 ve Üzeri', count: products.filter((p) => Number(p.sellerScore || 0) >= 9.5).length},
        {
            value: '9.0-9.4',
            label: '9.0 - 9.4',
            count: products.filter((p) => Number(p.sellerScore || 0) >= 9.0 && Number(p.sellerScore || 0) < 9.5).length
        },
        {
            value: '8.5-8.9',
            label: '8.5 - 8.9',
            count: products.filter((p) => Number(p.sellerScore || 0) >= 8.5 && Number(p.sellerScore || 0) < 9.0).length
        }
    ];

    const discountOptions = [
        {value: '10+', label: '%10 ve Üzeri', count: products.filter((p) => Number(p.discountRate || 0) >= 10).length},
        {value: '20+', label: '%20 ve Üzeri', count: products.filter((p) => Number(p.discountRate || 0) >= 20).length},
        {value: '30+', label: '%30 ve Üzeri', count: products.filter((p) => Number(p.discountRate || 0) >= 30).length}
    ];

    const installmentCounts = countBy(products, 'installmentText');

    return [
        {key: 'mark', title: 'Marka', options: mapOptions(countBy('mark'))},
        {key: 'size', title: 'Beden', options: mapOptions(countBy('size'))},
        {key: 'color', title: 'Renk', options: mapOptions(countBy('color'))},
        {
            key: 'priceRange',
            title: 'Fiyat',
            options: [
                {value: '0-999', label: '0 - 999 TL', count: products.filter((p) => p.price <= 999).length},
                {value: '1000-1999', label: '1.000 - 1.999 TL', count: products.filter((p) => p.price >= 1000 && p.price <= 1999).length},
                {value: '2000+', label: '2.000 TL ve üzeri', count: products.filter((p) => p.price >= 2000).length}
            ]
        },
        {key: 'rating', title: 'Değerlendirme', options: ratingOptions},
        {key: 'sellerScore', title: 'Satıcı Puanı', options: sellerScoreOptions},
        {key: 'discountRate', title: 'İndirim', options: discountOptions},
        {
            key: 'isFastDelivery',
            title: 'Teslimat',
            options: [{value: 'true', label: 'Hızlı Teslimat', count: products.filter((p) => Boolean(p.isFastDelivery)).length}]
        },
        {
            key: 'isFreeCargo',
            title: 'Kargo',
            options: [{value: 'true', label: 'Kargo Bedava', count: products.filter((p) => Boolean(p.isFreeCargo)).length}]
        },
        {key: 'installmentText', title: 'Ödeme Seçeneği', options: mapOptions(installmentCounts)}
    ];
};

const collectAllPages = async (fetchPage) => {
    const firstPage = await fetchPage(0);
    const items = Array.isArray(firstPage?.items) ? [...firstPage.items] : [];
    let nextPage = 1;
    let current = firstPage;

    while (current?.hasNext && nextPage < (current.totalPages || 0)) {
        current = await fetchPage(nextPage);
        items.push(...(Array.isArray(current?.items) ? current.items : []));
        if (!current?.hasNext) {
            break;
        }
        nextPage += 1;
    }

    return items;
};

const getProductsByCategory = (categoryKey) => {
    return collectAllPages((page) => getProductsPageByCategory(categoryKey, page, 60));
};

const getProductsPageByCategory = (categoryKey, page = 0, size = 24) => {
    if (USE_STATIC_PRODUCT_DATA || !PRODUCT_LIST_URL) {
        const items = getStaticProductsByCategory(categoryKey);
        const start = Math.max(page, 0) * Math.max(size, 1);
        const pagedItems = items.slice(start, start + size);
        return Promise.resolve({
            items: pagedItems,
            totalElements: items.length,
            page: Math.max(page, 0),
            size,
            totalPages: Math.ceil(items.length / Math.max(size, 1)),
            hasNext: start + size < items.length
        });
    }

    return axios.get(PRODUCT_LIST_URL, {params: {category: categoryKey, page, size}})
        .then((response) => {
            const paged = unwrapPaged(response?.data);
            return {
                ...paged,
                items: paged.items.map(normalizeProduct).filter(Boolean)
            };
        })
        .catch((error) => {
            console.log('error ' + error);
            const items = getStaticProductsByCategory(categoryKey);
            const start = Math.max(page, 0) * Math.max(size, 1);
            const pagedItems = items.slice(start, start + size);
            return {
                items: pagedItems,
                totalElements: items.length,
                page: Math.max(page, 0),
                size,
                totalPages: Math.ceil(items.length / Math.max(size, 1)),
                hasNext: start + size < items.length
            };
        });
};

const getFacetsByCategory = (categoryKey) => {
    if (USE_STATIC_PRODUCT_DATA || !PRODUCT_FACETS_URL) {
        return Promise.resolve(getStaticFacetsByProducts(getStaticProductsByCategory(categoryKey)));
    }

    return axios.get(PRODUCT_FACETS_URL, {params: {category: categoryKey}})
        .then((response) => {
            const payload = response?.data;
            const facets = payload?.returnData || payload?.data || payload?.facets || payload;
            const normalized = normalizeFacets(facets);
            return normalized.length > 0 ? normalized : getStaticFacetsByProducts(getStaticProductsByCategory(categoryKey));
        })
        .catch((error) => {
            console.log('error ' + error);
            return getStaticFacetsByProducts(getStaticProductsByCategory(categoryKey));
        });
};

const getAllProducts = () => {
    return collectAllPages((page) => getAllProductsPage(page, 60));
};

const getAllProductsPage = (page = 0, size = 24) => {
    if (USE_STATIC_PRODUCT_DATA || !PRODUCT_LIST_URL) {
        const allKeys = getAllCategoryKeys();
        const allProducts = allKeys.flatMap((key) => getStaticProductsByCategory(key));
        const start = Math.max(page, 0) * Math.max(size, 1);
        const items = allProducts.slice(start, start + size);
        return Promise.resolve({
            items,
            totalElements: allProducts.length,
            page: Math.max(page, 0),
            size,
            totalPages: Math.ceil(allProducts.length / Math.max(size, 1)),
            hasNext: start + size < allProducts.length
        });
    }

    return axios.get(PRODUCT_LIST_URL, {params: {page, size}})
        .then((response) => {
            const paged = unwrapPaged(response?.data);
            return {
                ...paged,
                items: paged.items.map(normalizeProduct).filter(Boolean)
            };
        })
        .catch((error) => {
            console.log('error ' + error);
            const allKeys = getAllCategoryKeys();
            const allProducts = allKeys.flatMap((key) => getStaticProductsByCategory(key));
            const start = Math.max(page, 0) * Math.max(size, 1);
            const items = allProducts.slice(start, start + size);
            return {
                items,
                totalElements: allProducts.length,
                page: Math.max(page, 0),
                size,
                totalPages: Math.ceil(allProducts.length / Math.max(size, 1)),
                hasNext: start + size < allProducts.length
            };
        });
};

const getFacetsByProducts = (products) => {
    const safeProducts = Array.isArray(products) ? products : [];
    return Promise.resolve(getStaticFacetsByProducts(safeProducts));
};

const getProductById = (routeId) => {
    if (!routeId) {
        return Promise.resolve(null);
    }

    const detailUrl = resolveProductDetailUrl(routeId);
    if (USE_STATIC_PRODUCT_DATA || !detailUrl) {
        return Promise.resolve(findStaticProductById(routeId));
    }

    return axios.get(detailUrl)
        .then((response) => {
            const normalized = normalizeProduct(unwrapItem(response?.data));
            if (normalized) {
                return normalized;
            }
            return findStaticProductById(routeId);
        })
        .catch((error) => {
            console.log('error ' + error);
            return findStaticProductById(routeId);
        });
};

const getRelatedProductsByProductId = (routeId, limit = 10) => {
    const categoryKey = resolveCategoryFromProductId(routeId) || 'elbise';
    return getProductsByCategory(categoryKey).then((products) => {
        const list = Array.isArray(products) ? products : [];
        return list.filter((item) => String(item.routeId || item.productCode || item.id) !== String(routeId)).slice(0, limit);
    });
};

export default {
    getProductsByCategory,
    getProductsPageByCategory,
    getFacetsByCategory,
    getAllProducts,
    getAllProductsPage,
    getFacetsByProducts,
    getProductById,
    getRelatedProductsByProductId
};
