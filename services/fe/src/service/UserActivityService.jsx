const VIEWED_KEY_PREFIX = 'tb_viewed_products_';
const ORDERS_KEY_PREFIX = 'tb_orders_';

const resolveUserId = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) {
            return 'guest';
        }
        const parsed = JSON.parse(raw);
        return parsed?.pkId || parsed?.id || 'guest';
    } catch (e) {
        return 'guest';
    }
};

const readList = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
};

const writeList = (key, list) => {
    localStorage.setItem(key, JSON.stringify(list));
};

const getViewedProducts = () => {
    const userId = resolveUserId();
    return readList(`${VIEWED_KEY_PREFIX}${userId}`);
};

const addViewedProduct = (product) => {
    if (!product?.id) {
        return;
    }

    const userId = resolveUserId();
    const key = `${VIEWED_KEY_PREFIX}${userId}`;
    const current = readList(key);
    const filtered = current.filter((item) => String(item.id) !== String(product.id));

    const next = [
        {
            id: product.id,
            productCode: product.productCode || product.routeId || product.id,
            routeId: product.routeId || product.productCode || product.id,
            title: product.title,
            mark: product.mark,
            img: product.img,
            price: product.price,
            viewedAt: new Date().toISOString()
        },
        ...filtered
    ].slice(0, 60);

    writeList(key, next);
};

const getOrders = () => {
    const userId = resolveUserId();
    return readList(`${ORDERS_KEY_PREFIX}${userId}`);
};

const addOrder = (order) => {
    const userId = resolveUserId();
    const key = `${ORDERS_KEY_PREFIX}${userId}`;
    const current = readList(key);
    const next = [
        {
            id: `ord-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...order
        },
        ...current
    ];
    writeList(key, next);
};

export default {
    getViewedProducts,
    addViewedProduct,
    getOrders,
    addOrder
};
