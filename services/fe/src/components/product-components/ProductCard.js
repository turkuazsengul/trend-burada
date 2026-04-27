import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Rating} from 'primereact/rating';
import {FAVORITES_UPDATED_EVENT, initFavorites, isFavorite, toggleFavorite} from "../../service/FavoriteService";
import AppContext from "../../AppContext";
import CartService, {CART_UPDATED_EVENT} from "../../service/CartService";
import {ProductCardCartCta} from "./ProductCardCartCta";
import {ProductFavoriteButton} from "./ProductFavoriteButton";
import {resolveColorHex, resolveColorLabel} from "../../utils/colorOptions";

const formatPrice = (price, locale = 'tr-TR') => `${Number(price || 0).toLocaleString(locale)} TL`;

const hashCode = (value = '') => {
    return String(value).split('').reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 0);
};

const DISCOUNT_BADGE_STOPS = [
    {max: 9, background: '#fca5a5', border: '#f87171', shadow: 'rgba(252, 165, 165, 0.34)'},
    {max: 19, background: '#fb7185', border: '#f43f5e', shadow: 'rgba(251, 113, 133, 0.34)'},
    {max: 29, background: '#f43f5e', border: '#e11d48', shadow: 'rgba(244, 63, 94, 0.36)'},
    {max: 39, background: '#ef4444', border: '#dc2626', shadow: 'rgba(239, 68, 68, 0.36)'},
    {max: 49, background: '#f97316', border: '#ea580c', shadow: 'rgba(249, 115, 22, 0.38)'},
    {max: 59, background: '#f45d22', border: '#e6490f', shadow: 'rgba(244, 93, 34, 0.4)'},
    {max: 69, background: '#ef3b2d', border: '#d92d20', shadow: 'rgba(239, 59, 45, 0.42)'},
    {max: 75, background: '#dc2626', border: '#b91c1c', shadow: 'rgba(220, 38, 38, 0.44)'}
];

const getDiscountBadgeStyle = (discountRate = 0) => {
    const safeDiscount = Math.max(0, Math.min(75, Number(discountRate || 0)));
    const stop = DISCOUNT_BADGE_STOPS.find((item) => safeDiscount <= item.max) || DISCOUNT_BADGE_STOPS[DISCOUNT_BADGE_STOPS.length - 1];

    return {
        '--discount-badge-bg': stop.background,
        '--discount-badge-border': stop.border,
        '--discount-badge-shadow': stop.shadow
    };
};

const buildEngagementContent = (type, value, language) => {
    if (type === 'favorites') {
        return (
            <>
                <strong>{value}</strong>
                <span>{language === 'en' ? ' people favorited this' : ' kişi favoriledi'}</span>
            </>
        );
    }

    if (type === 'views') {
        return (
            <>
                <strong>24</strong>
                <span>{language === 'en' ? 'h ' : ' saatte '}</span>
                <strong>{value}</strong>
                <span>{language === 'en' ? ' people viewed' : ' kişi inceledi'}</span>
            </>
        );
    }

    return <strong>{language === 'en' ? 'Fast Delivery' : 'Hızlı Teslimat'}</strong>;
};

