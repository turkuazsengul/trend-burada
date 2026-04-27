import axios from "axios";
import ProductService from "../../../service/ProductService";
import {PRODUCT_LIST_URL, USE_STATIC_PRODUCT_DATA} from "../../../constants/UrlConstans";
import AuthService from "../../../service/AuthService";
import {getSellerProfile, getSellerProfiles, resolveSeedOwnerEmail} from '../data/sellerCatalogConfig';
import {normalizeColorOption, resolveColorHex, resolveColorLabel} from '../../../utils/colorOptions';

const LOCAL_PRODUCTS_KEY = "tb_seller_local_products";
const PRODUCT_OWNERSHIP_KEY = "tb_seller_product_ownership";
const PRODUCT_DETAIL_META_KEY = "tb_seller_product_detail_meta";

const toArray = (value) => Array.isArray(value) ? value : [];
const unwrapPayload = (response) => response?.data?.data || response?.data?.returnData || response?.data?.product || response?.data || null;
const buildAuthorizedConfig = () => {
    const token = AuthService.getBearerToken();
    return token ? {headers: {Authorization: `Bearer ${token}`}} : {};
};

const getCurrentUser = () => AuthService.getCurrentUser();
const getCurrentSellerProfile = () => getSellerProfile(getCurrentUser());
const currentUserHasAdminRole = () => {
    const roles = Array.isArray(getCurrentUser()?.roleList) ? getCurrentUser().roleList : [];
    return roles.some((role) => role?.name === 'ADMIN');
};

const readJsonStorage = (key, fallbackValue) => {
    try {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) {
            return fallbackValue;
        }
        const parsed = JSON.parse(rawValue);
        return parsed ?? fallbackValue;
    } catch (error) {
        return fallbackValue;
    }
};

const readLocalProducts = () => {
    const parsed = readJsonStorage(LOCAL_PRODUCTS_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
};

const writeLocalProducts = (items) => {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(toArray(items)));
};

const readOwnershipMap = () => {
    const parsed = readJsonStorage(PRODUCT_OWNERSHIP_KEY, {});
    return parsed && !Array.isArray(parsed) ? parsed : {};
};

const writeOwnershipMap = (value) => {
    localStorage.setItem(PRODUCT_OWNERSHIP_KEY, JSON.stringify(value || {}));
};

const readDetailMetaMap = () => {
    const parsed = readJsonStorage(PRODUCT_DETAIL_META_KEY, {});
    return parsed && !Array.isArray(parsed) ? parsed : {};
};

const writeDetailMetaMap = (value) => {
    localStorage.setItem(PRODUCT_DETAIL_META_KEY, JSON.stringify(value || {}));
};

const rememberProductOwner = (productCode, email) => {
    if (!productCode || !email) {
        return;
    }

    const ownershipMap = readOwnershipMap();
    ownershipMap[String(productCode)] = String(email || '').trim().toLowerCase();
    writeOwnershipMap(ownershipMap);
};

const splitLineValues = (value) => String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeAttributesInput = (value) => splitLineValues(value)
    .map((line) => {
        const [label, ...rest] = line.split(':');
        const safeLabel = String(label || '').trim();
        const safeValue = String(rest.join(':') || '').trim();
        if (!safeLabel || !safeValue) {
            return null;
        }
        return {label: safeLabel, value: safeValue};
    })
    .filter(Boolean);

const normalizeColorOptionsInput = (values, imageUrl, fallbackColor) => {
    const safeItems = toArray(values).map((item) => resolveColorHex(item)).filter(Boolean);
    const finalItems = safeItems.length > 0 ? safeItems : (fallbackColor ? [resolveColorHex(fallbackColor)] : []);
    return finalItems.map((item) => ({
        name: resolveColorLabel(item),
        hex: resolveColorHex(item),
        image: imageUrl || ''
    }));
};

