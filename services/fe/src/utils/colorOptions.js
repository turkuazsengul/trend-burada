export const COLOR_CATALOG = [
    {label: 'Siyah', value: 'Siyah', hex: '#141414'},
    {label: 'Beyaz', value: 'Beyaz', hex: '#F8F8F6'},
    {label: 'Ekru', value: 'Ekru', hex: '#F3EBDD'},
    {label: 'Gri', value: 'Gri', hex: '#98A2B3'},
    {label: 'Bej', value: 'Bej', hex: '#D9C2A0'},
    {label: 'Kahverengi', value: 'Kahverengi', hex: '#7B4B2A'},
    {label: 'Lacivert', value: 'Lacivert', hex: '#1E315B'},
    {label: 'Mavi', value: 'Mavi', hex: '#2E6BDE'},
    {label: 'Yesil', value: 'Yesil', hex: '#2E8B57'},
    {label: 'Mint', value: 'Mint', hex: '#8FD6C0'},
    {label: 'Sari', value: 'Sari', hex: '#F4C430'},
    {label: 'Turuncu', value: 'Turuncu', hex: '#F28C28'},
    {label: 'Kirmizi', value: 'Kirmizi', hex: '#D92D20'},
    {label: 'Bordo', value: 'Bordo', hex: '#7A1F3D'},
    {label: 'Pembe', value: 'Pembe', hex: '#F16D9A'},
    {label: 'Mor', value: 'Mor', hex: '#7C4DFF'}
];

const COLOR_ALIASES = {
    kirmizi: 'Kirmizi',
    'kırmızı': 'Kirmizi',
    yesil: 'Yesil',
    'yeşil': 'Yesil'
};

export const isHexColor = (value = '') => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

const normalizeCatalogKey = (value = '') => String(value || '').trim().toLowerCase();

export const resolveColorLabel = (value = '') => {
    if (typeof value === 'object' && value !== null) {
        return value.name || value.label || value.color || resolveColorLabel(value.hex || '');
    }

    const safeValue = String(value || '').trim();
    if (!safeValue) {
        return '';
    }

    if (isHexColor(safeValue)) {
        const matched = COLOR_CATALOG.find((item) => item.hex.toLowerCase() === safeValue.toLowerCase());
        return matched?.label || safeValue.toUpperCase();
    }

    const normalized = normalizeCatalogKey(safeValue);
    const alias = COLOR_ALIASES[normalized] || safeValue;
    const matched = COLOR_CATALOG.find((item) => normalizeCatalogKey(item.label) === normalizeCatalogKey(alias) || normalizeCatalogKey(item.value) === normalizeCatalogKey(alias));
    return matched?.label || safeValue;
};

export const resolveColorHex = (value = '') => {
    if (typeof value === 'object' && value !== null) {
        if (isHexColor(value.hex)) {
            return String(value.hex).toUpperCase();
        }
        return resolveColorHex(value.name || value.label || value.color || '');
    }

    const safeValue = String(value || '').trim();
    if (!safeValue) {
        return '#CBD5E1';
    }

    if (isHexColor(safeValue)) {
        return safeValue.toUpperCase();
    }

    const normalized = normalizeCatalogKey(safeValue);
    const alias = COLOR_ALIASES[normalized] || safeValue;
    const matched = COLOR_CATALOG.find((item) => normalizeCatalogKey(item.label) === normalizeCatalogKey(alias) || normalizeCatalogKey(item.value) === normalizeCatalogKey(alias));
    return matched?.hex || '#CBD5E1';
};

export const normalizeColorOption = (item, fallbackImage = '') => {
    if (!item) {
        return null;
    }

    if (typeof item === 'string') {
        const hex = resolveColorHex(item);
        return {
            name: resolveColorLabel(item),
            hex,
            image: fallbackImage
        };
    }

    if (typeof item !== 'object') {
        return null;
    }

    const hex = resolveColorHex(item.hex || item.code || item.value || item.name || item.label || item.color || '');
    const name = resolveColorLabel(item.name || item.label || item.color || item.hex || item.code || '');

    return {
        name,
        hex,
        image: item.image || item.img || item.imageUrl || fallbackImage
    };
};
