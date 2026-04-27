import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import CartService, {CART_UPDATED_EVENT} from "../service/CartService";
import ProductService from "../service/ProductService";
import {useHistory} from "react-router-dom";
import AppContext from "../AppContext";
import UserActivityService from "../service/UserActivityService";
import {useAddresses, useCreateAddress} from "../hooks/useAddresses";

// Mirrors AddressRequest.java's @Pattern. Catch obviously-bad phone input client-side
// instead of letting the server reject the request with a 400.
const ADDRESS_PHONE_REGEX = /^[+0-9 ()\-]{6,30}$/;
const DEFAULT_COUNTRY = 'Türkiye';
const buildEmptyCartAddressForm = () => ({
    title: '',
    fullName: '',
    phone: '',
    country: DEFAULT_COUNTRY,
    city: '',
    district: '',
    neighborhood: '',
    addressLine: '',
    postalCode: '',
});

// Single source of truth for "is the current visitor logged in". The cart page checks this
// in a few places (entering checkout step 2, completing purchase) so factor it out.
const hasAuthToken = () =>
    typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));

const formatPrice = (price, locale) => `${Number(price || 0).toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL`;

const normalizeCardNumber = (value = '') => value.replace(/\D/g, '').slice(0, 16);
const formatCardNumber = (value = '') => normalizeCardNumber(value).replace(/(\d{4})(?=\d)/g, '$1 ');

const getInstallmentOptions = (total = 0, t) => {
    return [1, 2, 3, 4, 5, 6].map((count) => ({
        value: count,
        label: count === 1 ? t('cart.cash') : t('cart.installmentLabel', {count}),
        amount: total / count
    }));
};