const buildDetailMetaFromProduct = (product) => ({
    sizeOptions: toArray(product?.sizeOptions).length > 0 ? toArray(product?.sizeOptions) : (product?.size ? [product.size] : []),
    colorOptions: toArray(product?.colorOptions).length > 0
        ? toArray(product?.colorOptions).map((item) => normalizeColorOption(item, product?.imageUrl || product?.img || '')).filter(Boolean)
        : (product?.color ? [normalizeColorOption(product.color, product?.imageUrl || product?.img || '')].filter(Boolean) : []),
    highlights: toArray(product?.highlights),
    attributes: toArray(product?.attributes)
});

const buildDetailMetaFromForm = (form) => ({
    sizeOptions: toArray(form?.sizeOptions),
    colorOptions: normalizeColorOptionsInput(form?.colorOptions, form?.imageUrl, form?.color),
    highlights: splitLineValues(form?.highlightsText),
    attributes: normalizeAttributesInput(form?.attributesText)
});

const mergeProductWithDetailMeta = (product, detailMeta) => {
    if (!product) {
        return product;
    }

    return {
        ...product,
        sizeOptions: toArray(detailMeta?.sizeOptions).length > 0 ? detailMeta.sizeOptions : toArray(product.sizeOptions),
        colorOptions: toArray(detailMeta?.colorOptions).length > 0 ? detailMeta.colorOptions : toArray(product.colorOptions),
        highlights: toArray(detailMeta?.highlights).length > 0 ? detailMeta.highlights : toArray(product.highlights),
        attributes: toArray(detailMeta?.attributes).length > 0 ? detailMeta.attributes : toArray(product.attributes)
    };
};

const rememberProductDetailMeta = (productCode, detailMeta) => {
    if (!productCode) {
        return;
    }
    const detailMap = readDetailMetaMap();
    detailMap[String(productCode)] = detailMeta;
    writeDetailMetaMap(detailMap);
};

const normalizeFormPayload = (form, existingProduct = null) => {
    const safeCategory = String(form.category || "").trim();
    const safeTitle = String(form.title || "").trim();
    const safeBrand = String(form.brand || "").trim();
    const safeCode = String(form.productCode || `${safeCategory || 'urun'}-${Date.now()}`).trim();
    const detailMeta = buildDetailMetaFromForm(form);

    return {
        title: safeTitle,
        category: safeCategory,
        brand: safeBrand,
        imageUrl: String(form.imageUrl || "").trim(),
        oldPrice: Number(form.oldPrice || 0),
        discountRate: Number(form.discountRate || 0),
        rating: Number(existingProduct?.rating || 0),
        reviewCount: Number(existingProduct?.reviewCount || 0),
        color: String(detailMeta.colorOptions?.[0]?.name || form.color || "").trim(),
        size: String(form.size || detailMeta.sizeOptions?.[0] || "").trim(),
        freeCargo: Boolean(form.freeCargo),
        price: Number(form.price || 0),
        fastDelivery: Boolean(form.fastDelivery),
        sellerScore: Number(existingProduct?.sellerScore || 0),
        installmentText: String(form.installmentText || "Peşin fiyatına").trim(),
        productCode: safeCode,
        sizeOptions: detailMeta.sizeOptions,
        colorOptions: detailMeta.colorOptions,
        highlights: detailMeta.highlights,
        attributes: detailMeta.attributes
    };
};

export const buildSellerProductForm = (product) => ({
    title: product?.title || '',
    category: product?.category || '',
    brand: product?.brand || product?.mark || '',
    productCode: product?.productCode || product?.routeId || product?.id || '',
    imageUrl: product?.imageUrl || product?.img || '',
    price: String(product?.price ?? ''),
    oldPrice: String(product?.oldPrice ?? ''),
    discountRate: String(product?.discountRate ?? ''),
    color: product?.color || '',
    size: product?.size || '',
    installmentText: product?.installmentText || 'Peşin fiyatına',
    freeCargo: Boolean(product?.freeCargo ?? product?.isFreeCargo),
    fastDelivery: Boolean(product?.fastDelivery ?? product?.isFastDelivery),
    sizeOptions: toArray(product?.sizeOptions),
    colorOptions: toArray(product?.colorOptions).map((item) => resolveColorHex(item)).filter(Boolean),
    highlightsText: toArray(product?.highlights).join('\n'),
    attributesText: toArray(product?.attributes).map((item) => `${item?.label || ''}: ${item?.value || ''}`).filter(Boolean).join('\n')
});

