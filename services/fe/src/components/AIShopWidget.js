import React, {useContext, useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import AppContext from '../AppContext';
import ProductService from '../service/ProductService';

const AI_SHOP_PROMO_KEY = 'tb_ai_shop_promo_seen_v1';
const AI_SHOP_BODY_KEY = 'tb_ai_shop_body_profile_v1';
const AI_SHOP_COMBOS_KEY = 'tb_ai_shop_combos_v1';

const USAGE_KEYWORDS = {
    gunluk: ['basic', 'oversize', 'günlük', 'rahat', 't-shirt', 'tişört', 'jean', 'chino'],
    ofis: ['oxford', 'poplin', 'gömlek', 'pantolon', 'blazer', 'klasik', 'kumaş'],
    davet: ['saten', 'midi', 'maxi', 'elbise', 'topuklu', 'takı', 'şık'],
    spor: ['eşofman', 'tayt', 'spor', 'koşu', 'hoodie', 'sweatshirt'],
    seyahat: ['rahat', 'oversize', 'modal', 'keten', 'sneaker', 'çanta']
};

const STYLE_KEYWORDS = {
    minimal: ['minimal', 'basic', 'zamansız', 'regular fit'],
    premium: ['premium', 'şık', 'yumuşak dokulu', 'modern'],
    street: ['oversize', 'hoodie', 'jogger', 'sneaker', 'baskılı'],
    klasik: ['oxford', 'klasik', 'gömlek', 'blazer', 'kumaş'],
    romantik: ['elbise', 'saten', 'drapeli', 'midi', 'pembe']
};

const COMBO_RECIPES = {
    kadin: {
        gunluk: [['tisort', 'triko'], ['pantolon'], ['ceket'], ['sneaker'], ['canta']],
        ofis: [['gomlek', 'triko'], ['pantolon'], ['ceket'], ['loafer', 'topuklu-ayakkabi'], ['canta']],
        davet: [['elbise'], ['ceket'], ['topuklu-ayakkabi', 'sandalet'], ['taki', 'canta']],
        spor: [['spor-sutyeni', 'tisort'], ['tayt', 'esofman'], ['hoodie'], ['sneaker'], ['canta']],
        seyahat: [['gomlek', 'tisort', 'triko'], ['pantolon'], ['ceket'], ['sneaker'], ['canta']]
    },
    erkek: {
        gunluk: [['erkek-tisort', 'sweatshirt'], ['jean'], ['mont'], ['sneaker'], ['kemer']],
        ofis: [['erkek-gomlek'], ['erkek-pantolon'], ['mont'], ['loafer'], ['kemer']],
        davet: [['erkek-gomlek'], ['erkek-pantolon'], ['mont'], ['loafer'], ['kemer']],
        spor: [['erkek-tisort', 'hoodie'], ['esofman'], ['mont'], ['sneaker'], ['canta']],
        seyahat: [['erkek-tisort', 'sweatshirt'], ['jean', 'erkek-pantolon'], ['mont'], ['sneaker'], ['canta']]
    },
    cocuk: {
        gunluk: [['kiz-cocuk', 'erkek-cocuk', 'bebek-giyim'], ['okul-kombinleri'], ['sneaker'], ['canta']],
        ofis: [['okul-kombinleri'], ['sneaker'], ['canta']],
        davet: [['kiz-cocuk', 'erkek-cocuk'], ['sandalet', 'sneaker'], ['taki', 'sapka']],
        spor: [['erkek-cocuk', 'kiz-cocuk'], ['sneaker'], ['sapka']],
        seyahat: [['bebek-giyim', 'okul-kombinleri'], ['sneaker'], ['canta']]
    },
    ayakkabi: {
        gunluk: [['sneaker'], ['pantolon', 'jean'], ['tisort', 'erkek-tisort'], ['canta']],
        ofis: [['loafer', 'topuklu-ayakkabi'], ['pantolon', 'erkek-pantolon'], ['gomlek', 'erkek-gomlek'], ['canta', 'kemer']],
        davet: [['topuklu-ayakkabi', 'sandalet'], ['elbise'], ['taki', 'canta']],
        spor: [['sneaker'], ['tayt', 'esofman'], ['hoodie', 'tisort'], ['canta']],
        seyahat: [['sneaker'], ['pantolon', 'jean'], ['gomlek', 'erkek-tisort'], ['canta']]
    },
    aksesuar: {
        gunluk: [['canta', 'sapka'], ['tisort', 'erkek-tisort'], ['pantolon', 'jean'], ['sneaker']],
        ofis: [['canta', 'kemer'], ['gomlek', 'erkek-gomlek'], ['pantolon', 'erkek-pantolon'], ['loafer']],
        davet: [['taki', 'canta'], ['elbise'], ['topuklu-ayakkabi']],
        spor: [['sapka', 'canta'], ['esofman', 'tayt'], ['sneaker']],
        seyahat: [['canta', 'sapka'], ['gomlek', 'erkek-tisort'], ['pantolon'], ['sneaker']]
    },
    spor: {
        gunluk: [['hoodie', 'sweatshirt'], ['tayt', 'esofman'], ['sneaker'], ['canta']],
        ofis: [['sweatshirt'], ['erkek-pantolon'], ['sneaker'], ['canta']],
        davet: [['hoodie'], ['tayt'], ['sneaker']],
        spor: [['spor-sutyeni', 'hoodie'], ['tayt', 'esofman'], ['sneaker'], ['canta']],
        seyahat: [['hoodie', 'sweatshirt'], ['esofman'], ['sneaker'], ['canta']]
    }
};

const BODY_DEFAULTS = {
    height: '',
    weight: '',
    gender: 'kadin',
    topSize: 'M',
    bottomSize: '38',
    trouserLength: '',
    waist: '',
    budget: ''
};

const GENDER_OPTIONS = [
    {value: 'kadin', label: 'Kadın'},
    {value: 'erkek', label: 'Erkek'},
    {value: 'cocuk', label: 'Çocuk'}
];

const TOP_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'].map((value) => ({value, label: value}));

const CATEGORY_OPTIONS = [
    {value: 'kadin', label: 'Kadın'},
    {value: 'erkek', label: 'Erkek'},
    {value: 'cocuk', label: 'Çocuk'},
    {value: 'ayakkabi', label: 'Ayakkabı'},
    {value: 'aksesuar', label: 'Aksesuar'},
    {value: 'spor', label: 'Spor'}
];

const USAGE_OPTIONS = [
    {value: 'gunluk', label: 'Günlük'},
    {value: 'ofis', label: 'Ofis'},
    {value: 'davet', label: 'Davet'},
    {value: 'spor', label: 'Spor'},
    {value: 'seyahat', label: 'Seyahat'}
];

const STYLE_OPTIONS = [
    {value: 'minimal', label: 'Minimal'},
    {value: 'premium', label: 'Premium'},
    {value: 'street', label: 'Street'},
    {value: 'klasik', label: 'Klasik'},
    {value: 'romantik', label: 'Romantik'}
];

const readBodyProfile = () => {
    try {
        const raw = localStorage.getItem(AI_SHOP_BODY_KEY);
        if (!raw) return BODY_DEFAULTS;
        return {...BODY_DEFAULTS, ...JSON.parse(raw)};
    } catch (e) {
        return BODY_DEFAULTS;
    }
};

const writeBodyProfile = (profile) => {
    localStorage.setItem(AI_SHOP_BODY_KEY, JSON.stringify(profile));
};

const readSavedCombos = () => {
    try {
        const raw = sessionStorage.getItem(AI_SHOP_COMBOS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    }
};

const persistCombo = (combo) => {
    const current = readSavedCombos();
    current[combo.id] = combo;
    sessionStorage.setItem(AI_SHOP_COMBOS_KEY, JSON.stringify(current));
};

const AIShopSelect = ({
    id,
    label,
    value,
    options,
    onChange,
    isOpen,
    onToggle,
    onClose
}) => {
    const listboxId = `ai-shop-select-${id}-listbox`;
    const activeOption = options.find((option) => option.value === value) || options[0];

    return (
        <label className={`ai-shop-select-field ${isOpen ? 'is-open' : ''}`}>
            <span>{label}</span>
            <button
                type="button"
                className="ai-shop-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                onClick={() => onToggle(id)}
            >
                <strong>{activeOption?.label || ''}</strong>
                <i className="pi pi-angle-down ai-shop-select-chevron" aria-hidden="true" />
            </button>
            {isOpen && (
                <div className="ai-shop-select-menu" id={listboxId} role="listbox" aria-label={label}>
                    {options.map((option) => {
                        const selected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                className={`ai-shop-select-option ${selected ? 'is-selected' : ''}`}
                                onClick={() => {
                                    onChange(option.value);
                                    onClose();
                                }}
                            >
                                <span>{option.label}</span>
                                {selected && <i className="pi pi-check" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </label>
    );
};

const AIShopWidget = () => {
    const history = useHistory();
    const location = useLocation();
    const appContext = useContext(AppContext);
    const t = appContext?.t || ((key) => key);
    const isMobile = Boolean(appContext?.isMobile);
    const pathname = location?.pathname || '';
    const isHomeRoute = pathname === '/';
    const safeText = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    const [isOpen, setIsOpen] = useState(false);
    const [showPromo, setShowPromo] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [bodyProfile, setBodyProfile] = useState(BODY_DEFAULTS);
    const [openSelectId, setOpenSelectId] = useState('');
    const [form, setForm] = useState({
        profile: '',
        category: 'kadin',
        usage: 'gunluk',
        style: 'minimal',
        color: 'Siyah',
        fabric: 'Pamuk',
        note: ''
    });

    useEffect(() => {
        setBodyProfile(readBodyProfile());
    }, []);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (!event.target.closest('.ai-shop-select-field')) {
                setOpenSelectId('');
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpenSelectId('');
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        ProductService.getAllProducts()
            .then((items) => {
                if (!mounted) return;
                setAllProducts(Array.isArray(items) ? items : []);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!isHomeRoute) {
            setShowPromo(false);
        }
        const params = new URLSearchParams(location.search);
        const shouldOpenAIShop = params.get('aiShop') === '1';
        if (shouldOpenAIShop) {
            setIsOpen(true);
            setShowPromo(false);
            sessionStorage.setItem(AI_SHOP_PROMO_KEY, '1');
            setBodyProfile(readBodyProfile());
            return;
        }
        if (isHomeRoute) {
            const seen = sessionStorage.getItem(AI_SHOP_PROMO_KEY);
            if (!seen) {
                setShowPromo(true);
            }
        }
    }, [isHomeRoute, location.search]);

    useEffect(() => {
        if (pathname.startsWith('/ai-shop/kombin/')) {
            setIsOpen(false);
            setOpenSelectId('');
            setShowPromo(false);
        }
    }, [pathname]);

    const openAIShop = () => {
        setIsOpen(true);
        setShowPromo(false);
        sessionStorage.setItem(AI_SHOP_PROMO_KEY, '1');
        setBodyProfile(readBodyProfile());
    };

    const closeAIShop = () => {
        setIsOpen(false);
        setOpenSelectId('');
    };

    const openComboDetail = (comboId) => {
        closeAIShop();
        history.push(`/ai-shop/kombin/${comboId}`);
    };

    const updateField = (field, value) => setForm((prev) => ({...prev, [field]: value}));
    const updateBodyProfile = (field, value) => setBodyProfile((prev) => ({...prev, [field]: value}));
    const saveBodyProfile = () => writeBodyProfile(bodyProfile);

    let routeClassName = 'is-desktop';
    if (isMobile) {
        routeClassName = 'is-mobile-default';
        if (pathname.startsWith('/sepetim')) routeClassName = 'has-bottom-cart-bar';
        else if (pathname.startsWith('/detail/')) routeClassName = 'has-bottom-product-bar';
    }

    const buildSearchText = (product) => {
        const attrs = Array.isArray(product?.attributes) ? product.attributes.map((item) => `${item.label} ${item.value}`).join(' ') : '';
        const colors = Array.isArray(product?.colorOptions) ? product.colorOptions.map((item) => item.name).join(' ') : '';
        return `${product?.title || ''} ${product?.mark || ''} ${product?.color || ''} ${attrs} ${colors}`.toLocaleLowerCase('tr-TR');
    };

    const scoreProduct = (product, preferredIds = []) => {
        let score = 0;
        const text = buildSearchText(product);
        const budget = Number(bodyProfile?.budget || 0) || Number(form.budget || 0) || 0;
        const categoryHit = preferredIds.some((key) => String(product?.id || '').startsWith(`${key}-`));
        if (categoryHit) score += 50;
        (USAGE_KEYWORDS[form.usage] || []).forEach((keyword) => { if (text.includes(keyword)) score += 8; });
        (STYLE_KEYWORDS[form.style] || []).forEach((keyword) => { if (text.includes(keyword)) score += 6; });
        if (text.includes(String(form.color || '').toLocaleLowerCase('tr-TR'))) score += 12;
        if (text.includes(String(form.fabric || '').toLocaleLowerCase('tr-TR'))) score += 10;
        if (Array.isArray(product?.sizeOptions) && product.sizeOptions.includes(bodyProfile.topSize)) score += 6;
        if (budget > 0 && Number(product?.price || 0) <= budget) score += 8;
        if (budget > 0 && Number(product?.price || 0) > budget) score -= 10;
        if (product?.isFastDelivery) score += 3;
        if (product?.isFreeCargo) score += 2;
        if (form.note && text.includes(form.note.toLocaleLowerCase('tr-TR'))) score += 10;
        return score;
    };

    const findBestProduct = (preferredIds, usedIds) => {
        const pool = [...allProducts]
            .filter((product) => !usedIds.has(product.id))
            .map((product) => ({product, score: scoreProduct(product, preferredIds)}))
            .filter((item) => item.score > 18)
            .sort((a, b) => b.score - a.score);
        return pool[0]?.product || null;
    };

    const buildCombos = () => {
        const recipeList = COMBO_RECIPES[form.category]?.[form.usage] || COMBO_RECIPES.kadin.gunluk;
        const combos = [];
        for (let comboIndex = 0; comboIndex < 3; comboIndex += 1) {
            const usedIds = new Set();
            const items = [];
            recipeList.forEach((pieceIds) => {
                const best = findBestProduct(pieceIds, usedIds);
                if (best) {
                    usedIds.add(best.id);
                    items.push(best);
                }
            });
            if (items.length >= 3) {
                const combo = {
                    id: `combo-${Date.now()}-${comboIndex}`,
                    title: `${safeText('aiShop.comboTitle', 'AI Shop Kombini')} ${comboIndex + 1}`,
                    usage: form.usage,
                    style: form.style,
                    category: form.category,
                    items,
                    totalPrice: items.reduce((acc, item) => acc + Number(item.price || 0), 0)
                };
                combos.push(combo);
                persistCombo(combo);
            }
        }
        return combos;
    };

    const runAIShopSearch = () => {
        const combos = buildCombos();
        setResults(combos);
        setHasSearched(true);
        saveBodyProfile();
    };

    return (
        <>
            {showPromo && (
                <div className="ai-shop-promo-overlay" onClick={() => setShowPromo(false)}>
                    <div className="ai-shop-promo-card" onClick={(event) => event.stopPropagation()}>
                        <span className="ai-shop-promo-badge">AI SHOP</span>
                        <h3>{safeText('aiShop.promoTitle', 'Yapay zeka desteği ile size özel alışveriş deneyimine hemen başlayın')}</h3>
                        <p>{safeText('aiShop.promoText', 'Tarzınızı, kullanım amacınızı ve renk tercihlerinizi söyleyin. Sizin için en doğru ürünleri saniyeler içinde sıralayalım.')}</p>
                        <div className="ai-shop-promo-actions">
                            <button type="button" className="ghost" onClick={() => setShowPromo(false)}>{safeText('common.close', 'Kapat')}</button>
                            <button type="button" className="primary" onClick={openAIShop}>{safeText('aiShop.startNow', 'AI Shop ile Başla')}</button>
                        </div>
                    </div>
                </div>
            )}

            <button type="button" className={`ai-shop-fab ${routeClassName}`} onClick={openAIShop} aria-label={safeText('aiShop.buttonAria', 'AI Shop aç')}>
                <span className="ai-shop-fab-icon-wrap" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="ai-shop-fab-icon">
                        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" fill="currentColor"/>
                        <path d="M19 14l.95 2.05L22 17l-2.05.95L19 20l-.95-2.05L16 17l2.05-.95L19 14z" fill="currentColor"/>
                        <path d="M6 14l.95 2.05L9 17l-2.05.95L6 20l-.95-2.05L3 17l2.05-.95L6 14z" fill="currentColor"/>
                    </svg>
                </span>
                <span className="ai-shop-fab-label">AI Shop</span>
            </button>

            {isOpen && (
                <div className="ai-shop-overlay" onClick={closeAIShop}>
                    <div className={`ai-shop-panel ${isMobile ? 'is-mobile' : 'is-desktop'}`} onClick={(event) => event.stopPropagation()}>
                        <div className="ai-shop-head">
                            <div className="ai-shop-head-title">
                                <span className="ai-shop-head-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" className="ai-shop-fab-icon">
                                        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" fill="currentColor"/>
                                        <path d="M19 14l.95 2.05L22 17l-2.05.95L19 20l-.95-2.05L16 17l2.05-.95L19 14z" fill="currentColor"/>
                                        <path d="M6 14l.95 2.05L9 17l-2.05.95L6 20l-.95-2.05L3 17l2.05-.95L6 14z" fill="currentColor"/>
                                    </svg>
                                </span>
                                <div>
                                    <strong>{safeText('aiShop.title', 'AI Shop')}</strong>
                                    <span>{safeText('aiShop.subtitle', 'Tarzınıza göre ürünleri birlikte seçelim')}</span>
                                </div>
                            </div>
                            <button type="button" className="ai-shop-close" onClick={closeAIShop} aria-label={safeText('common.close', 'Kapat')}>
                                <i className="pi pi-times"/>
                            </button>
                        </div>

                        <div className="ai-shop-body">
                            <section className="ai-shop-form-card">
                                <div className="ai-shop-section-title-wrap">
                                    <strong>{safeText('aiShop.measurementsTitle', 'Beden ölçütleri')}</strong>
                                </div>
                                <div className="ai-shop-form-grid is-measurements">
                                    <label><span>{safeText('aiShop.height', 'Boy')}</span><input type="text" value={bodyProfile.height} onChange={(e) => updateBodyProfile('height', e.target.value)} placeholder="cm" /></label>
                                    <label><span>{safeText('aiShop.weight', 'Kilo')}</span><input type="text" value={bodyProfile.weight} onChange={(e) => updateBodyProfile('weight', e.target.value)} placeholder="kg" /></label>
                                    <AIShopSelect
                                        id="body-gender"
                                        label={safeText('aiShop.gender', 'Cinsiyet')}
                                        value={bodyProfile.gender}
                                        options={GENDER_OPTIONS}
                                        onChange={(value) => updateBodyProfile('gender', value)}
                                        isOpen={openSelectId === 'body-gender'}
                                        onToggle={(id) => setOpenSelectId((prev) => prev === id ? '' : id)}
                                        onClose={() => setOpenSelectId('')}
                                    />
                                    <AIShopSelect
                                        id="body-top-size"
                                        label={safeText('aiShop.topSize', 'Kıyafet bedeni')}
                                        value={bodyProfile.topSize}
                                        options={TOP_SIZE_OPTIONS}
                                        onChange={(value) => updateBodyProfile('topSize', value)}
                                        isOpen={openSelectId === 'body-top-size'}
                                        onToggle={(id) => setOpenSelectId((prev) => prev === id ? '' : id)}
                                        onClose={() => setOpenSelectId('')}
                                    />
                                    <label><span>{safeText('aiShop.bottomSize', 'Pantolon bedeni')}</span><input type="text" value={bodyProfile.bottomSize} onChange={(e) => updateBodyProfile('bottomSize', e.target.value)} placeholder="36 / 38 / 40" /></label>
                                    <label><span>{safeText('aiShop.trouserLength', 'Pantolon boy ölçüsü')}</span><input type="text" value={bodyProfile.trouserLength} onChange={(e) => updateBodyProfile('trouserLength', e.target.value)} placeholder="İç boy / paça" /></label>
                                    <label><span>{safeText('aiShop.waist', 'Bel ölçüsü')}</span><input type="text" value={bodyProfile.waist} onChange={(e) => updateBodyProfile('waist', e.target.value)} placeholder="cm" /></label>
                                    <label><span>{safeText('aiShop.budget', 'Bütçe üst limiti')}</span><input type="number" value={bodyProfile.budget || ''} onChange={(e) => updateBodyProfile('budget', e.target.value)} placeholder="2500" /></label>
                                </div>
                                <div className="ai-shop-measurement-actions">
                                    <button type="button" className="ai-shop-save-profile" onClick={saveBodyProfile}>{safeText('aiShop.saveProfile', 'Beden bilgilerimi kaydet')}</button>
                                </div>

                                <div className="ai-shop-section-title-wrap second"><strong>{safeText('aiShop.preferencesTitle', 'Alışveriş tercihleriniz')}</strong></div>
                                <div className="ai-shop-form-grid">
                                    <label>
                                        <span>{safeText('aiShop.profile', 'Ben kimim?')}</span>
                                        <input type="text" value={form.profile} onChange={(event) => updateField('profile', event.target.value)} placeholder={safeText('aiShop.profilePlaceholder', 'Örn. 30 yaş, şehir stili')} />
                                    </label>
                                    <AIShopSelect
                                        id="pref-category"
                                        label={safeText('aiShop.category', 'Kategori')}
                                        value={form.category}
                                        options={CATEGORY_OPTIONS}
                                        onChange={(value) => updateField('category', value)}
                                        isOpen={openSelectId === 'pref-category'}
                                        onToggle={(id) => setOpenSelectId((prev) => prev === id ? '' : id)}
                                        onClose={() => setOpenSelectId('')}
                                    />
                                    <AIShopSelect
                                        id="pref-usage"
                                        label={safeText('aiShop.usage', 'Nerede kullanacaksınız?')}
                                        value={form.usage}
                                        options={USAGE_OPTIONS}
                                        onChange={(value) => updateField('usage', value)}
                                        isOpen={openSelectId === 'pref-usage'}
                                        onToggle={(id) => setOpenSelectId((prev) => prev === id ? '' : id)}
                                        onClose={() => setOpenSelectId('')}
                                    />
                                    <AIShopSelect
                                        id="pref-style"
                                        label={safeText('aiShop.style', 'Tarz')}
                                        value={form.style}
                                        options={STYLE_OPTIONS}
                                        onChange={(value) => updateField('style', value)}
                                        isOpen={openSelectId === 'pref-style'}
                                        onToggle={(id) => setOpenSelectId((prev) => prev === id ? '' : id)}
                                        onClose={() => setOpenSelectId('')}
                                    />
                                    <label>
                                        <span>{safeText('aiShop.color', 'Renk')}</span>
                                        <input type="text" value={form.color} onChange={(event) => updateField('color', event.target.value)} placeholder="Siyah / Bej / Mavi" />
                                    </label>
                                    <label>
                                        <span>{safeText('aiShop.fabric', 'Kumaş tipi')}</span>
                                        <input type="text" value={form.fabric} onChange={(event) => updateField('fabric', event.target.value)} placeholder="Pamuk / Viskon / Keten" />
                                    </label>
                                </div>

                                <label className="ai-shop-note-field">
                                    <span>{safeText('aiShop.note', 'Ek not')}</span>
                                    <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} placeholder={safeText('aiShop.notePlaceholder', 'Örn. kırışmayan, hafif, akşam yemeğine uygun')} />
                                </label>

                                <div className="ai-shop-actions">
                                    <button type="button" className="ai-shop-submit" onClick={runAIShopSearch} disabled={loading}>
                                        {loading ? safeText('search.loading', 'Yükleniyor...') : safeText('aiShop.findLooks', 'Benim için ürün bul')}
                                    </button>
                                </div>
                            </section>

                            <section className="ai-shop-results-card">
                                <div className="ai-shop-results-head">
                                    <strong>{safeText('aiShop.resultsTitle', 'Sizin için seçtiklerimiz')}</strong>
                                    {hasSearched && <span>{results.length} {safeText('aiShop.comboCount', 'kombin')}</span>}
                                </div>

                                {!hasSearched && (
                                    <div className="ai-shop-empty-state">
                                        <strong>{safeText('aiShop.emptyTitle', 'Tercihlerinize göre akıllı kombinler hazır')}</strong>
                                        <p>{safeText('aiShop.emptyText', 'Beden ölçütlerinizi ve stil tercihlerinizi girin. AI Shop sizin için tam kombinler oluştursun.')}</p>
                                    </div>
                                )}

                                {hasSearched && results.length === 0 && (
                                    <div className="ai-shop-empty-state">
                                        <strong>{safeText('search.emptyTitle', 'Şimdilik net eşleşme bulamadık')}</strong>
                                        <p>{safeText('aiShop.noResultText', 'Tercihlerinizi biraz daha genişleterek tekrar deneyin. Renk veya kumaş alanını daha genel bırakabilirsiniz.')}</p>
                                    </div>
                                )}

                                {results.length > 0 && (
                                    <div className="ai-shop-combo-grid">
                                        {results.map((combo) => (
                                            <article key={combo.id} className="ai-shop-combo-card">
                                                <div className="ai-shop-combo-cover-grid">
                                                    {combo.items.slice(0, 4).map((item) => (
                                                        <img key={item.id} src={item.img} alt={item.title} />
                                                    ))}
                                                </div>
                                                <div className="ai-shop-combo-content">
                                                    <strong>{combo.title}</strong>
                                                    <span>{safeText('aiShop.comboSummary', 'Kullanım amacı ve tarzınıza göre seçilmiş tam kombin')}</span>
                                                    <div className="ai-shop-combo-tags">
                                                        <span>{form.usage}</span>
                                                        <span>{form.style}</span>
                                                        <span>{form.color}</span>
                                                    </div>
                                                    <b>{combo.totalPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</b>
                                                    <button type="button" onClick={() => openComboDetail(combo.id)}>
                                                        {safeText('aiShop.inspectCombo', 'Kombini İncele')}
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIShopWidget;