export const ProductCard = ({product}) => {
    const {t = (key) => key, language = 'tr'} = useContext(AppContext) || {};
    const [favorite, setFavorite] = useState(false);
    const [insightIndex, setInsightIndex] = useState(0);
    const [cartQuantity, setCartQuantity] = useState(0);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const mediaCarouselRef = useRef(null);
    const productId = product?.id;
    const productRouteId = product?.routeId || product?.productCode || product?.id;
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const favoriteCount = product?.favoriteCount;
    const viewedLast24h = product?.viewedLast24h;
    const isFastDelivery = product?.isFastDelivery;
    const discountRate = Number(product?.discountRate || 0);
    const discountBadgeStyle = useMemo(() => getDiscountBadgeStyle(discountRate), [discountRate]);
    const colorSwatches = useMemo(() => {
        const normalized = Array.isArray(product?.colorOptions)
            ? product.colorOptions.map((item) => {
                if (typeof item === 'string') {
                    return item;
                }

                if (!item || typeof item !== 'object') {
                    return '';
                }

                return item.hex || item.name || item.label || item.color || '';
            }).filter(Boolean)
            : [];

        const fallbackColors = product?.color ? [product.color] : [];
        return Array.from(new Set([...normalized, ...fallbackColors])).slice(0, 3);
    }, [product]);
    const productCardImages = useMemo(() => {
        const colorImages = Array.isArray(product?.colorOptions)
            ? product.colorOptions.map((item) => {
                if (!item) {
                    return '';
                }

                if (typeof item === 'string') {
                    return '';
                }

                return item.image || item.img || item.imageUrl || '';
            })
            : [];

        return Array.from(new Set([product?.img, ...colorImages].filter(Boolean))).slice(0, 3);
    }, [product]);

    useEffect(() => {
        const sync = () => setFavorite(isFavorite(productId));
        sync();
        initFavorites().then(sync);
        window.addEventListener(FAVORITES_UPDATED_EVENT, sync);
        return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, sync);
    }, [productId]);

    const defaultCartSelection = useMemo(() => ({
        selectedSize: product?.sizeOptions?.[0] || product?.size || '',
        selectedColor: resolveColorLabel(product?.colorOptions?.[0] || product?.color || '')
    }), [product]);

    useEffect(() => {
        const syncCartQuantity = () => {
            const items = CartService.getCartItems();
            const matchedItem = items.find((item) => (
                item.id === product?.id
                && String(item.selectedSize || '') === String(defaultCartSelection.selectedSize || '')
                && String(item.selectedColor || '') === String(defaultCartSelection.selectedColor || '')
            ));
            setCartQuantity(Number(matchedItem?.quantity || 0));
        };

        syncCartQuantity();
        window.addEventListener(CART_UPDATED_EVENT, syncCartQuantity);
        return () => window.removeEventListener(CART_UPDATED_EVENT, syncCartQuantity);
    }, [product, defaultCartSelection]);

    const engagementInsights = useMemo(() => {
        const seed = hashCode(productId);
        const safeFavoriteCount = favoriteCount || 120 + (seed % 880);
        const safeViewedLast24h = viewedLast24h || 40 + (seed % 360);

        return [
            {
                key: 'favorites',
                symbolType: 'rocket',
                content: buildEngagementContent('favorites', safeFavoriteCount, language)
            },
            {
                key: 'views',
                icon: 'pi pi-eye',
                iconClassName: 'is-viewed',
                content: buildEngagementContent('views', safeViewedLast24h, language)
            },
            isFastDelivery ? {
                key: 'delivery',
                symbolType: 'delivery',
                content: buildEngagementContent('delivery', null, language)
            } : null
        ].filter(Boolean);
    }, [favoriteCount, viewedLast24h, isFastDelivery, productId, language]);

    useEffect(() => {
        if (engagementInsights.length <= 1) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setInsightIndex((prev) => (prev + 1) % engagementInsights.length);
        }, 2200);

        return () => window.clearInterval(intervalId);
    }, [engagementInsights]);

    useEffect(() => {
        setActiveMediaIndex(0);
        if (mediaCarouselRef.current) {
            mediaCarouselRef.current.scrollTo({left: 0, behavior: 'auto'});
        }
    }, [productId]);

    const onFavoriteClick = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const next = await toggleFavorite({
            ...product,
            priceLabel: product.priceLabel,
            oldPriceLabel: product.oldPriceLabel
        });
        setFavorite(next);
    };

    const onAddToCart = (event) => {
        event.preventDefault();
        event.stopPropagation();

        CartService.addToCart({
            product,
            quantity: 1,
            selectedSize: defaultCartSelection.selectedSize,
            selectedColor: defaultCartSelection.selectedColor
        });

        const clickTarget = event?.currentTarget || event?.target;
        if (clickTarget && typeof window !== 'undefined') {
            const rect = clickTarget.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent('cart:add:fly', {
                detail: {
                    startX: rect.left + (rect.width / 2),
                    startY: rect.top + (rect.height / 2),
                    imageUrl: product?.img || ''
                }
            }));
        }
    };

    const onIncreaseCart = (event) => {
        onAddToCart(event);
    };

    const onDecreaseCart = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const items = CartService.getCartItems();
        const matchedItem = items.find((item) => (
            item.id === product?.id
            && String(item.selectedSize || '') === String(defaultCartSelection.selectedSize || '')
            && String(item.selectedColor || '') === String(defaultCartSelection.selectedColor || '')
        ));

        if (!matchedItem) {
            return;
        }

        const nextQty = Math.max(0, Number(matchedItem.quantity || 0) - 1);
        if (nextQty <= 0) {
            CartService.removeCartItem(matchedItem.lineId);
            return;
        }

        CartService.updateCartItemQuantity(matchedItem.lineId, nextQty);
    };

    const onMediaScroll = (event) => {
        const {scrollLeft, clientWidth} = event.currentTarget;
        if (!clientWidth) {
            return;
        }

        const nextIndex = Math.round(scrollLeft / clientWidth);
        if (nextIndex !== activeMediaIndex) {
            setActiveMediaIndex(Math.max(0, Math.min(productCardImages.length - 1, nextIndex)));
        }
    };

    return (
        <div className="product-card">
            <div className="product-image-shell">
                <a href={`/detail/${productRouteId}`} className="product-card-media-link">
                    <div className="product-image-area">
                        <div
                            ref={mediaCarouselRef}
                            className="product-image-carousel"
                            onScroll={onMediaScroll}
                        >
                            {productCardImages.map((imageUrl, index) => (
                                <div className="product-image-slide" key={`${product.id}-media-${index}`}>
                                    <img
                                        className="product-img"
                                        src={imageUrl}
                                        alt={`${product.title} ${index + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            ))}
                        </div>
                        {productCardImages.length > 1 && (
                            <div className="product-image-indicators" aria-hidden="true">
                                {productCardImages.map((_, index) => (
                                    <span
                                        key={`${product.id}-dot-${index}`}
                                        className={`product-image-indicator ${index === activeMediaIndex ? 'is-active' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                        {colorSwatches.length > 1 && (
                            <div
                                className="product-color-swatches-badge"
                                aria-label={`${colorSwatches.length} ${language === 'en' ? 'color options' : 'renk seçeneği'}`}
                            >
                                {colorSwatches.map((colorName, index) => (
                                    <span
                                        key={`${product.id}-swatch-${index}`}
                                        className="product-color-swatch"
                                        style={{backgroundColor: resolveColorHex(colorName), zIndex: colorSwatches.length - index}}
                                        title={resolveColorLabel(colorName)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </a>
                <ProductFavoriteButton
                    isFavorited={favorite}
                    onToggleFavorite={onFavoriteClick}
                    ariaLabel={favorite ? t('productCard.removeFavorite') : t('productCard.addFavorite')}
                />
            </div>

            <a href={`/detail/${productRouteId}`} className="product-card-content-link">
                <div className="product-card-title">
                    <span className="product-brand">{product.mark}</span>
                    <span>{product.title}</span>
                </div>

                <div className="product-rating-row">
                    <span className="product-rating-average">{Number(product.rating || 0).toFixed(1)}</span>
                    <div className="product-rating">
                        <Rating value={product.rating} readOnly cancel={false}/>
                    </div>
                    <span className="product-review-count">({product.reviewCount || 0})</span>
                </div>

                <div className="product-engagement-ticker" aria-live="polite">
                    <span key={`${productId}-${engagementInsights[insightIndex]?.key || insightIndex}`}>
                        {engagementInsights[insightIndex]?.symbolType && (
                            <span
                                className={`product-engagement-symbol is-${engagementInsights[insightIndex].symbolType || ''}`}
                                aria-hidden="true"
                            />
                        )}
                        {engagementInsights[insightIndex]?.icon && (
                            <i
                                className={`${engagementInsights[insightIndex].icon} ${engagementInsights[insightIndex].iconClassName || ''}`}
                                aria-hidden="true"
                            />
                        )}
                        <span className={`product-engagement-text ${engagementInsights[insightIndex]?.key === 'delivery' ? 'is-delivery' : ''}`}>
                            {engagementInsights[insightIndex]?.content || null}
                        </span>
                    </span>
                </div>
            </a>

            <div className="product-card-footer">
                <div className="product-price-wrap">
                    {product.oldPriceLabel && <span className="old-price">{product.oldPriceLabel}</span>}
                    <div className="product-price-row">
                        <span>{product.priceLabel || formatPrice(product.price, locale)}</span>
                        {discountRate > 0 && (
                            <span
                                className="product-discount-badge product-discount-badge-inline"
                                style={discountBadgeStyle}
                            >
                                %{discountRate}
                            </span>
                        )}
                    </div>
                    <span className="installment-text">{product.installmentText}</span>
                </div>

                <ProductCardCartCta
                    quantity={cartQuantity}
                    language={language}
                    onAdd={onAddToCart}
                    onIncrease={onIncreaseCart}
                    onDecrease={onDecreaseCart}
                />
            </div>
        </div>
    );
};