const mapCreatedProduct = (payload) => {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    return {
        id: payload.id || payload.productCode,
        productCode: payload.productCode || payload.id,
        routeId: payload.productCode || payload.id,
        title: payload.title,
        mark: payload.mark || payload.brand,
        brand: payload.brand || payload.mark,
        category: payload.category,
        price: Number(payload.price || 0),
        oldPrice: Number(payload.oldPrice || payload.price || 0),
        discountRate: Number(payload.discountRate || 0),
        rating: Number(payload.rating || 0),
        reviewCount: Number(payload.reviewCount || 0),
        img: payload.img || payload.imageUrl,
        imageUrl: payload.imageUrl || payload.img,
        color: payload.color || "Standart",
        size: payload.size || "M",
        sizeOptions: toArray(payload.sizeOptions),
        colorOptions: toArray(payload.colorOptions),
        freeCargo: Boolean(payload.freeCargo ?? payload.isFreeCargo),
        isFreeCargo: Boolean(payload.freeCargo ?? payload.isFreeCargo),
        fastDelivery: Boolean(payload.fastDelivery ?? payload.isFastDelivery),
        isFastDelivery: Boolean(payload.fastDelivery ?? payload.isFastDelivery),
        sellerScore: Number(payload.sellerScore || 0),
        installmentText: payload.installmentText || "Peşin fiyatına",
        highlights: toArray(payload.highlights),
        attributes: toArray(payload.attributes)
    };
};

const withOwnershipMetadata = (items) => {
    const ownershipMap = readOwnershipMap();
    const detailMetaMap = readDetailMetaMap();
    return toArray(items).map((item) => {
        const productCode = String(item?.productCode || item?.routeId || item?.id || '');
        const detailMeta = detailMetaMap[productCode] || buildDetailMetaFromProduct(item);
        return mergeProductWithDetailMeta({
            ...item,
            ownerEmail: resolveSeedOwnerEmail(item, ownershipMap),
            ownerProductCode: productCode
        }, detailMeta);
    });
};

const filterProductsForCurrentSeller = (items) => {
    const enriched = withOwnershipMetadata(items);
    if (currentUserHasAdminRole()) {
        return enriched;
    }

    const sellerEmail = String(getCurrentUser()?.email || '').trim().toLowerCase();
    return enriched.filter((item) => String(item.ownerEmail || '').toLowerCase() === sellerEmail);
};

const getSellerProducts = async () => {
    const [catalogProducts, localProducts] = await Promise.all([
        ProductService.getAllProducts().catch(() => []),
        Promise.resolve(readLocalProducts())
    ]);

    return filterProductsForCurrentSeller([...toArray(localProducts), ...toArray(catalogProducts)]);
};

const createSellerProduct = async (form) => {
    const payload = normalizeFormPayload(form);
    const currentEmail = getCurrentUser()?.email;
    const detailMeta = buildDetailMetaFromForm(form);

    if (USE_STATIC_PRODUCT_DATA || !PRODUCT_LIST_URL) {
        const localProducts = readLocalProducts();
        const product = mergeProductWithDetailMeta(mapCreatedProduct({
            ...payload,
            id: payload.productCode,
            mark: payload.brand,
            img: payload.imageUrl,
            isFreeCargo: payload.freeCargo,
            isFastDelivery: payload.fastDelivery
        }), detailMeta);
        writeLocalProducts([product, ...localProducts]);
        rememberProductOwner(product?.productCode || product?.id, currentEmail);
        rememberProductDetailMeta(product?.productCode || product?.id, detailMeta);
        return product;
    }

    const response = await axios.post(PRODUCT_LIST_URL, payload, buildAuthorizedConfig());
    const created = mergeProductWithDetailMeta(mapCreatedProduct({
        ...unwrapPayload(response),
        sizeOptions: detailMeta.sizeOptions,
        colorOptions: detailMeta.colorOptions,
        highlights: detailMeta.highlights,
        attributes: detailMeta.attributes
    }), detailMeta);
    rememberProductOwner(created?.productCode || created?.id, currentEmail);
    rememberProductDetailMeta(created?.productCode || created?.id, detailMeta);
    return created;
};

