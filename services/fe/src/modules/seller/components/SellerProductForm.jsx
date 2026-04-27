import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {InputText} from 'primereact/inputtext';
import {InputTextarea} from 'primereact/inputtextarea';
import {MultiSelect} from 'primereact/multiselect';
import {Rating} from 'primereact/rating';
import AuthService from '../../../service/AuthService';
import {ProductCard} from '../../../components/product-components/ProductCard';
import {
    categoryPathLooksComplete,
    findCategoryPathByValue,
    getBrandOptionsForSeller,
    getCategoryLevelOptions,
    getCategoryPathPreview,
    getCategoryValueFromPath,
    getSellerProfile
} from '../data/sellerCatalogConfig';
import {COLOR_CATALOG, resolveColorHex, resolveColorLabel} from '../../../utils/colorOptions';

const levelLabels = ['Ana kategori', 'Alt kategori', 'Detay kategori', 'Son kategori'];
const installmentOptions = [
    {label: 'Pesin fiyatina', value: 'Pesin fiyatina'},
    {label: '2 taksit', value: '2 taksit'},
    {label: '3 taksit', value: '3 taksit'},
    {label: '4 taksit', value: '4 taksit'},
    {label: '6 taksit', value: '6 taksit'}
];

const sizeOptionsCatalog = [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46', '48', '50', 'Standart Beden'
].map((size) => ({label: size, value: size}));

const colorOptionsCatalog = COLOR_CATALOG;

const normalizeInitialForm = (initialForm) => {
    const incomingPath = Array.isArray(initialForm?.categoryPath) ? initialForm.categoryPath.filter(Boolean) : [];
    const derivedPath = incomingPath.length ? incomingPath : findCategoryPathByValue(initialForm?.category);
    const incomingColorOptions = Array.isArray(initialForm?.colorOptions)
        ? initialForm.colorOptions.map((item) => resolveColorHex(item)).filter(Boolean)
        : (String(initialForm?.color || '').trim() ? [resolveColorHex(initialForm.color)] : []);
    const incomingSizeOptions = Array.isArray(initialForm?.sizeOptions)
        ? initialForm.sizeOptions.filter(Boolean)
        : (String(initialForm?.size || '').trim() ? [String(initialForm.size).trim()] : []);

    return {
        title: initialForm?.title || '',
        category: initialForm?.category || '',
        categoryPath: derivedPath,
        brand: initialForm?.brand || '',
        productCode: initialForm?.productCode || '',
        imageUrl: initialForm?.imageUrl || '',
        price: initialForm?.price || '',
        oldPrice: initialForm?.oldPrice || '',
        discountRate: initialForm?.discountRate || '',
        color: resolveColorLabel(initialForm?.color || incomingColorOptions[0] || ''),
        size: initialForm?.size || incomingSizeOptions[0] || '',
        colorOptions: incomingColorOptions,
        sizeOptions: incomingSizeOptions,
        installmentText: initialForm?.installmentText || 'Pesin fiyatina',
        freeCargo: Boolean(initialForm?.freeCargo),
        fastDelivery: Boolean(initialForm?.fastDelivery),
        highlightsText: initialForm?.highlightsText || '',
        attributesText: initialForm?.attributesText || ''
    };
};

const requiredFieldOrder = ['title', 'brand', 'categoryPath', 'imageUrl', 'price', 'installmentText'];

const getValidationErrors = (form) => {
    const errors = {};

    if (!String(form.title || '').trim()) errors.title = 'Urun basligi zorunludur.';
    if (!String(form.brand || '').trim()) errors.brand = 'Marka secimi zorunludur.';
    if (!categoryPathLooksComplete(form.categoryPath)) errors.categoryPath = 'Kategori secimi tamamlanmalidir.';
    if (!String(form.imageUrl || '').trim()) errors.imageUrl = 'Gorsel URL zorunludur.';
    if (!String(form.price || '').trim()) errors.price = 'Fiyat zorunludur.';
    if (!String(form.installmentText || '').trim()) errors.installmentText = 'Taksit secimi zorunludur.';

    return errors;
};

