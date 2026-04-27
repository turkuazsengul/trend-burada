const CATEGORY_TREE = [
    {
        label: 'Kadin',
        value: 'kadin',
        children: [
            {label: 'Elbise', value: 'elbise'},
            {label: 'Tisort', value: 'tisort'},
            {label: 'Gomlek', value: 'gomlek'},
            {label: 'Pantolon', value: 'pantolon'},
            {label: 'Ceket', value: 'ceket'},
            {label: 'Triko', value: 'triko'}
        ]
    },
    {
        label: 'Erkek',
        value: 'erkek',
        children: [
            {label: 'Tisort', value: 'erkek-tisort'},
            {label: 'Gomlek', value: 'erkek-gomlek'},
            {label: 'Jean', value: 'jean'},
            {label: 'Pantolon', value: 'erkek-pantolon'},
            {label: 'Sweatshirt', value: 'sweatshirt'},
            {label: 'Mont', value: 'mont'}
        ]
    },
    {
        label: 'Cocuk',
        value: 'cocuk',
        children: [
            {label: 'Kiz Cocuk', value: 'kiz-cocuk'},
            {label: 'Erkek Cocuk', value: 'erkek-cocuk'},
            {label: 'Bebek Giyim', value: 'bebek-giyim'},
            {label: 'Okul Kombinleri', value: 'okul-kombinleri'}
        ]
    },
    {
        label: 'Ayakkabi ve Aksesuar',
        value: 'aksesuar',
        children: [
            {label: 'Sneaker', value: 'sneaker'},
            {label: 'Bot', value: 'bot'},
            {label: 'Topuklu Ayakkabi', value: 'topuklu-ayakkabi'},
            {label: 'Loafer', value: 'loafer'},
            {label: 'Sandalet', value: 'sandalet'},
            {label: 'Canta', value: 'canta'},
            {label: 'Kemer', value: 'kemer'},
            {label: 'Cuzdan', value: 'cuzdan'},
            {label: 'Taki', value: 'taki'},
            {label: 'Sapka', value: 'sapka'}
        ]
    },
    {
        label: 'Spor',
        value: 'spor',
        children: [
            {label: 'Esofman', value: 'esofman'},
            {label: 'Tayt', value: 'tayt'},
            {label: 'Spor Sutyeni', value: 'spor-sutyeni'},
            {label: 'Hoodie', value: 'hoodie'},
            {label: 'Kosu Urunleri', value: 'kosu-urunleri'}
        ]
    }
];

const SELLER_PROFILES = [
    {
        email: 'seller@trendburada.local',
        storeName: 'Studio Moda',
        panelLabel: 'Studio Moda Store',
        allowedBrands: ['Zara', 'Mango', 'Ipekyol', 'Stradivarius'],
        managedCategories: ['elbise', 'tisort', 'gomlek', 'pantolon', 'ceket', 'triko'],
        notes: 'Kadin moda kategorileri bu magazanin yonetim alaninda yer alir.',
        provisionedInBackend: true
    },
    {
        email: 'menswear@trendburada.local',
        storeName: 'Northline Menswear',
        panelLabel: 'Northline Store',
        allowedBrands: ['Mavi', 'Massimo', 'LCW Vision'],
        managedCategories: ['erkek-tisort', 'erkek-gomlek', 'jean', 'erkek-pantolon', 'sweatshirt', 'mont'],
        notes: 'Erkek moda kategorilerini yonetecek magaza hesabi olarak planlandi.',
        provisionedInBackend: false
    },
    {
        email: 'family.active@trendburada.local',
        storeName: 'Family Active Hub',
        panelLabel: 'Family Active Store',
        allowedBrands: ['Koton', 'H&M', 'Mango'],
        managedCategories: ['kiz-cocuk', 'erkek-cocuk', 'bebek-giyim', 'okul-kombinleri', 'sneaker', 'bot', 'topuklu-ayakkabi', 'loafer', 'sandalet', 'canta', 'kemer', 'cuzdan', 'taki', 'sapka', 'esofman', 'tayt', 'spor-sutyeni', 'hoodie', 'kosu-urunleri'],
        notes: 'Cocuk, spor ve aksesuar kategorilerini yonetecek magaza hesabi olarak planlandi.',
        provisionedInBackend: false
    }
];