const getSellerProductById = async (productId) => {
    const allProducts = await getSellerProducts();
    return allProducts.find((item) => String(item.productCode || item.routeId || item.id) === String(productId)) || null;
};

const updateSellerProduct = async (productId, form) => {
    const existingProduct = await getSellerProductById(productId);
    const payload = normalizeFormPayload(form, existingProduct);
    const currentEmail = getCurrentUser()?.email;
    const detailMeta = buildDetailMetaFromForm(form);

    if (USE_STATIC_PRODUCT_DATA || !PRODUCT_LIST_URL) {
        const localProducts = readLocalProducts();
        const nextProduct = mergeProductWithDetailMeta(mapCreatedProduct({
            ...existingProduct,
            ...payload,
            id: productId,
            productCode: payload.productCode || productId,
            mark: payload.brand,
            img: payload.imageUrl,
            isFreeCargo: payload.freeCargo,
            isFastDelivery: payload.fastDelivery
        }), detailMeta);
        const currentCode = String(productId);
        const nextItems = localProducts.map((item) => (
            String(item.productCode || item.routeId || item.id) === currentCode ? nextProduct : item
        ));
        writeLocalProducts(nextItems);
        rememberProductOwner(nextProduct?.productCode || nextProduct?.id || productId, currentEmail);
        rememberProductDetailMeta(nextProduct?.productCode || nextProduct?.id || productId, detailMeta);
        return nextProduct;
    }

    const response = await axios.put(`${PRODUCT_LIST_URL}/${encodeURIComponent(productId)}`, payload, buildAuthorizedConfig());
    const updated = mergeProductWithDetailMeta(mapCreatedProduct({
        ...existingProduct,
        ...unwrapPayload(response),
        sizeOptions: detailMeta.sizeOptions,
        colorOptions: detailMeta.colorOptions,
        highlights: detailMeta.highlights,
        attributes: detailMeta.attributes
    }), detailMeta);
    rememberProductOwner(updated?.productCode || updated?.id || productId, currentEmail);
    rememberProductDetailMeta(updated?.productCode || updated?.id || productId, detailMeta);
    return updated;
};

const deleteSellerProduct = async (productId) => {
    const ownershipMap = readOwnershipMap();
    delete ownershipMap[String(productId)];
    writeOwnershipMap(ownershipMap);

    const detailMetaMap = readDetailMetaMap();
    delete detailMetaMap[String(productId)];
    writeDetailMetaMap(detailMetaMap);

    if (USE_STATIC_PRODUCT_DATA || !PRODUCT_LIST_URL) {
        const localProducts = readLocalProducts();
        const nextItems = localProducts.filter((item) => String(item.productCode || item.routeId || item.id) !== String(productId));
        writeLocalProducts(nextItems);
        return true;
    }

    const response = await axios.delete(`${PRODUCT_LIST_URL}/${encodeURIComponent(productId)}`, buildAuthorizedConfig());
    return Boolean(unwrapPayload(response));
};

const getSellerWorkspaceSummary = () => ({
    profile: getCurrentSellerProfile(),
    profiles: getSellerProfiles()
});

export default {
    getSellerProducts,
    createSellerProduct,
    getSellerProductById,
    updateSellerProduct,
    deleteSellerProduct,
    buildSellerProductForm,
    getSellerWorkspaceSummary
};