const formatPricePreview = (value) => `${Number(value || 0).toLocaleString('tr-TR')} TL`;
const splitLineValues = (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
const parseAttributes = (value) => splitLineValues(value)
    .map((line) => {
        const [label, ...rest] = line.split(':');
        const safeLabel = String(label || '').trim();
        const safeValue = String(rest.join(':') || '').trim();
        return safeLabel && safeValue ? {label: safeLabel, value: safeValue} : null;
    })
    .filter(Boolean);

const getColorMeta = (value) => ({ label: resolveColorLabel(value), value: resolveColorHex(value), hex: resolveColorHex(value) });

export const SellerProductForm = ({
    initialForm,
    submitting = false,
    errorMessage = '',
    submitLabel,
    submitIcon = 'pi pi-check',
    onCancel,
    onSubmit,
    submitDisabled = false
}) => {
    const currentUser = AuthService.getCurrentUser();
    const sellerProfile = useMemo(() => getSellerProfile(currentUser), [currentUser]);
    const brandOptions = useMemo(() => getBrandOptionsForSeller(currentUser), [currentUser]);
    const [form, setForm] = useState(() => normalizeInitialForm(initialForm));
    const [validationErrors, setValidationErrors] = useState({});
    const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
    const [isDetailPreviewOpen, setIsDetailPreviewOpen] = useState(false);
    const fieldRefs = useRef({});

    useEffect(() => {
        setForm(normalizeInitialForm(initialForm));
        setValidationErrors({});
    }, [initialForm]);

    const categoryLevels = useMemo(() => {
        const levels = [];
        let prefix = [];

        for (let index = 0; index < 4; index += 1) {
            const options = getCategoryLevelOptions(prefix);
            if (!options.length) break;

            levels.push({
                index,
                label: levelLabels[index] || `Seviye ${index + 1}`,
                options,
                value: form.categoryPath[index] || null
            });

            const selectedValue = form.categoryPath[index];
            if (!selectedValue) break;
            prefix = [...prefix, selectedValue];
        }

        return levels;
    }, [form.categoryPath]);

    const selectedCategoryPreview = useMemo(() => getCategoryPathPreview(form.categoryPath), [form.categoryPath]);
    const previewBrand = form.brand || sellerProfile.allowedBrands[0] || 'Marka';
    const previewTitle = form.title || 'Urun basligi burada gorunecek';
    const previewPrice = formatPricePreview(form.price || 0);
    const previewOldPrice = Number(form.oldPrice || 0) > 0 ? formatPricePreview(form.oldPrice) : null;
    const previewDiscount = Number(form.discountRate || 0);
    const previewHighlights = splitLineValues(form.highlightsText);
    const previewAttributes = parseAttributes(form.attributesText);
    const previewColors = form.colorOptions.map(getColorMeta);
    const previewProduct = useMemo(() => ({
        id: form.productCode || 'seller-preview',
        productCode: form.productCode || 'seller-preview',
        routeId: form.productCode || 'seller-preview',
        title: previewTitle,
        mark: previewBrand,
        brand: previewBrand,
        category: getCategoryValueFromPath(form.categoryPath),
        price: Number(form.price || 0),
        oldPrice: Number(form.oldPrice || 0),
        discountRate: Number(form.discountRate || 0),
        rating: 0,
        reviewCount: 0,
        img: form.imageUrl || '',
        imageUrl: form.imageUrl || '',
        color: resolveColorLabel(form.colorOptions[0] || form.color || ''),
        size: form.sizeOptions[0] || form.size || '',
        sizeOptions: form.sizeOptions,
        colorOptions: form.colorOptions.map((item) => ({
            name: resolveColorLabel(item),
            hex: resolveColorHex(item),
            image: form.imageUrl || ''
        })),
        freeCargo: Boolean(form.freeCargo),
        isFreeCargo: Boolean(form.freeCargo),
        fastDelivery: Boolean(form.fastDelivery),
        isFastDelivery: Boolean(form.fastDelivery),
        sellerScore: 0,
        installmentText: form.installmentText || 'Pesin fiyatina',
        highlights: previewHighlights,
        attributes: previewAttributes
    }), [form, previewAttributes, previewBrand, previewHighlights, previewTitle]);

    const registerFieldRef = (fieldKey, node) => {
        if (node) fieldRefs.current[fieldKey] = node;
    };

    const focusFirstInvalidField = (errors) => {
        const targetKey = requiredFieldOrder.find((fieldKey) => errors[fieldKey]);
        if (!targetKey) return;

        const node = fieldRefs.current[targetKey];
        if (!node) return;
        if (typeof node.focus === 'function') {
            node.focus();
            return;
        }

        const focusable = node.querySelector?.('input, button, [tabindex]');
        if (focusable && typeof focusable.focus === 'function') {
            focusable.focus();
        }
    };

    const clearValidationFor = (key) => {
        setValidationErrors((prev) => {
            if (!prev[key]) return prev;
            const next = {...prev};
            delete next[key];
            return next;
        });
    };

    const updateField = (key, value) => {
        setForm((prev) => ({...prev, [key]: value}));
        clearValidationFor(key);
    };

    const updateColorOptions = (values) => {
        setForm((prev) => ({
            ...prev,
            colorOptions: values,
            color: values[0] || ''
        }));
        clearValidationFor('colorOptions');
    };

    const updateSizeOptions = (values) => {
        setForm((prev) => ({
            ...prev,
            sizeOptions: values,
            size: values[0] || ''
        }));
        clearValidationFor('sizeOptions');
    };

    const updateCategoryLevel = (levelIndex, value) => {
        setForm((prev) => {
            const nextPath = prev.categoryPath.slice(0, levelIndex);
            if (value) nextPath[levelIndex] = value;
            return {
                ...prev,
                categoryPath: nextPath,
                category: getCategoryValueFromPath(nextPath)
            };
        });
        clearValidationFor('categoryPath');
    };

    const handleSubmit = () => {
        const errors = getValidationErrors(form);
        setValidationErrors(errors);
        if (Object.keys(errors).length > 0) {
            focusFirstInvalidField(errors);
        }

        const payload = {
            ...form,
            category: getCategoryValueFromPath(form.categoryPath),
            color: form.colorOptions[0] || '',
            size: form.sizeOptions[0] || ''
        };

        if (onSubmit) onSubmit({form: payload, isValid: Object.keys(errors).length === 0});
    };

    const renderCategoryFieldError = (index) => (
        validationErrors.categoryPath && index === 0
            ? <small>{validationErrors.categoryPath}</small>
            : <small>Breadcrumb ve detay sayfasindaki kategori yolu buradan olusur.</small>
    );

    const colorOptionTemplate = (option) => (
        <div className="seller-color-option-row">
            <span className="seller-color-swatch" style={{backgroundColor: option.hex}}/>
            <span>{option.label}</span>
        </div>
    );

    const colorChipTemplate = (item) => {
        const meta = getColorMeta(item);
        return (
            <span className="seller-selected-chip seller-selected-chip-color">
                <span className="seller-color-swatch" style={{backgroundColor: meta.hex}}/>
                {meta.label}
            </span>
        );
    };

    const sizeChipTemplate = (item) => <span className="seller-selected-chip">{item}</span>;

    return (
        <>
            <div className="seller-form-card seller-form-card-modern">
                <div className="seller-form-header-grid seller-form-header-grid-modern">
                    <div>
                        <span className="seller-form-header-label">Satici baglami</span>
                        <strong>{sellerProfile.panelLabel}</strong>
                        <p>{sellerProfile.notes}</p>
                    </div>
                    <div>
                        <span className="seller-form-header-label">Urun modeli</span>
                        <strong>Product detail ile uyumlu giris</strong>
                        <p>Kart ve detay gorunumu ayni veri kaynagindan beslenecek sekilde kurgulandi.</p>
                    </div>
                </div>

                <div className="seller-form-preview-toolbar">
                    <div>
                        <span className="seller-form-header-label">Yayin onizlemesi</span>
                        <strong>Karti ve detay ekranini ayri ayri kontrol et</strong>
                    </div>
                    <div className="seller-form-preview-actions">
                        <Button type="button" label="Karti onizle" icon="pi pi-image" className="p-button-outlined" onClick={() => setIsCardPreviewOpen(true)}/>
                        <Button type="button" label="Detayi onizle" icon="pi pi-external-link" onClick={() => setIsDetailPreviewOpen(true)}/>
                    </div>
                </div>

                <section className="seller-form-section seller-form-section-modern">
                    <div className="seller-form-section-head seller-form-section-head-modern">
                        <div>
                            <span className="seller-form-header-label">Kart bilgileri</span>
                            <h2>Liste ve arama sonucunda gorunen alanlar</h2>
                            <p>Urun kartinda ilk gorulecek baslik, fiyat, gorsel ve ticari mesajlari buradan kuruyoruz.</p>
                        </div>
                    </div>

                    <div className="seller-form-grid seller-form-grid-modern">
                        <label className={`seller-form-field ${validationErrors.brand ? 'is-invalid' : ''}`}>
                            <span>Marka <em>*</em></span>
                            <div ref={(node) => registerFieldRef('brand', node)}>
                                <Dropdown
                                    value={form.brand || null}
                                    options={brandOptions}
                                    onChange={(e) => updateField('brand', e.value || '')}
                                    placeholder="Marka sec"
                                    className="seller-dropdown seller-dropdown-compact"
                                />
                            </div>
                            {validationErrors.brand ? <small>{validationErrors.brand}</small> : <small>Kartta ve detay sayfasinda ayni marka gorunur.</small>}
                        </label>

                        <label className={`seller-form-field ${validationErrors.title ? 'is-invalid' : ''}`}>
                            <span>Urun basligi <em>*</em></span>
                            <InputText ref={(node) => registerFieldRef('title', node)} value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Orn. Premium Kruvaze Midi Elbise"/>
                            {validationErrors.title ? <small>{validationErrors.title}</small> : <small>Musterinin kartta ve detayda gordugu ana basliktir.</small>}
                        </label>

                        <label className={`seller-form-field ${validationErrors.imageUrl ? 'is-invalid' : ''}`}>
                            <span>Kapak gorseli <em>*</em></span>
                            <InputText ref={(node) => registerFieldRef('imageUrl', node)} value={form.imageUrl} onChange={(e) => updateField('imageUrl', e.target.value)} placeholder="https://..."/>
                            {validationErrors.imageUrl ? <small>{validationErrors.imageUrl}</small> : <small>Liste karti ve detay galerisi bu gorselle baslar.</small>}
                        </label>

                        <label className={`seller-form-field ${validationErrors.price ? 'is-invalid' : ''}`}>
                            <span>Satis fiyati <em>*</em></span>
                            <InputText ref={(node) => registerFieldRef('price', node)} value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="1299"/>
                            {validationErrors.price ? <small>{validationErrors.price}</small> : <small>Urun kartindaki ana fiyat bilgisi.</small>}
                        </label>

                        <label className="seller-form-field">
                            <span>Eski fiyat</span>
                            <InputText value={form.oldPrice} onChange={(e) => updateField('oldPrice', e.target.value)} placeholder="1499"/>
                            <small>Varsa cizili fiyat olarak gorunur.</small>
                        </label>

                        <label className="seller-form-field">
                            <span>Indirim yuzdesi</span>
                            <InputText value={form.discountRate} onChange={(e) => updateField('discountRate', e.target.value)} placeholder="15"/>
                            <small>Kart uzerindeki indirim badge'i icin kullanilir.</small>
                        </label>

                        <label className={`seller-form-field ${validationErrors.installmentText ? 'is-invalid' : ''}`}>
                            <span>Taksit mesaji <em>*</em></span>
                            <div ref={(node) => registerFieldRef('installmentText', node)}>
                                <Dropdown
                                    value={form.installmentText || null}
                                    options={installmentOptions}
                                    onChange={(e) => updateField('installmentText', e.value || '')}
                                    placeholder="Taksit sec"
                                    className="seller-dropdown seller-dropdown-compact"
                                />
                            </div>
                            {validationErrors.installmentText ? <small>{validationErrors.installmentText}</small> : <small>Kart uzerindeki taksit mesaji icin kullanilir.</small>}
                        </label>

                        <label className="seller-form-field">
                            <span>Urun kodu</span>
                            <InputText value={form.productCode} onChange={(e) => updateField('productCode', e.target.value)} placeholder="ELB-2026-001"/>
                            <small>Yonetim ve entegrasyon takibi icin kullanilir.</small>
                        </label>
                    </div>

                    <div className="seller-checkbox-row seller-checkbox-row-modern">
                        <label><input type="checkbox" checked={form.freeCargo} onChange={(e) => updateField('freeCargo', e.target.checked)}/> Ucretsiz kargo badge'i goster</label>
                        <label><input type="checkbox" checked={form.fastDelivery} onChange={(e) => updateField('fastDelivery', e.target.checked)}/> Hizli teslimat badge'i goster</label>
                    </div>
                </section>

                <section className="seller-form-section seller-form-section-modern">
                    <div className="seller-form-section-head seller-form-section-head-modern">
                        <div>
                            <span className="seller-form-header-label">Detay bilgileri</span>
                            <h2>Product detail ekraninda acilan teknik ve ticari alanlar</h2>
                            <p>Renk, beden, kategori, one cikan maddeler ve ozellik ciftleri detay ekranini besler.</p>
                        </div>
                    </div>

                    <div className="seller-form-grid seller-form-grid-modern">
                        {categoryLevels.map((level) => (
                            <label key={level.index} className={`seller-form-field ${validationErrors.categoryPath ? 'is-invalid' : ''}`}>
                                <span>{level.label} {level.index === 0 ? <em>*</em> : null}</span>
                                <div ref={level.index === 0 ? (node) => registerFieldRef('categoryPath', node) : undefined}>
                                    <Dropdown
                                        value={level.value}
                                        options={level.options}
                                        onChange={(e) => updateCategoryLevel(level.index, e.value || '')}
                                        placeholder={`${level.label} sec`}
                                        className="seller-dropdown seller-dropdown-compact"
                                    />
                                </div>
                                {renderCategoryFieldError(level.index)}
                            </label>
                        ))}

                        <label className="seller-form-field seller-form-field-wide">
                            <span>Renk secenekleri</span>
                            <MultiSelect
                                value={form.colorOptions}
                                options={colorOptionsCatalog}
                                onChange={(e) => updateColorOptions(e.value || [])}
                                optionLabel="label"
                                optionValue="value"
                                display="chip"
                                filter
                                placeholder="Renk sec"
                                className="seller-multiselect"
                                itemTemplate={colorOptionTemplate}
                                selectedItemTemplate={colorChipTemplate}
                            />
                            <small>Musterinin secip gorecegi tum renk varyantlarini buradan belirle.</small>
                            <div className="seller-color-chip-grid">
                                {previewColors.length > 0 ? previewColors.map((item) => (
                                    <span key={item.value} className="seller-color-chip-card">
                                        <span className="seller-color-swatch" style={{backgroundColor: item.hex}}/>
                                        {item.label}
                                    </span>
                                )) : <span className="seller-muted-row">Secilen renkler burada gorunecek.</span>}
                            </div>
                        </label>

                        <label className="seller-form-field seller-form-field-wide">
                            <span>Beden secenekleri</span>
                            <MultiSelect
                                value={form.sizeOptions}
                                options={sizeOptionsCatalog}
                                onChange={(e) => updateSizeOptions(e.value || [])}
                                optionLabel="label"
                                optionValue="value"
                                display="chip"
                                filter
                                placeholder="Beden sec"
                                className="seller-multiselect"
                                selectedItemTemplate={sizeChipTemplate}
                            />
                            <small>Detay sayfasindaki beden secim alani bu listeyi kullanir.</small>
                        </label>
                    </div>

                    <div className="seller-form-path-preview seller-form-path-preview-modern">
                        <span>Kategori yolu</span>
                        <strong>{selectedCategoryPreview || 'Kategori secildiginde burada gosterilir'}</strong>
                        <p>Kayit sonrasi urun detayinda breadcrumb ve kategori referansi olarak kullanilir.</p>
                    </div>

                    <div className="seller-form-grid seller-form-grid-modern seller-form-grid-notes">
                        <label className="seller-form-field seller-form-field-wide">
                            <span>One cikan maddeler</span>
                            <InputTextarea
                                value={form.highlightsText}
                                onChange={(e) => updateField('highlightsText', e.target.value)}
                                rows={5}
                                placeholder={'Orn. Gun boyu formunu koruyan kumas\nAstarsiz hafif yapi\nOfisten aksama uyumlu kesim'}
                            />
                            <small>Her satir detay ekraninda ayri bir vurgu maddesi olarak gosterilir.</small>
                        </label>

                        <label className="seller-form-field seller-form-field-wide">
                            <span>Urun ozellikleri</span>
                            <InputTextarea
                                value={form.attributesText}
                                onChange={(e) => updateField('attributesText', e.target.value)}
                                rows={5}
                                placeholder={'Kumas: %95 Pamuk %5 Elastan\nKalıp: Regular fit\nBoy: Midi'}
                            />
                            <small>Her satiri `Baslik: Deger` formatinda gir. Detay ekraninda ozellik listesi olur.</small>
                        </label>
                    </div>
                </section>

                {errorMessage ? <div className="seller-inline-error">{errorMessage}</div> : null}

                <div className="seller-form-actions seller-form-actions-modern">
                    <Button type="button" label="Vazgec" className="p-button-text" onClick={onCancel} disabled={submitting}/>
                    <Button type="button" label={submitLabel} icon={submitIcon} onClick={handleSubmit} loading={submitting} disabled={submitDisabled || submitting}/>
                </div>
            </div>

            {isCardPreviewOpen ? (
                <div className="seller-preview-modal-backdrop" onClick={() => setIsCardPreviewOpen(false)}>
                    <div className="seller-preview-modal seller-preview-modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="seller-preview-modal-head">
                            <div>
                                <span className="seller-form-header-label">Kart onizlemesi</span>
                                <h3>Liste ve rail gorunumu</h3>
                            </div>
                            <Button type="button" icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setIsCardPreviewOpen(false)}/>
                        </div>
                        <div className="seller-live-card-preview">
                            <ProductCard product={previewProduct}/>
                        </div>
                    </div>
                </div>
            ) : null}

            {isDetailPreviewOpen ? (
                <div className="seller-preview-modal-backdrop" onClick={() => setIsDetailPreviewOpen(false)}>
                    <div className="seller-preview-modal seller-preview-modal-detail" onClick={(event) => event.stopPropagation()}>
                        <div className="seller-preview-modal-head">
                            <div>
                                <span className="seller-form-header-label">Detay onizlemesi</span>
                                <h3>Musterinin product detail ekraninda gorecegi yapi</h3>
                            </div>
                            <Button type="button" icon="pi pi-times" className="p-button-rounded p-button-text" onClick={() => setIsDetailPreviewOpen(false)}/>
                        </div>

                        <div className="seller-detail-preview-shell product-detail-page">
                            <div className="product-detail-main seller-detail-preview-main">
                                <div className="product-detail-gallery seller-detail-preview-gallery">
                                    <button type="button" className="product-detail-image-button seller-detail-preview-image-button">
                                        {form.imageUrl ? <img src={form.imageUrl} alt={previewTitle} className="product-detail-image"/> : <div className="seller-product-card-placeholder seller-detail-preview-placeholder">Gorsel</div>}
                                    </button>
                                    <div className="product-detail-thumbs">
                                        {[form.imageUrl || ''].filter(Boolean).map((imageUrl) => (
                                            <button key={imageUrl} type="button" className="product-detail-thumb is-active">
                                                <img src={imageUrl} alt={previewTitle}/>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="product-detail-info seller-detail-preview-info">
                                    <div className="product-detail-breadcrumb">
                                        <a href="/">Ana Sayfa</a>
                                        <span>/</span>
                                        <a href="/product">{selectedCategoryPreview || 'Kategori'}</a>
                                        <span>/</span>
                                        <span>{previewTitle}</span>
                                    </div>

                                    <h1 className="product-detail-title-line">
                                        <span className="product-detail-title-brand">{previewBrand}</span>
                                        <span className="product-detail-title-text">{previewTitle}</span>
                                    </h1>

                                    <div className="product-detail-rating-row">
                                        <span className="product-detail-rating-average">0.0</span>
                                        <Rating value={0} readOnly cancel={false}/>
                                        <button type="button" className="detail-link-button product-detail-review-count">(0 Degerlendirme)</button>
                                        <button type="button" className="detail-link-button">0 Soru & Cevap</button>
                                    </div>

                                    <div className="product-detail-price-area">
                                        {previewOldPrice ? <span className="detail-old-price">{previewOldPrice}</span> : null}
                                        <div className="detail-current-price">{previewPrice}</div>
                                        {previewDiscount > 0 ? <span className="detail-discount">%{previewDiscount}</span> : null}
                                    </div>

                                    <div className="product-detail-badges">
                                        {form.fastDelivery ? <span className="detail-badge fast">Hizli Teslimat</span> : null}
                                        {form.freeCargo ? <span className="detail-badge cargo">Ucretsiz Kargo</span> : null}
                                        <span className="detail-badge neutral">{form.installmentText || 'Pesin fiyatina'}</span>
                                    </div>

                                    {form.sizeOptions.length > 0 && (
                                        <div className="product-detail-size-block">
                                            <div className="product-detail-size-head">
                                                <span>Beden</span>
                                                <strong>{form.sizeOptions[0]}</strong>
                                            </div>
                                            <div className="product-detail-size-options">
                                                {form.sizeOptions.map((item) => <button key={item} type="button" className={`product-detail-size-option ${item === form.sizeOptions[0] ? 'is-active' : ''}`}>{item}</button>)}
                                            </div>
                                        </div>
                                    )}

                                    {previewColors.length > 0 && (
                                        <div className="product-detail-color-block">
                                            <div className="product-detail-size-head">
                                                <span>Renk</span>
                                                <strong>{previewColors[0].label}</strong>
                                            </div>
                                            <div className="product-detail-color-options">
                                                {previewColors.map((item) => (
                                                    <button key={item.hex} type="button" className={`product-detail-color-option ${item.hex === previewColors[0].hex ? 'is-active' : ''}`}>
                                                        <span className="product-detail-color-dot" style={{backgroundColor: item.hex}} aria-hidden="true"/>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="product-detail-panel-grid">
                                        <div className="product-detail-panel-item">
                                            <div className="panel-label">Satici</div>
                                            <div className="panel-value">{previewBrand} Magazasi</div>
                                            <div className="panel-sub">Satici Puani: 0.0</div>
                                        </div>
                                        <div className="product-detail-panel-item">
                                            <div className="panel-label">Tahmini Teslimat</div>
                                            <div className="panel-value">Yarin - 3 gun icinde</div>
                                            <div className="panel-sub">Tum Turkiye'ye teslimat</div>
                                        </div>
                                    </div>

                                    <div className="product-detail-cart-row">
                                        <div className="product-detail-qty-selector">
                                            <button type="button">-</button>
                                            <span>1</span>
                                            <button type="button">+</button>
                                        </div>
                                        <Button label="Sepete Ekle" icon="pi pi-shopping-cart" className="detail-add-cart-button"/>
                                    </div>

                                    <section className="product-detail-features-block is-inline">
                                        <h2>Urun Ozellikleri</h2>
                                        <div className="product-detail-attributes-grid">
                                            {previewAttributes.map((item) => (
                                                <div key={`${item.label}-${item.value}`} className="product-detail-attribute-item">
                                                    <span className="attribute-key">{item.label}</span>
                                                    <span className="attribute-value">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <ul className="product-detail-highlights">
                                            {previewHighlights.map((item) => <li key={item}>{item}</li>)}
                                        </ul>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};