const DEFAULT_SELLER_PROFILE = SELLER_PROFILES[0];

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeCategory = (value) => String(value || '').trim().toLowerCase();

const findNodeByPath = (path = []) => {
    let nodes = CATEGORY_TREE;
    let matchedNode = null;

    for (const rawValue of path) {
        const value = String(rawValue || '');
        matchedNode = nodes.find((node) => node.value === value) || null;
        if (!matchedNode) {
            return null;
        }
        nodes = Array.isArray(matchedNode.children) ? matchedNode.children : [];
    }

    return matchedNode;
};

const walkTreeForValue = (nodes, targetValue, parentPath = []) => {
    for (const node of nodes) {
        const nextPath = [...parentPath, node.value];
        if (node.value === targetValue) {
            return nextPath;
        }
        if (Array.isArray(node.children) && node.children.length > 0) {
            const matchedPath = walkTreeForValue(node.children, targetValue, nextPath);
            if (matchedPath) {
                return matchedPath;
            }
        }
    }
    return [];
};

export const getSellerProfiles = () => SELLER_PROFILES;

export const getSellerProfile = (userOrEmail) => {
    const email = typeof userOrEmail === 'string'
        ? normalizeEmail(userOrEmail)
        : normalizeEmail(userOrEmail?.email);

    return SELLER_PROFILES.find((profile) => normalizeEmail(profile.email) === email) || DEFAULT_SELLER_PROFILE;
};

export const getBrandOptionsForSeller = (userOrEmail) => {
    const profile = getSellerProfile(userOrEmail);
    return (profile.allowedBrands || []).map((brand) => ({label: brand, value: brand}));
};

export const getCategoryLevelOptions = (path = []) => {
    if (!path.length) {
        return CATEGORY_TREE.map((node) => ({label: node.label, value: node.value}));
    }

    const parentNode = findNodeByPath(path);
    if (!parentNode || !Array.isArray(parentNode.children)) {
        return [];
    }

    return parentNode.children.map((node) => ({label: node.label, value: node.value}));
};

export const findCategoryPathByValue = (value) => {
    const normalizedValue = normalizeCategory(value);
    if (!normalizedValue) {
        return [];
    }
    return walkTreeForValue(CATEGORY_TREE, normalizedValue);
};

export const getCategoryValueFromPath = (path = []) => {
    const sanitized = path.filter(Boolean);
    return sanitized.length ? sanitized[sanitized.length - 1] : '';
};

export const getCategoryLabelPath = (path = []) => {
    const labels = [];
    let nodes = CATEGORY_TREE;

    for (const value of path.filter(Boolean)) {
        const matchedNode = nodes.find((node) => node.value === value);
        if (!matchedNode) {
            break;
        }
        labels.push(matchedNode.label);
        nodes = Array.isArray(matchedNode.children) ? matchedNode.children : [];
    }

    return labels;
};

export const getCategoryPathPreview = (path = []) => getCategoryLabelPath(path).join(' / ');

export const resolveSeedOwnerEmail = (product, ownershipMap = {}) => {
    const productCode = String(product?.productCode || product?.routeId || product?.id || '');
    const mappedOwner = normalizeEmail(ownershipMap[productCode]);
    if (mappedOwner) {
        return mappedOwner;
    }

    const category = normalizeCategory(product?.category);
    const profile = SELLER_PROFILES.find((item) => item.managedCategories.includes(category));
    return normalizeEmail(profile?.email || DEFAULT_SELLER_PROFILE.email);
};

export const categoryPathLooksComplete = (path = []) => {
    const sanitized = path.filter(Boolean);
    if (!sanitized.length) {
        return false;
    }

    const node = findNodeByPath(sanitized);
    return !node || !Array.isArray(node.children) || node.children.length === 0;
};