export const CartPage = () => {
    const {t = (key) => key, language = 'tr', isMobile = false} = useContext(AppContext) || {};
    const text = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const history = useHistory();
    const paymentOptions = useMemo(() => ([
        {
            id: 'card',
            label: t('cart.creditCard'),
            detail: t('cart.cardDetail')
        },
        {
            id: 'transfer',
            label: t('cart.transfer'),
            detail: t('cart.transferDetail')
        },
        {
            id: 'door',
            label: t('cart.door'),
            detail: t('cart.doorDetail')
        }
    ]), [t]);
    const [items, setItems] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [recentlyViewedFallback, setRecentlyViewedFallback] = useState([]);
    const [campaignProducts, setCampaignProducts] = useState([]);
    const discountRates = [10, 20, 30, 40];
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedPayment, setSelectedPayment] = useState(paymentOptions[0].id);
    const [completed, setCompleted] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState(1);
    const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [checkoutStep, setCheckoutStep] = useState(typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 1);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddressForm, setNewAddressForm] = useState(buildEmptyCartAddressForm());
    const [newAddressError, setNewAddressError] = useState('');

    // Backend-backed address list (React Query). Fetches when a Bearer token exists; for
    // guests the hook stays disabled and `addresses` is an empty list, which the UI uses
    // to render the "Giriş yapmadan ödeme yapamazsınız" guard further down.
    const {
        data: addresses = [],
        isLoading: addressesLoading,
        isError: addressesError,
    } = useAddresses();
    const createAddressMutation = useCreateAddress();
    const isAuthenticated = hasAuthToken();
    const [cardForm, setCardForm] = useState({
        cardNumber: '',
        holderName: '',
        expiry: '',
        cvv: ''
    });
    const [viewedStart, setViewedStart] = useState(0);
    const [recoStart, setRecoStart] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
    const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false);
    const [swipeOffsets, setSwipeOffsets] = useState({});
    const swipeGestureRef = useRef({
        lineId: null,
        startX: 0,
        currentOffset: 0,
        isDragging: false
    });

    const reloadCart = () => {
        setItems(CartService.getCartItems());
    };

    useEffect(() => {
        reloadCart();
        const onCartUpdate = () => {
            reloadCart();
        };

        window.addEventListener(CART_UPDATED_EVENT, onCartUpdate);
        return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdate);
    }, []);

    useEffect(() => {
        setRecentlyViewed(UserActivityService.getViewedProducts());
    }, []);

    useEffect(() => {
        ProductService.getProductsByCategory('kadin').then((list) => {
            if (Array.isArray(list) && list.length > 0) {
                setRecentlyViewedFallback(list.slice(0, 12));
            } else {
                setRecentlyViewedFallback([]);
            }
        }).catch(() => setRecentlyViewedFallback([]));
    }, []);

    useEffect(() => {
        ProductService.getAllProducts().then((list) => {
            const safeList = Array.isArray(list) ? list : [];
            const sorted = [...safeList].sort((a, b) => Number(b?.discountRate || 0) - Number(a?.discountRate || 0));
            setCampaignProducts(sorted.slice(0, 12));
        }).catch(() => setCampaignProducts([]));
    }, []);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize, {passive: true});
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Map server-side AddressView to the {id, label, detail, isDefault} shape used by the
    // checkout option list. The label falls back to "Teslimat Adresim" if the user didn't
    // give the address a title (server allows blank-after-trim only via @NotBlank validation
    // failing — but defensive default keeps the UI from rendering an empty radio).
    const addressOptions = useMemo(() => {
        if (!Array.isArray(addresses)) {
            return [];
        }
        return addresses.map((item) => {
            const city = String(item?.city || '').trim();
            const district = String(item?.district || '').trim();
            const neighborhood = String(item?.neighborhood || '').trim();
            const addressLine = String(item?.addressLine || '').trim();
            const location = [neighborhood, district, city].filter(Boolean).join(' / ');
            const detail = [addressLine, location].filter(Boolean).join(' - ');
            const title = String(item?.title || '').trim();
            return {
                id: item?.id,
                label: title || t('cart.addressDetailFallback'),
                detail: detail || t('cart.addressDetailFallback'),
                isDefault: Boolean(item?.isDefault),
            };
        });
    }, [addresses, t]);

    useEffect(() => {
        if (addressOptions.length === 0) {
            setSelectedAddress('');
            return;
        }

        const stillExists = addressOptions.some((option) => option.id === selectedAddress);
        if (stillExists) {
            return;
        }

        const defaultOption = addressOptions.find((option) => option.isDefault) || addressOptions[0];
        setSelectedAddress(defaultOption.id);
    }, [addressOptions, selectedAddress]);

    useEffect(() => {
        const firstItem = items[0];
        const relatedProductRouteId = firstItem?.routeId || firstItem?.productCode || firstItem?.id;
        if (!relatedProductRouteId) {
            setSuggestedProducts([]);
            return;
        }

        ProductService.getRelatedProductsByProductId(relatedProductRouteId, 8).then((list) => {
            setSuggestedProducts(Array.isArray(list) ? list : []);
        });
    }, [items]);

    const summary = CartService.getCartSummary();
    const mobileCtaOldTotal = Number(summary.subtotal || 0) + Number(summary.cargo || 0);
    const hasMobileCtaDiscount = Number(summary.discount || 0) > 0 && mobileCtaOldTotal > Number(summary.total || 0);
    const installmentOptions = getInstallmentOptions(Number(summary.total || 0), t);
    const selectedInstallmentLabel = installmentOptions.find((item) => item.value === selectedInstallment)?.label || t('cart.cash');
    const isCardFormValid = normalizeCardNumber(cardForm.cardNumber).length === 16
        && String(cardForm.holderName || '').trim().length >= 4
        && String(cardForm.expiry || '').trim().length >= 5
        && String(cardForm.cvv || '').trim().length >= 3;
    const isPaymentContinueDisabled = selectedPayment === 'card' ? !isCardFormValid : false;

    useEffect(() => {
        const hasSelected = installmentOptions.some((item) => item.value === selectedInstallment);
        if (!hasSelected) {
            setSelectedInstallment(installmentOptions[0]?.value || 1);
        }
    }, [installmentOptions, selectedInstallment]);

    const increase = (lineId, currentQty) => {
        CartService.updateCartItemQuantity(lineId, Number(currentQty || 1) + 1);
    };

    const decrease = (lineId, currentQty) => {
        const nextQty = Math.max(1, Number(currentQty || 1) - 1);
        CartService.updateCartItemQuantity(lineId, nextQty);
    };

    const removeItem = (lineId) => {
        CartService.removeCartItem(lineId);
        setSwipeOffsets((prev) => {
            const next = {...prev};
            delete next[lineId];
            return next;
        });
    };

    const handleSwipeStart = (lineId, clientX) => {
        if (!isMobileViewport) {
            return;
        }

        swipeGestureRef.current = {
            lineId,
            startX: clientX,
            currentOffset: Number(swipeOffsets[lineId] || 0),
            isDragging: true
        };
    };

    const handleSwipeMove = (clientX) => {
        const active = swipeGestureRef.current;
        if (!isMobileViewport || !active.isDragging || !active.lineId) {
            return;
        }

        const delta = clientX - active.startX;
        const nextOffset = Math.max(-88, Math.min(0, active.currentOffset + delta));
        setSwipeOffsets((prev) => ({
            ...prev,
            [active.lineId]: nextOffset
        }));
    };

    const handleSwipeEnd = () => {
        const active = swipeGestureRef.current;
        if (!active.lineId) {
            return;
        }

        const finalOffset = Number(swipeOffsets[active.lineId] || 0);
        if (finalOffset <= -72) {
            removeItem(active.lineId);
        } else {
            setSwipeOffsets((prev) => ({
                ...prev,
                [active.lineId]: 0
            }));
        }

        swipeGestureRef.current = {
            lineId: null,
            startX: 0,
            currentOffset: 0,
            isDragging: false
        };
    };

    const completePurchase = () => {
        if (items.length === 0) {
            return;
        }

        if (!localStorage.getItem('token')) {
            history.push('/login?redirect=/sepetim');
            return;
        }

        if (selectedPayment === 'card') {
            if (!isCardFormValid) {
                return;
            }
        }

        setOtpCode('');
        setOtpError('');
        setBankModalOpen(true);
    };

    // Step 1 -> Step 2 needs an authenticated user since address CRUD is JWT-scoped on the
    // backend. Bouncing to login here closes the "guest checkout" flow without breaking
    // the rest of the cart (browse, add, etc. stay anonymous).
    const goToAddressStep = () => {
        if (!hasAuthToken()) {
            history.push('/login?redirect=/sepetim');
            return;
        }
        setCheckoutStep(2);
    };

    const handleAddressContinue = () => {
        if (!selectedAddress) {
            return;
        }
        setCheckoutStep(3);
    };

    const handlePaymentContinue = () => {
        if (selectedPayment === 'card') {
            if (!isCardFormValid) {
                return;
            }
        }

        setCheckoutStep(4);
    };

    const handleNewAddressField = (field, value) => {
        setNewAddressForm((prev) => ({...prev, [field]: value}));
        if (newAddressError) {
            setNewAddressError('');
        }
    };

    const handleCreateAddress = () => {
        // All NotBlank fields from AddressRequest. neighborhood and postalCode are optional.
        const requiredMissing = !newAddressForm.title.trim()
            || !newAddressForm.fullName.trim()
            || !newAddressForm.phone.trim()
            || !newAddressForm.country.trim()
            || !newAddressForm.city.trim()
            || !newAddressForm.district.trim()
            || !newAddressForm.addressLine.trim();
        if (requiredMissing) {
            setNewAddressError(text('cart.addressFormError', 'Lütfen zorunlu alanları doldurun.'));
            return;
        }

        if (!ADDRESS_PHONE_REGEX.test(newAddressForm.phone.trim())) {
            setNewAddressError(text('cart.addressPhoneInvalid', 'Telefon numarası geçersiz.'));
            return;
        }

        const trimOrNull = (value) => {
            const trimmed = String(value || '').trim();
            return trimmed.length === 0 ? '' : trimmed;
        };

        // First-address-becomes-default is enforced in two layers: client sends isDefault=true
        // when nothing exists yet, AND the server's partial unique index would catch any other
        // race. After creation, RQ invalidation refetches and the picker auto-selects via the
        // selectedAddress useEffect below.
        const body = {
            title: newAddressForm.title.trim(),
            fullName: newAddressForm.fullName.trim(),
            phone: newAddressForm.phone.trim(),
            country: newAddressForm.country.trim(),
            city: newAddressForm.city.trim(),
            district: newAddressForm.district.trim(),
            neighborhood: trimOrNull(newAddressForm.neighborhood),
            addressLine: newAddressForm.addressLine.trim(),
            postalCode: trimOrNull(newAddressForm.postalCode),
            isDefault: addresses.length === 0,
        };

        createAddressMutation.mutate(body, {
            onSuccess: (created) => {
                if (created && created.id) {
                    setSelectedAddress(created.id);
                }
                setShowNewAddressForm(false);
                setNewAddressForm(buildEmptyCartAddressForm());
                setNewAddressError('');
            },
            onError: (error) => {
                if (error && error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    history.push('/login?redirect=/sepetim');
                    return;
                }
                setNewAddressError(text('cart.addressSaveError', 'Adres kaydedilemedi. Lütfen tekrar deneyin.'));
            },
        });
    };

    const closeBankModal = () => {
        setBankModalOpen(false);
        setOtpError('');
    };

    const approveDemoPayment = () => {
        if (otpCode !== '867245') {
            setOtpError(t('cart.otpInvalid'));
            return;
        }

        const selectedAddressOption = addressOptions.find((item) => item.id === selectedAddress);
        UserActivityService.addOrder({
            items: items.map((item) => ({
                id: item.id,
                title: item.title,
                mark: item.mark,
                img: item.img,
                quantity: item.quantity,
                price: item.price,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor
            })),
            summary,
            paymentType: selectedPayment,
            installment: selectedInstallment,
            address: selectedAddressOption || null,
            status: 'prepared'
        });

        CartService.clearCart();
        setCompleted(true);
        setBankModalOpen(false);
        setMobileCheckoutOpen(false);
        setOtpCode('');
        setOtpError('');
    };

    const onCardFieldChange = (key, value) => {
        if (key === 'cardNumber') {
            setCardForm((prev) => ({...prev, cardNumber: formatCardNumber(value)}));
            return;
        }

        if (key === 'expiry') {
            const raw = value.replace(/\D/g, '').slice(0, 4);
            const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
            setCardForm((prev) => ({...prev, expiry: formatted}));
            return;
        }

        if (key === 'cvv') {
            setCardForm((prev) => ({...prev, cvv: value.replace(/\D/g, '').slice(0, 4)}));
            return;
        }

        setCardForm((prev) => ({...prev, [key]: value}));
    };

    const recentItemTemplate = (product) => {
        const routeId = product?.routeId || product?.productCode || product?.id;
        return (
            <a href={`/detail/${routeId}`} className="cart-suggest-card">
                <img src={product.img} alt={product.title}/>
                <strong>{product.mark}</strong>
                <span>{product.title}</span>
                <b>{formatPrice(product.price, locale)}</b>
            </a>
        );
    };

    const isMobileViewport = viewportWidth <= 768;
    const selectedAddressOption = addressOptions.find((item) => item.id === selectedAddress);
    const visibleRecentlyViewed = recentlyViewed.length > 0 ? recentlyViewed : recentlyViewedFallback;
    const baseViewedItems = visibleRecentlyViewed.slice(0, 12);
    const baseRecommendationProducts = (suggestedProducts.length > 0 ? suggestedProducts : campaignProducts).slice(0, 12);
    const fillToMin = (list, pool, min = 2) => {
        const base = Array.isArray(list) ? [...list] : [];
        const source = Array.isArray(pool) ? pool : [];
        if (base.length >= min) {
            return base;
        }
        const used = new Set(base.map((item) => String(item?.id)));
        for (let i = 0; i < source.length; i += 1) {
            const candidate = source[i];
            const key = String(candidate?.id);
            if (!candidate?.id || used.has(key)) {
                continue;
            }
            base.push(candidate);
            used.add(key);
            if (base.length >= min) {
                break;
            }
        }
        return base;
    };
    const viewedItems = isMobileViewport
        ? fillToMin(baseViewedItems, baseRecommendationProducts, 2).slice(0, 12)
        : baseViewedItems;
    const recommendationProducts = isMobileViewport
        ? fillToMin(baseRecommendationProducts, campaignProducts, 2).slice(0, 12)
        : baseRecommendationProducts;
    const hasSideRoomForRecommendations = viewedItems.length > 0 && viewedItems.length <= 3;
    const viewedVisibleCount = viewportWidth <= 768 ? 2 : (viewportWidth <= 1200 ? 2 : (hasSideRoomForRecommendations ? 2 : 4));
    const recoVisibleCount = viewportWidth <= 768 ? 2 : (hasSideRoomForRecommendations ? 2 : 4);
    const enableViewedSlider = viewedItems.length > viewedVisibleCount;
    const enableRecoSlider = recommendationProducts.length > recoVisibleCount;
    const viewedPanelStyle = viewedItems.length > 0
        ? {
            maxWidth: `calc(${viewedItems.length} * 17.2rem + ${Math.max(viewedItems.length - 1, 0)} * 0.65rem + 2.1rem)`
        }
        : undefined;
    const buildLoopWindow = (list, start, visibleCount) => {
        const safeList = Array.isArray(list) ? list : [];
        if (safeList.length <= visibleCount) {
            return safeList;
        }
        return Array.from({length: visibleCount}).map((_, index) => safeList[(start + index) % safeList.length]);
    };
    const viewedWindow = buildLoopWindow(viewedItems, viewedStart, viewedVisibleCount);
    const recoWindow = buildLoopWindow(recommendationProducts, recoStart, recoVisibleCount);
    const shiftLoop = (setter, list, step) => {
        const length = Array.isArray(list) ? list.length : 0;
        if (length === 0) {
            return;
        }
        setter((prev) => (prev + step + length) % length);
    };
    const openProductDetail = (productId) => {
        if (!productId) {
            return;
        }
        history.push(`/detail/${productId}`);
    };
    const renderCheckoutPanel = () => (
        <>
            {checkoutStep === 1 && !isMobileViewport && (
                <div className="checkout-panel-card cart-summary-card">
                    <h3>{t('cart.summaryTitle')}</h3>
                    <div className="summary-row"><span>{t('cart.subtotal')}</span><strong>{formatPrice(summary.subtotal, locale)}</strong></div>
                    <div className="summary-row"><span>{t('cart.cargo')}</span><strong>{summary.cargo === 0 ? t('cart.free') : formatPrice(summary.cargo, locale)}</strong></div>
                    <div className="summary-row"><span>{t('cart.discount')}</span><strong>- {formatPrice(summary.discount, locale)}</strong></div>
                    <div className="summary-row total"><span>{t('cart.total')}</span><strong>{formatPrice(summary.total, locale)}</strong></div>
                    <div className="checkout-step-actions">
                        <button
                            type="button"
                            className="checkout-complete-button"
                            onClick={goToAddressStep}
                            disabled={items.length === 0}
                        >
                            {text('cart.continueAddress', 'Adrese Geç')}
                        </button>
                    </div>
                </div>
            )}

            {checkoutStep === 2 && (
                <div className="checkout-panel-card">
                    <h3>{t('cart.addressTitle')}</h3>

                    {!isAuthenticated ? (
                        // Guest guard. The mobile flow lands on step 2 directly, so we can't
                        // rely on the step 1 -> 2 button alone — render the prompt here too.
                        <>
                            <div className="cart-address-empty-box">
                                <span>{text('cart.guestCheckoutBlocked', 'Devam etmek için giriş yapmanız gerekir.')}</span>
                            </div>
                            <div className="checkout-step-actions">
                                <button
                                    type="button"
                                    className="checkout-complete-button"
                                    onClick={() => history.push('/login?redirect=/sepetim')}
                                >
                                    {text('cart.goToLogin', 'Giriş Yap')}
                                </button>
                            </div>
                        </>
                    ) : addressesLoading ? (
                        <div className="cart-address-empty-box">
                            <span>{text('cart.addressLoading', 'Adresler yükleniyor...')}</span>
                        </div>
                    ) : addressesError ? (
                        <div className="cart-address-empty-box">
                            <span>{text('cart.addressLoadError', 'Adresler yüklenemedi. Lütfen sayfayı yenileyin.')}</span>
                        </div>
                    ) : (
                        <>
                            {addressOptions.length === 0 ? (
                                <div className="cart-address-empty-box">
                                    <span>{t('cart.noAddressInAccount')}</span>
                                </div>
                            ) : (
                                <div className="checkout-option-list">
                                    {addressOptions.map((option) => (
                                        <label key={option.id} className={`checkout-option ${selectedAddress === option.id ? 'is-active' : ''}`}>
                                            <input
                                                type="radio"
                                                name="address"
                                                value={option.id}
                                                checked={selectedAddress === option.id}
                                                onChange={() => setSelectedAddress(option.id)}
                                            />
                                            <span className="checkout-option-text">
                                                <strong>{option.label}</strong>
                                                <small>{option.detail}</small>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div className="checkout-step-actions">
                                {!isMobileViewport && (
                                    <button type="button" className="checkout-outline-btn" onClick={() => setCheckoutStep(1)}>
                                        {text('cart.back', 'Geri')}
                                    </button>
                                )}
                                <button type="button" className="checkout-outline-btn" onClick={() => setShowNewAddressForm((prev) => !prev)}>
                                    {text('cart.addAddressInline', 'Yeni Adres Ekle')}
                                </button>
                                <button
                                    type="button"
                                    className="checkout-complete-button"
                                    onClick={handleAddressContinue}
                                    disabled={!selectedAddress}
                                >
                                    {text('cart.continuePayment', 'Ödemeye Geç')}
                                </button>
                            </div>

                            {showNewAddressForm && (
                                <div className="inline-address-form">
                                    <div className="inline-address-grid">
                                        <label>
                                            <span>{text('cart.addressFormTitle', 'Adres Başlığı')}</span>
                                            <input
                                                type="text"
                                                maxLength={60}
                                                value={newAddressForm.title}
                                                onChange={(e) => handleNewAddressField('title', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressFullName', 'Ad Soyad')}</span>
                                            <input
                                                type="text"
                                                maxLength={120}
                                                value={newAddressForm.fullName}
                                                onChange={(e) => handleNewAddressField('fullName', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressPhone', 'Telefon')}</span>
                                            <input
                                                type="text"
                                                maxLength={30}
                                                value={newAddressForm.phone}
                                                onChange={(e) => handleNewAddressField('phone', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressCountry', 'Ülke')}</span>
                                            <input
                                                type="text"
                                                maxLength={60}
                                                value={newAddressForm.country}
                                                onChange={(e) => handleNewAddressField('country', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressCity', 'İl')}</span>
                                            <input
                                                type="text"
                                                maxLength={60}
                                                value={newAddressForm.city}
                                                onChange={(e) => handleNewAddressField('city', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressDistrict', 'İlçe')}</span>
                                            <input
                                                type="text"
                                                maxLength={60}
                                                value={newAddressForm.district}
                                                onChange={(e) => handleNewAddressField('district', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressNeighborhood', 'Mahalle (opsiyonel)')}</span>
                                            <input
                                                type="text"
                                                maxLength={80}
                                                value={newAddressForm.neighborhood}
                                                onChange={(e) => handleNewAddressField('neighborhood', e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            <span>{text('cart.addressPostalCode', 'Posta Kodu (opsiyonel)')}</span>
                                            <input
                                                type="text"
                                                maxLength={20}
                                                value={newAddressForm.postalCode}
                                                onChange={(e) => handleNewAddressField('postalCode', e.target.value)}
                                            />
                                        </label>
                                        <label className="full">
                                            <span>{text('cart.addressFull', 'Açık Adres')}</span>
                                            <input
                                                type="text"
                                                maxLength={500}
                                                value={newAddressForm.addressLine}
                                                onChange={(e) => handleNewAddressField('addressLine', e.target.value)}
                                            />
                                        </label>
                                    </div>
                                    {newAddressError && (
                                        <div className="bank-otp-error">{newAddressError}</div>
                                    )}
                                    <div className="checkout-step-actions">
                                        <button
                                            type="button"
                                            className="checkout-outline-btn"
                                            onClick={() => {
                                                setShowNewAddressForm(false);
                                                setNewAddressError('');
                                            }}
                                            disabled={createAddressMutation.isLoading}
                                        >
                                            {text('cart.cancel', 'Vazgeç')}
                                        </button>
                                        <button
                                            type="button"
                                            className="checkout-complete-button"
                                            onClick={handleCreateAddress}
                                            disabled={createAddressMutation.isLoading}
                                        >
                                            {createAddressMutation.isLoading
                                                ? text('cart.saveAddressLoading', 'Kaydediliyor...')
                                                : text('cart.saveAddress', 'Adresi Kaydet')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {checkoutStep === 3 && (
                <div className="checkout-panel-card">
                    <h3>{t('cart.paymentTitle')}</h3>
                    <div className="checkout-option-list">
                        {paymentOptions.map((option) => (
                            <div key={option.id} className="checkout-option-item">
                                <label className={`checkout-option ${selectedPayment === option.id ? 'is-active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value={option.id}
                                        checked={selectedPayment === option.id}
                                        onChange={() => setSelectedPayment(option.id)}
                                    />
                                    <span className="checkout-option-text">
                                        <strong>{option.label}</strong>
                                        <small>{option.detail}</small>
                                    </span>
                                </label>

                                {option.id === 'card' && selectedPayment === 'card' && (
                                    <div className="checkout-option-extend">
                                        <div className="card-form-area">
                                            <div className="card-form-grid">
                                                <label className="card-form-field full">
                                                    <span>{t('cart.cardNo')}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        value={cardForm.cardNumber}
                                                        onChange={(event) => onCardFieldChange('cardNumber', event.target.value)}
                                                    />
                                                </label>

                                                <label className="card-form-field full">
                                                    <span>{t('cart.cardHolder')}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="AD SOYAD"
                                                        value={cardForm.holderName}
                                                        onChange={(event) => onCardFieldChange('holderName', event.target.value)}
                                                    />
                                                </label>

                                                <label className="card-form-field">
                                                    <span>{t('cart.expiry')}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="AA/YY"
                                                        value={cardForm.expiry}
                                                        onChange={(event) => onCardFieldChange('expiry', event.target.value)}
                                                    />
                                                </label>

                                                <label className="card-form-field">
                                                    <span>CVV</span>
                                                    <input
                                                        type="password"
                                                        placeholder="***"
                                                        value={cardForm.cvv}
                                                        onChange={(event) => onCardFieldChange('cvv', event.target.value)}
                                                    />
                                                </label>
                                            </div>

                                            <div className="installment-area">
                                                <button
                                                    type="button"
                                                    className="installment-toggle"
                                                    onClick={() => setIsInstallmentOpen((prev) => !prev)}
                                                >
                                                    <strong>
                                                        {t('cart.installments')}
                                                        <span className="installment-selected-label">({selectedInstallmentLabel})</span>
                                                    </strong>
                                                    <i className={`pi ${isInstallmentOpen ? 'pi-angle-up' : 'pi-angle-down'}`}/>
                                                </button>

                                                <div className={`installment-list ${isInstallmentOpen ? 'is-open' : ''}`}>
                                                    {installmentOptions.map((item) => (
                                                        <label key={item.value} className={`installment-option ${selectedInstallment === item.value ? 'is-active' : ''}`}>
                                                            <input
                                                                type="radio"
                                                                name="installment"
                                                                checked={selectedInstallment === item.value}
                                                                onChange={() => setSelectedInstallment(item.value)}
                                                            />
                                                            <span>{item.label}</span>
                                                            <small>{formatPrice(item.amount, locale)}</small>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="checkout-step-actions">
                        <button type="button" className="checkout-outline-btn" onClick={() => setCheckoutStep(2)}>
                            {text('cart.back', 'Geri')}
                        </button>
                        <button
                            type="button"
                            className="checkout-complete-button"
                            onClick={handlePaymentContinue}
                            disabled={isPaymentContinueDisabled}
                        >
                            {text('cart.continueConfirm', 'Onaya Geç')}
                        </button>
                    </div>
                </div>
            )}

            {checkoutStep === 4 && (
                <div className="checkout-panel-card cart-summary-card">
                    <h3>{text('cart.finalCheckTitle', 'Son Kontrol')}</h3>
                    <div className="checkout-review-box">
                        <div className="checkout-review-row">
                            <span>{t('cart.addressTitle')}</span>
                            <strong>{selectedAddressOption?.label || '-'}</strong>
                        </div>
                        <div className="checkout-review-row">
                            <span>{t('cart.paymentTitle')}</span>
                            <strong>{paymentOptions.find((item) => item.id === selectedPayment)?.label || '-'}</strong>
                        </div>
                        {selectedPayment === 'card' && (
                            <div className="checkout-review-row">
                                <span>{t('cart.card')}</span>
                                <strong>**** **** **** {normalizeCardNumber(cardForm.cardNumber).slice(-4) || '0000'}</strong>
                            </div>
                        )}
                    </div>
                    <div className="summary-row"><span>{t('cart.subtotal')}</span><strong>{formatPrice(summary.subtotal, locale)}</strong></div>
                    <div className="summary-row"><span>{t('cart.cargo')}</span><strong>{summary.cargo === 0 ? t('cart.free') : formatPrice(summary.cargo, locale)}</strong></div>
                    <div className="summary-row"><span>{t('cart.discount')}</span><strong>- {formatPrice(summary.discount, locale)}</strong></div>
                    <div className="summary-row total"><span>{t('cart.total')}</span><strong>{formatPrice(summary.total, locale)}</strong></div>

                    <div className="checkout-step-actions">
                        <button type="button" className="checkout-outline-btn" onClick={() => setCheckoutStep(3)}>
                            {text('cart.back', 'Geri')}
                        </button>
                        <button
                            type="button"
                            className="checkout-complete-button"
                            onClick={completePurchase}
                            disabled={items.length === 0}
                        >
                            {t('cart.buy')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className={`cart-page ${isMobile ? 'cart-page-mobile-mode' : ''}`}>
            {completed && (
                <div className="cart-success-banner">
                    {t('cart.orderDone')}
                </div>
            )}

            <div className="cart-header">
                <div className="cart-header-left">
                    <h1>{t('cart.title')}</h1>
                    <span>{t('cart.productCount', {count: items.length})}</span>
                </div>
                {items.length > 0 && (
                    <div className="cart-header-right">
                        <div className="checkout-steps-chip">
                            {!isMobileViewport && (
                                <span className={checkoutStep >= 1 ? 'is-active' : ''}>{text('cart.summaryTitle', 'Özet')}</span>
                            )}
                            <span className={checkoutStep >= 2 ? 'is-active' : ''}>{text('cart.stepAddress', 'Adres')}</span>
                            <span className={checkoutStep >= 3 ? 'is-active' : ''}>{text('cart.stepPayment', 'Ödeme')}</span>
                            <span className={checkoutStep >= 4 ? 'is-active' : ''}>{text('cart.stepConfirm', 'Onay')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className={`cart-layout ${items.length === 0 ? 'is-empty' : ''}`}>
                <section className="cart-items-section">
                    {items.length === 0 && (
                        <div className="cart-empty-state">
                            <div>{t('cart.empty')}</div>
                            <button
                                type="button"
                                className="cart-empty-cta"
                                onClick={() => history.push('/')}
                            >
                                {text('cart.startShopping', 'Alışverişe Başla')}
                            </button>
                        </div>
                    )}

                    {items.map((item) => (
                        <article key={item.lineId} className={`cart-item-card ${isMobileViewport ? 'is-swipeable' : ''}`}>
                            {isMobileViewport && (
                                <div className="cart-item-delete-reveal" aria-hidden="true">
                                    <i className="pi pi-trash"/>
                                </div>
                            )}

                            <div
                                className="cart-item-swipe-shell"
                                style={isMobileViewport ? {transform: `translateX(${Number(swipeOffsets[item.lineId] || 0)}px)`} : undefined}
                                onTouchStart={(event) => handleSwipeStart(item.lineId, event.touches[0].clientX)}
                                onTouchMove={(event) => handleSwipeMove(event.touches[0].clientX)}
                                onTouchEnd={handleSwipeEnd}
                                onTouchCancel={handleSwipeEnd}
                            >
                                <button
                                    type="button"
                                    className="cart-item-main-link"
                                    onClick={() => openProductDetail(item.routeId || item.productCode || item.id)}
                                >
                                    <img src={item.img} alt={item.title}/>

                                    <div className="cart-item-info">
                                        <strong>{item.mark}</strong>
                                        <h3>{item.title}</h3>
                                        <div className="cart-item-meta">
                                            <span>{t('cart.size')}: {item.selectedSize || '-'}</span>
                                            <span>{t('cart.color')}: {item.selectedColor || '-'}</span>
                                        </div>
                                        <div className="cart-item-price-row">
                                            <span className="cart-item-price">{formatPrice(item.price, locale)}</span>
                                        </div>
                                    </div>
                                </button>

                                <div className="cart-item-qty">
                                    <button type="button" onClick={() => decrease(item.lineId, item.quantity)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button type="button" onClick={() => increase(item.lineId, item.quantity)}>+</button>
                                    {!isMobileViewport && (
                                        <button
                                            type="button"
                                            className="cart-remove-icon-button"
                                            onClick={() => removeItem(item.lineId)}
                                            aria-label={t('cart.removeAria')}
                                        >
                                            <i className="pi pi-trash"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                {items.length > 0 && !isMobileViewport && (
                    <aside className="cart-checkout-section">
                        {renderCheckoutPanel()}
                    </aside>
                )}
            </div>

            <section className={`cart-personalized-row ${hasSideRoomForRecommendations ? 'split' : 'stacked'}`}>
                <section className={`cart-suggest-section cart-viewed-panel ${hasSideRoomForRecommendations ? 'is-compact' : ''}`} style={hasSideRoomForRecommendations ? viewedPanelStyle : undefined}>
                    <div className="cart-suggest-head">{text('cart.recentlyViewedTitle', 'Önceden İncelediklerim')}</div>
                    {viewedItems.length > 0 ? (
                        <div className={`cart-viewed-track-shell ${enableViewedSlider ? 'is-slider' : ''}`}>
                            {enableViewedSlider && (
                                <button
                                    type="button"
                                    className="cart-viewed-nav prev"
                                    onClick={() => shiftLoop(setViewedStart, viewedItems, -1)}
                                    aria-label={text('cart.prev', 'Önceki')}
                                >
                                    <i className="pi pi-angle-left"/>
                                </button>
                            )}
                            <div className={`cart-viewed-grid is-loop`} style={{'--loop-col-count': viewedWindow.length}}>
                                {viewedWindow.map((product) => (
                                    <div key={product.id} className="cart-viewed-item">
                                        {recentItemTemplate(product)}
                                    </div>
                                ))}
                            </div>
                            {enableViewedSlider && (
                                <button
                                    type="button"
                                    className="cart-viewed-nav next"
                                    onClick={() => shiftLoop(setViewedStart, viewedItems, 1)}
                                    aria-label={text('cart.next', 'Sonraki')}
                                >
                                    <i className="pi pi-angle-right"/>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="cart-empty-state">
                            {text('cart.recentlyViewedEmpty', 'Henüz incelediğin ürün yok. Ürünleri keşfettikçe burada listelenecek.')}
                        </div>
                    )}
                </section>

                {recommendationProducts.length > 0 && (
                    <section className="cart-suggest-section cart-reco-panel">
                        <div className="cart-suggest-head">{text('cart.suggestTitle', 'Sizin İçin Öneriler')}</div>
                        <div className={`cart-viewed-track-shell ${enableRecoSlider ? 'is-slider' : ''}`}>
                            {enableRecoSlider && (
                                <button
                                    type="button"
                                    className="cart-viewed-nav prev"
                                    onClick={() => shiftLoop(setRecoStart, recommendationProducts, -1)}
                                    aria-label={text('cart.prev', 'Önceki')}
                                >
                                    <i className="pi pi-angle-left"/>
                                </button>
                            )}
                            <div
                                className="cart-viewed-grid cart-reco-grid is-loop"
                                style={{'--loop-col-count': Math.max(recoWindow.length, 1)}}
                            >
                                {recoWindow.map((product) => (
                                    <div key={`reco-${product.id}`} className="cart-viewed-item">
                                        {recentItemTemplate(product)}
                                    </div>
                                ))}
                            </div>
                            {enableRecoSlider && (
                                <button
                                    type="button"
                                    className="cart-viewed-nav next"
                                    onClick={() => shiftLoop(setRecoStart, recommendationProducts, 1)}
                                    aria-label={text('cart.next', 'Sonraki')}
                                >
                                    <i className="pi pi-angle-right"/>
                                </button>
                            )}
                        </div>
                    </section>
                )}
            </section>

            <section className="cart-discount-circles">
                <div className="cart-suggest-head cart-discount-title">{text('cart.discountHubTitle', 'Size Özel İndirim Fırsatları')}</div>
                <div className="cart-discount-circle-row">
                    {discountRates.map((rate, index) => (
                        <a
                            key={rate}
                            href={`/product/indirim?discount=${rate}`}
                            className={`cart-discount-circle c${index + 1}`}
                        >
                            <strong>%{rate}</strong>
                            <span>{text('cart.discountCircleLabel', 'İndirim')}</span>
                        </a>
                    ))}
                </div>
            </section>

            <section className="cart-campaign-strip">
                {campaignProducts.slice(0, 6).map((product) => (
                    <a key={product.id} href={`/detail/${product.routeId || product.productCode || product.id}`} className="cart-campaign-card is-product">
                        <img src={product.img} alt={product.title}/>
                        <div className="cart-campaign-content">
                            <strong>{product.mark}</strong>
                            <span>{product.title}</span>
                            <b>{formatPrice(product.price, locale)}</b>
                        </div>
                    </a>
                ))}
            </section>

            {isMobileViewport && items.length > 0 && (
                <div className="cart-mobile-cta-bar">
                    <div className="cart-mobile-cta-price">
                        <span className="cart-mobile-cta-caption">{t('cart.total')}</span>
                        <strong>{formatPrice(summary.total, locale)}</strong>
                        {hasMobileCtaDiscount && (
                            <span className="cart-mobile-cta-old-price">{formatPrice(mobileCtaOldTotal, locale)}</span>
                        )}
                        <span className="cart-mobile-cta-delivery">
                            {text('cart.deliveryType', 'Teslimat: Standart Kargo')}
                        </span>
                        <span className="cart-mobile-cta-cargo">
                            {summary.cargo === 0
                                ? text('cart.cargoFreeInfo', 'Kargo: Ücretsiz')
                                : `${t('cart.cargo')}: ${formatPrice(summary.cargo, locale)}`}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="cart-mobile-cta-button"
                        onClick={() => {
                            if (!hasAuthToken()) {
                                history.push('/login?redirect=/sepetim');
                                return;
                            }
                            setCheckoutStep(2);
                            setMobileCheckoutOpen(true);
                        }}
                    >
                        <span className="cart-mobile-cta-button-icon" aria-hidden="true">
                            <span className="cart-mobile-cta-dollar-ring"/>
                        </span>
                        {t('cart.buy')}
                    </button>
                </div>
            )}

            {isMobileViewport && mobileCheckoutOpen && (
                <div className="cart-mobile-checkout-backdrop" onClick={() => setMobileCheckoutOpen(false)}>
                    <div className="cart-mobile-checkout-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="cart-mobile-checkout-head">
                            <h3>{text('cart.mobileCheckoutTitle', 'Güvenli Ödeme')}</h3>
                            <button type="button" onClick={() => setMobileCheckoutOpen(false)}>{t('cart.close')}</button>
                        </div>
                        <div className="checkout-steps-chip">
                            <span className={checkoutStep >= 2 ? 'is-active' : ''}>{text('cart.stepAddress', 'Adres')}</span>
                            <span className={checkoutStep >= 3 ? 'is-active' : ''}>{text('cart.stepPayment', 'Ödeme')}</span>
                            <span className={checkoutStep >= 4 ? 'is-active' : ''}>{text('cart.stepConfirm', 'Onay')}</span>
                        </div>
                        <div className="cart-mobile-checkout-content">
                            {renderCheckoutPanel()}
                        </div>
                    </div>
                </div>
            )}

            {bankModalOpen && (
                <div className="bank-demo-modal-backdrop" onClick={closeBankModal}>
                    <div className="bank-demo-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="bank-demo-head">
                            <h3>{t('cart.bankTitle')}</h3>
                            <button type="button" onClick={closeBankModal}>{t('cart.close')}</button>
                        </div>

                        <div className="bank-demo-content">
                            <div className="bank-demo-info">
                                {t('cart.bankInfo')}
                            </div>
                            <div className="bank-demo-row"><span>{t('cart.amount')}</span><strong>{formatPrice(summary.total, locale)}</strong></div>
                            <div className="bank-demo-row"><span>{t('cart.card')}</span><strong>**** **** **** {normalizeCardNumber(cardForm.cardNumber).slice(-4) || '0000'}</strong></div>
                            <div className="bank-demo-row"><span>{t('cart.installments')}</span><strong>{selectedInstallmentLabel}</strong></div>
                            <div className="bank-demo-row"><span>{t('cart.secureCode')}</span><strong>867245</strong></div>

                            <div className="bank-otp-area">
                                <label htmlFor="bank-otp-input">{t('cart.otp')}</label>
                                <input
                                    id="bank-otp-input"
                                    type="text"
                                    value={otpCode}
                                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder={t('cart.otpPlaceholder')}
                                />
                                {otpError && <div className="bank-otp-error">{otpError}</div>}
                            </div>

                            <p>{t('cart.demoText')}</p>
                        </div>

                        <div className="bank-demo-actions">
                            <button type="button" className="cancel" onClick={closeBankModal}>{t('cart.reject')}</button>
                            <button
                                type="button"
                                className="approve"
                                onClick={approveDemoPayment}
                                disabled={otpCode.length !== 6}
                            >
                                {t('cart.approveBuy')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
