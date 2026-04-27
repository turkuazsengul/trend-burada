export const CART_UPDATED_EVENT = 'cart:updated';
const CART_STORAGE_KEY = 'tb_cart_items_v1';

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const readCart = () => {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const writeCart = (items) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, {detail: {items}}));
};

const buildLineId = ({id, size = '', color = ''}) => `${id}__${String(size)}__${String(color)}`;

const normalizeCartItem = ({product, quantity, selectedSize, selectedColor}) => {
    const safeQty = Math.max(1, toNumber(quantity, 1));
    const size = selectedSize || product?.size || '';
    const color = selectedColor || product?.color || '';

    return {
        lineId: buildLineId({id: product?.id, size, color}),
        id: product?.id,
        title: product?.title,
        mark: product?.mark,
        img: product?.img,
        price: toNumber(product?.price, 0),
        oldPrice: toNumber(product?.oldPrice, toNumber(product?.price, 0)),
        quantity: safeQty,
        selectedSize: size,
        selectedColor: color,
        sellerScore: toNumber(product?.sellerScore, 0),
        isFreeCargo: Boolean(product?.isFreeCargo),
        isFastDelivery: Boolean(product?.isFastDelivery)
    };
};

const getCartItems = () => readCart();

const getCartCount = () => {
    return readCart().reduce((acc, item) => acc + Math.max(1, toNumber(item.quantity, 1)), 0);
};

const getCartSummary = () => {
    const items = readCart();
    const subtotal = items.reduce((acc, item) => acc + (toNumber(item.price, 0) * Math.max(1, toNumber(item.quantity, 1))), 0);
    const cargo = subtotal >= 350 ? 0 : 39.9;
    const discount = subtotal > 2500 ? Math.round(subtotal * 0.05) : 0;
    const total = Math.max(0, subtotal + cargo - discount);

    return {
        subtotal,
        cargo,
        discount,
        total
    };
};

const addToCart = ({product, quantity = 1, selectedSize = '', selectedColor = ''}) => {
    if (!product?.id) {
        return;
    }

    const items = readCart();
    const normalized = normalizeCartItem({product, quantity, selectedSize, selectedColor});
    const existingIndex = items.findIndex((item) => item.lineId === normalized.lineId);

    if (existingIndex >= 0) {
        items[existingIndex] = {
            ...items[existingIndex],
            quantity: Math.max(1, toNumber(items[existingIndex].quantity, 1)) + normalized.quantity
        };
    } else {
        items.push(normalized);
    }

    writeCart(items);
};

const updateCartItemQuantity = (lineId, quantity) => {
    const items = readCart();
    const nextQty = Math.max(1, toNumber(quantity, 1));
    const next = items.map((item) => item.lineId === lineId ? {...item, quantity: nextQty} : item);
    writeCart(next);
};

const removeCartItem = (lineId) => {
    const items = readCart().filter((item) => item.lineId !== lineId);
    writeCart(items);
};

const clearCart = () => {
    writeCart([]);
};

export default {
    getCartItems,
    getCartCount,
    getCartSummary,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
};
