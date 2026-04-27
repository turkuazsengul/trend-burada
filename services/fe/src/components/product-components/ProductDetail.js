import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from 'primereact/button';
import {Carousel} from 'primereact/carousel';
import {Rating} from 'primereact/rating';
import ProductService from "../../service/ProductService";
import {MEGA_MENU_CATEGORIES} from "../../data/demoProductData";
import {ProductFeedbackPanel} from "./ProductFeedbackPanel";
import {ImageLightbox} from "./ImageLightbox";
import CartService from "../../service/CartService";
import AppContext from "../../AppContext";
import UserActivityService from "../../service/UserActivityService";
import {FAVORITES_UPDATED_EVENT, initFavorites, isFavorite, toggleFavorite} from "../../service/FavoriteService";
import {ProductFavoriteButton} from "./ProductFavoriteButton";
import {normalizeColorOption, resolveColorHex, resolveColorLabel} from "../../utils/colorOptions";

const resolveCategoryKeyFromId = (productId = '') => {
    const normalized = String(productId).toLowerCase();
    const splitterIndex = normalized.indexOf('-');
    if (splitterIndex <= 0) {
        return 'elbise';
    }

    return normalized.slice(0, splitterIndex);
};

const formatPrice = (price, locale = 'tr-TR') => `${Number(price || 0).toLocaleString(locale)} TL`;

const buildDeliveryLabel = (language, t) => {
    const start = new Date();
    start.setDate(start.getDate() + 1);

    const end = new Date();
    end.setDate(end.getDate() + 3);

    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const formatDate = (value) => value.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'long'
    });

    return t('productDetail.deliveryRange', {start: formatDate(start), end: formatDate(end)});
};

const buildReviews = (product, language) => {
    const isEnglish = language === 'en';
    const productTitle = product?.title || (isEnglish ? 'Product' : 'Ürün');
    const mark = product?.mark || (isEnglish ? 'Seller' : 'Satıcı');
    const names = isEnglish ? [
        'Emma K.', 'Olivia T.', 'Sophia S.', 'Mia A.', 'Chloe B.', 'Emily D.', 'Ava Y.', 'Grace O.',
        'Lily C.', 'Hannah E.', 'Nora M.', 'Ella K.', 'Ruby P.', 'Aria A.', 'Lucy G.', 'Maya U.',
        'Zoe N.', 'Ivy V.', 'Leah R.', 'Anna F.'
    ] : [
        'Ayşe K.', 'Zeynep T.', 'Elif S.', 'Merve A.', 'Ceren B.', 'Ebru D.', 'Sena Y.', 'Büşra Ö.',
        'İrem Ç.', 'Nazlı E.', 'Derya M.', 'Sibel K.', 'Tuğçe P.', 'Aslı A.', 'Yasemin G.', 'Nisa U.',
        'Hande N.', 'Burcu V.', 'Selin R.', 'Mine F.'
    ];
    const comments = isEnglish ? [
        `${productTitle} is better quality than I expected. The fabric feels great and fit is perfect.`,
        `Color and fit are great. ${mark} store shipped fast and packaging was clean.`,
        'Exactly as shown in photos. Very comfortable for daily wear and great value.',
        'Stitch quality is solid and fabric is not thin. Easy to combine with outfits.',
        'I ordered by the size chart and it fits perfectly. No return hassle.',
        'Color is very close to what I saw on screen. No shrink or fade after first wash.',
        'Loved the cut, neither too tight nor too loose. Comfortable all day.',
        'Delivery was fast. Packaging was careful and product arrived in good condition.',
        'Craftsmanship is better than expected. Shoulder and sleeve fit is very clean.',
        'Great performance for the price, I will buy another color.'
    ] : [
        `${productTitle} beklediğimden kaliteli geldi. Kumaş dokusu çok iyi, kalıbı da tam oldu.`,
        `Renk ve duruşu çok güzel. ${mark} mağazası hızlı gönderdi, paketleme de temizdi.`,
        'Fotoğraftaki gibi geldi. Günlük kullanımda çok rahat, fiyat/performans açısından başarılı.',
        'Dikiş kalitesi başarılı, kumaş ince değil. Kombinlemesi kolay bir ürün.',
        'Beden tablosuna göre aldım, tam oldu. İade ile uğraşmadım.',
        'Rengi ekrandakine çok yakın. İlk yıkamada çekme ya da solma görmedim.',
        'Kalıbı çok beğendim, ne çok dar ne bol. Gün boyu rahat hissettiriyor.',
        'Kargo hızlı ulaştı. Paketleme özenliydi, ürün sorunsuz geldi.',
        'İşçilik beklediğimden iyi. Özellikle omuz ve kol kısmı çok düzgün.',
        'Fiyatına göre çok iyi performans veriyor, ikinci rengini de alacağım.'
    ];
    const reviewPhotoPool = [
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1400&q=80"
    ];
    const locale = isEnglish ? 'en-US' : 'tr-TR';

    return Array.from({length: 20}, (_, index) => {
        const date = new Date(2026, 3, 12 - (index % 10));
        const hasPhotos = index % 3 === 0 || index % 7 === 0;
        const photoStart = index % reviewPhotoPool.length;
        const photos = hasPhotos
            ? [
                reviewPhotoPool[photoStart],
                reviewPhotoPool[(photoStart + 1) % reviewPhotoPool.length]
            ]
            : [];

        return {
            id: `${product?.id || 'product'}-r${index + 1}`,
            user: names[index % names.length],
            rating: 4 + (index % 2),
            date: date.toLocaleDateString(locale, {day: '2-digit', month: 'long', year: 'numeric'}),
            text: comments[index % comments.length],
            photos
        };
    });
};

const buildQuestionAnswers = (product, language) => {
    const isEnglish = language === 'en';
    const mark = product?.mark || (isEnglish ? 'Seller' : 'Satıcı');
    if (isEnglish) {
        return [
            {
                id: `${product?.id || 'product'}-qa1`,
                question: 'Is the fit slim or regular?',
                answer: `${mark}: This product has a regular fit. You can choose your usual size.`,
                date: 'April 09, 2026'
            },
            {
                id: `${product?.id || 'product'}-qa2`,
                question: 'Is the fabric suitable for summer?',
                answer: `${mark}: A lightweight and breathable fabric is used, suitable for spring and summer.`,
                date: 'April 07, 2026'
            },
            {
                id: `${product?.id || 'product'}-qa3`,
                question: 'Does color fade after washing?',
                answer: `${mark}: Color vibrancy is preserved with care instructions.`,
                date: 'April 05, 2026'
            },
            {
                id: `${product?.id || 'product'}-qa4`,
                question: 'When will it be shipped?',
                answer: `${mark}: Your order is prepared the same day and shipped by the next day at the latest.`,
                date: 'April 04, 2026'
            }
        ];
    }

    return [
        {
            id: `${product?.id || 'product'}-qa1`,
            question: 'Kalıbı dar mı, normal kalıp mı?',
            answer: `${mark}: Ürün regular fit kalıptır. Kendi bedeninizi tercih edebilirsiniz.`,
            date: '09 Nisan 2026'
        },
        {
            id: `${product?.id || 'product'}-qa2`,
            question: 'Kumaş yapısı yaz için uygun mu?',
            answer: `${mark}: Hafif ve nefes alan kumaş kullanılmıştır, bahar-yaz için uygundur.`,
            date: '07 Nisan 2026'
        },
        {
            id: `${product?.id || 'product'}-qa3`,
            question: 'Renk yıkamada solma yapar mı?',
            answer: `${mark}: Yıkama talimatına uygun kullanımda renk canlılığı korunur.`,
            date: '05 Nisan 2026'
        },
        {
            id: `${product?.id || 'product'}-qa4`,
            question: 'Kargoya verilme süresi nedir?',
            answer: `${mark}: Siparişiniz aynı gün içinde hazırlanır ve en geç ertesi gün kargoya teslim edilir.`,
            date: '04 Nisan 2026'
        }
    ];
};

const relatedProductTemplate = (item, locale) => {
    const routeId = item?.routeId || item?.productCode || item?.id;
    return (
        <div className="detail-related-card-wrap">
            <a href={`/detail/${routeId}`} className="detail-related-card">
                <img src={item.img} alt={item.title} loading="lazy" decoding="async"/>
                <div className="detail-related-brand">{item.mark}</div>
                <div className="detail-related-title">{item.title}</div>
                <div className="detail-related-price">{formatPrice(item.price, locale)}</div>
            </a>
        </div>
    );
};

const normalizeAttributes = (product, t) => {
    const incoming = Array.isArray(product?.attributes) ? product.attributes : [];
    const validIncoming = incoming
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
            label: item.label || item.key || '',
            value: item.value || item.text || ''
        }))
        .filter((item) => item.label && item.value)
        .filter((item) => String(item.label).toLowerCase() !== 'beden');

    if (validIncoming.length > 0) {
        return validIncoming;
    }

    return [
        {label: t('productDetail.seller'), value: product?.mark || '-'},
        {label: t('productDetail.color'), value: product?.color || '-'},
        {label: t('productDetail.sellerScore'), value: formatSellerScore(product?.sellerScore)}
    ];
};

const normalizeColorOptions = (product) => {
    const incoming = Array.isArray(product?.colorOptions) ? product.colorOptions : [];
    const normalizedIncoming = incoming
        .map((item) => normalizeColorOption(item, product?.img || ''))
        .filter((item) => item && item.name);

    if (normalizedIncoming.length > 0) {
        return normalizedIncoming;
    }

    if (product?.color) {
        return [normalizeColorOption(product.color, product?.img || '')].filter(Boolean);
    }

    return [];
};

const formatSellerScore = (value) => Number(value || 0).toFixed(1);

const getAttributeValue = (attributes = [], labels = []) => {
    const keys = labels.map((label) => String(label).toLowerCase());
    const match = attributes.find((item) => keys.includes(String(item.label || '').toLowerCase()));
    return match?.value || '';
};

export const ProductDetail = ({match}) => {
    const {t = (key) => key, language = 'tr', isMobile = false} = useContext(AppContext) || {};
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const routeProductId = match?.params?.id;
    const toastTimerRef = useRef(null);
    const feedbackSectionRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [cartMessageVisible, setCartMessageVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [activeFeedbackMode, setActiveFeedbackMode] = useState('reviews');
    const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = useState(false);
    const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(0);
    const [favorite, setFavorite] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setQuantity(1);
        setCartMessageVisible(false);
        setActiveFeedbackMode('reviews');

        Promise.all([
            ProductService.getProductById(routeProductId),
            ProductService.getRelatedProductsByProductId(routeProductId, 12)
        ]).then(([productData, relatedList]) => {
            if (!isMounted) {
                return;
            }

            setProduct(productData || null);
            setRelatedProducts(Array.isArray(relatedList) ? relatedList : []);
            setSelectedImage(productData?.img || '');
            const incomingSizes = Array.isArray(productData?.sizeOptions) ? productData.sizeOptions : [];
            setSelectedSize(incomingSizes[0] || productData?.size || '');
            const incomingColors = normalizeColorOptions(productData);
            setSelectedColor(resolveColorLabel(incomingColors[0] || productData?.color || ''));
        }).finally(() => {
            if (isMounted) {
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, [routeProductId]);

    useEffect(() => {
        if (!product?.id) {
            return;
        }
        UserActivityService.addViewedProduct(product);
    }, [product]);

    useEffect(() => {
        if (!product?.id) {
            return undefined;
        }

        const syncFavorite = () => setFavorite(isFavorite(product.id));
        syncFavorite();
        initFavorites().then(syncFavorite);
        window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorite);

        return () => {
            window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorite);
        };
    }, [product]);

    const categoryKey = useMemo(() => resolveCategoryKeyFromId(routeProductId), [routeProductId]);

    const parentCategoryLabel = useMemo(() => {
        const parent = MEGA_MENU_CATEGORIES.find((group) => group.items.some((item) => item.slug === categoryKey));
        return parent?.label || t('productFilter.categories');
    }, [categoryKey, t]);

    const reviews = useMemo(() => buildReviews(product, language), [product, language]);
    const questionAnswers = useMemo(() => buildQuestionAnswers(product, language), [product, language]);
    const photoReviewCount = useMemo(() => {
        return reviews.filter((review) => Array.isArray(review.photos) && review.photos.length > 0).length;
    }, [reviews]);
    const sizeOptions = useMemo(() => {
        const fromProduct = Array.isArray(product?.sizeOptions) ? product.sizeOptions : [];
        if (fromProduct.length > 0) {
            return Array.from(new Set(fromProduct.filter(Boolean)));
        }
        return product?.size ? [product.size] : [];
    }, [product]);
    const productAttributes = useMemo(() => normalizeAttributes(product, t), [product, t]);
    const colorOptions = useMemo(() => normalizeColorOptions(product), [product]);
    const productHighlights = useMemo(() => {
        if (Array.isArray(product?.highlights) && product.highlights.length > 0) {
            return product.highlights;
        }

        return [
            t('productDetail.highlight1'),
            t('productDetail.highlight2'),
            t('productDetail.highlight3')
        ];
    }, [product, t]);
    const productSummaryParagraphs = useMemo(() => {
        const safeTitle = product?.title || '';
        const safeMark = product?.mark || '';
        const safeColor = resolveColorLabel(product?.color || colorOptions[0] || '');
        const fit = getAttributeValue(productAttributes, ['Kalıp', 'Fit']) || (language === 'en' ? 'regular fit' : 'regular fit');
        const material = getAttributeValue(productAttributes, ['Materyal', 'Material']) || (language === 'en' ? 'soft textured fabric' : 'yumuşak dokulu kumaş');
        const summaryText = t('productDetail.summaryText', {title: safeTitle});

        if (language === 'en') {
            return [
                summaryText,
                `${safeMark} designed this piece with a ${fit} silhouette and ${material.toLowerCase()} texture so it keeps its shape while staying comfortable throughout the day.`,
                `${safeColor ? `${safeColor} tone` : 'Its color palette'} works well with daily city styling, office looks and layered seasonal combinations without losing a clean premium feel.`
            ];
        }

        return [
            summaryText,
            `${safeMark} imzası taşıyan bu model, ${fit.toLowerCase()} kalıbı ve ${material.toLowerCase()} yapısıyla gün boyu konfor sunarken daha toplu ve dengeli bir siluet oluşturur.`,
            `${safeColor ? `${safeColor} tonu` : 'Renk yapısı'} günlük şehir stilinde, ofis kombinlerinde ve katmanlı mevsim geçişi görünümlerinde rahatça kullanılabilecek kadar güçlü ve dengelidir.`
        ];
    }, [language, product, productAttributes, colorOptions, t]);
    const productDetailFacts = useMemo(() => {
        const material = getAttributeValue(productAttributes, ['Materyal', 'Material']) || (language === 'en' ? 'Soft textured fabric' : 'Yumuşak dokulu kumaş');
        const fit = getAttributeValue(productAttributes, ['Kalıp', 'Fit']) || (language === 'en' ? 'Regular fit' : 'Regular fit');

        if (language === 'en') {
            return [
                {label: 'Fabric feel', value: material},
                {label: 'Fit profile', value: fit},
                {label: 'Usage', value: 'Daily wear, office combinations and weekend styling'},
                {label: 'Season', value: 'Suitable for spring, summer and mild weather layering'}
            ];
        }

        return [
            {label: 'Kumaş hissi', value: material},
            {label: 'Kalıp yapısı', value: fit},
            {label: 'Kullanım alanı', value: 'Günlük kullanım, ofis kombinleri ve hafta sonu stili'},
            {label: 'Sezon uyumu', value: 'İlkbahar, yaz ve ılıman hava geçişlerinde rahat kullanım'}
        ];
    }, [language, productAttributes]);
    const galleryImages = useMemo(() => {
        const selectedColorImage = colorOptions.find((item) => resolveColorLabel(item) === selectedColor)?.image;
        const colorImages = colorOptions.map((item) => item.image);
        const pool = [selectedColorImage, product?.img, ...colorImages, ...(relatedProducts || []).slice(0, 5).map((item) => item.img)];
        return Array.from(new Set(pool.filter(Boolean)));
    }, [product, relatedProducts, colorOptions, selectedColor]);

    useEffect(() => {
        const imageForColor = colorOptions.find((item) => resolveColorLabel(item) === selectedColor)?.image;
        if (imageForColor) {
            setSelectedImage(imageForColor);
        }
    }, [selectedColor, colorOptions]);

    const increaseQuantity = () => setQuantity((prev) => Math.min(10, prev + 1));
    const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));
    const openGalleryLightbox = (imageUrl) => {
        const nextIndex = galleryImages.findIndex((item) => item === imageUrl);
        setGalleryLightboxIndex(nextIndex >= 0 ? nextIndex : 0);
        setIsGalleryLightboxOpen(true);
    };

    const openFeedbackSection = (mode) => {
        setActiveFeedbackMode(mode);
        window.setTimeout(() => {
            if (feedbackSectionRef.current) {
                feedbackSectionRef.current.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        }, 10);
    };

    const onFavoriteClick = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const next = await toggleFavorite({
            ...product,
            priceLabel: formatPrice(product?.price, locale),
            oldPriceLabel: formatPrice(product?.oldPrice, locale)
        });
        setFavorite(next);
    };

    const addToCart = (event) => {
        const selectedQuantity = Math.max(1, Number(quantity) || 1);
        CartService.addToCart({
            product,
            quantity: selectedQuantity,
            selectedSize,
            selectedColor
        });

        const clickTarget = event?.currentTarget || event?.target;
        if (clickTarget && typeof window !== 'undefined') {
            const rect = clickTarget.getBoundingClientRect();
            const startX = rect.left + (rect.width / 2);
            const startY = rect.top + (rect.height / 2);

            window.dispatchEvent(new CustomEvent('cart:add:fly', {
                detail: {
                    startX,
                    startY,
                    imageUrl: product?.img || ''
                }
            }));
        }

        setCartMessageVisible(true);
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(() => {
            setCartMessageVisible(false);
        }, 1800);
    };

    if (loading) {
        return <div className="product-empty-state">{t('productDetail.detailsLoading')}</div>;
    }

    if (!product) {
        return <div className="product-empty-state">{t('productDetail.notFound')}</div>;
    }

    if (isMobile) {
        return (
            <div className="product-detail-page product-detail-mobile-page">
                <section className="product-detail-mobile-gallery">
                    <ProductFavoriteButton
                        isFavorited={favorite}
                        onToggleFavorite={onFavoriteClick}
                        ariaLabel={favorite ? t('productCard.removeFavorite') : t('productCard.addFavorite')}
                        className="product-detail-favorite-toggle"
                    />
                    <button
                        type="button"
                        className="product-detail-mobile-hero-button"
                        onClick={() => openGalleryLightbox(selectedImage || product.img)}
                    >
                        <img src={selectedImage || product.img} alt={product.title} className="product-detail-mobile-hero"/>
                    </button>
                    <div className="product-detail-mobile-thumbs">
                        {galleryImages.map((imageUrl) => (
                            <button
                                key={imageUrl}
                                type="button"
                                className={`product-detail-mobile-thumb ${selectedImage === imageUrl ? 'is-active' : ''}`}
                                onClick={() => setSelectedImage(imageUrl)}
                                aria-label={t('productDetail.selectImageAria')}
                            >
                                <img src={imageUrl} alt={product.title}/>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="product-detail-mobile-summary">
                    <h1 className="product-detail-title-line">
                        <span className="product-detail-title-brand">{product.mark}</span>
                        <span className="product-detail-title-text">{product.title}</span>
                    </h1>

                    <div className="product-detail-rating-row">
                        <span className="product-detail-rating-average">{Number(product.rating || 0).toFixed(1)}</span>
                        <Rating value={product.rating} readOnly cancel={false}/>
                        <button
                            type="button"
                            className="detail-link-button product-detail-review-count"
                            onClick={() => openFeedbackSection('reviews')}
                        >
                            ({product.reviewCount || 0} {t('productDetail.reviewsLabel')})
                        </button>
                        <button
                            type="button"
                            className="detail-link-button"
                            onClick={() => openFeedbackSection('qa')}
                        >
                            {questionAnswers.length} {t('productDetail.qaLabel')}
                        </button>
                    </div>

                    <div className="product-detail-price-area">
                        <span className="detail-old-price">{formatPrice(product.oldPrice, locale)}</span>
                        <div className="detail-current-price">{formatPrice(product.price, locale)}</div>
                        {product.discountRate > 0 && <span className="detail-discount">{t('productDetail.discount', {count: product.discountRate})}</span>}
                    </div>

                    <div className="product-detail-badges">
                        {product.isFastDelivery && <span className="detail-badge fast">{t('productDetail.fastDelivery')}</span>}
                        {product.isFreeCargo && <span className="detail-badge cargo">{t('productDetail.freeCargo')}</span>}
                        <span className="detail-badge neutral">{product.installmentText}</span>
                    </div>

                    {sizeOptions.length > 0 && (
                        <div className="product-detail-size-block">
                            <div className="product-detail-size-head">
                                <span>{t('productDetail.size')}</span>
                                {selectedSize && <strong>{selectedSize}</strong>}
                            </div>
                            <div className="product-detail-size-options">
                                {sizeOptions.map((sizeItem) => (
                                    <button
                                        key={sizeItem}
                                        type="button"
                                        className={`product-detail-size-option ${selectedSize === sizeItem ? 'is-active' : ''}`}
                                        onClick={() => setSelectedSize(sizeItem)}
                                        aria-pressed={selectedSize === sizeItem}
                                    >
                                        {sizeItem}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {colorOptions.length > 0 && (
                        <div className="product-detail-color-block">
                            <div className="product-detail-size-head">
                                <span>{t('productDetail.color')}</span>
                                {selectedColor && <strong>{selectedColor}</strong>}
                            </div>
                            <div className="product-detail-color-options">
                                {colorOptions.map((colorItem) => (
                                    <button
                                        key={`${colorItem.name}-${colorItem.hex || ''}`}
                                        type="button"
                                        className={`product-detail-color-option ${selectedColor === resolveColorLabel(colorItem) ? 'is-active' : ''}`}
                                        onClick={() => setSelectedColor(resolveColorLabel(colorItem))}
                                        aria-label={`${t('productDetail.color')}: ${resolveColorLabel(colorItem)}`}
                                        aria-pressed={selectedColor === resolveColorLabel(colorItem)}
                                    >
                                        <span
                                            className="product-detail-color-dot"
                                            style={{backgroundColor: resolveColorHex(colorItem)}}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="product-detail-panel-grid product-detail-mobile-panels">
                        <div className="product-detail-panel-item">
                            <div className="panel-label">{t('productDetail.seller')}</div>
                            <div className="panel-value">{product.mark} {t('productDetail.sellerStoreSuffix')}</div>
                            <div className="panel-sub">{t('productDetail.sellerScore')}: {formatSellerScore(product.sellerScore)}</div>
                        </div>
                        <div className="product-detail-panel-item">
                            <div className="panel-label">{t('productDetail.estimatedDelivery')}</div>
                            <div className="panel-value">{buildDeliveryLabel(language, t)}</div>
                            <div className="panel-sub">{t('productDetail.allDeliveredNote')}</div>
                        </div>
                    </div>
                </section>

                <section className="product-detail-mobile-accordions">
                    <details className="product-detail-mobile-accordion" open>
                        <summary>{t('productDetail.productFeatures')}</summary>
                        <div className="product-detail-mobile-accordion-content">
                            <div className="product-detail-attributes-grid">
                                {productAttributes.map((attribute) => (
                                    <div key={`${attribute.label}-${attribute.value}`} className="product-detail-attribute-item">
                                        <span className="attribute-key">{attribute.label}</span>
                                        <span className="attribute-value">{attribute.value}</span>
                                    </div>
                                ))}
                            </div>
                            <ul className="product-detail-highlights">
                                {productHighlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </details>

                    <details className="product-detail-mobile-accordion" open>
                        <summary>{t('productDetail.summary')}</summary>
                        <div className="product-detail-mobile-accordion-content">
                            <p>{t('productDetail.summaryText', {title: product.title})}</p>
                        </div>
                    </details>

                    <details className="product-detail-mobile-accordion" open>
                        <summary>{t('productDetail.feedbackTitle')}</summary>
                        <div className="product-detail-mobile-accordion-content">
                            <ProductFeedbackPanel
                                product={product}
                                mode={activeFeedbackMode}
                                reviews={reviews}
                                questionAnswers={questionAnswers}
                                onModeChange={setActiveFeedbackMode}
                            />
                        </div>
                    </details>

                    <details className="product-detail-mobile-accordion" open>
                        <summary>{t('productDetail.related')}</summary>
                        <div className="product-detail-mobile-accordion-content">
                            {relatedProducts.length > 0 ? (
                                <Carousel
                                    value={relatedProducts}
                                    numVisible={2}
                                    numScroll={1}
                                    itemTemplate={(item) => relatedProductTemplate(item, locale)}
                                    circular
                                    showIndicators={false}
                                />
                            ) : (
                                <div className="product-empty-state">{t('productDetail.relatedEmpty')}</div>
                            )}
                        </div>
                    </details>
                </section>

                <div className="product-detail-mobile-action-bar">
                    <div className="product-detail-mobile-price">
                        <span className="mobile-price-label">{t('productDetail.discount', {count: product.discountRate || 0})}</span>
                        <strong>{formatPrice(product.price, locale)}</strong>
                        <small>{buildDeliveryLabel(language, t)}</small>
                    </div>
                <button type="button" className="product-detail-mobile-add-button" onClick={addToCart}>
                    {t('productDetail.addToCart')}
                </button>
            </div>

                {isGalleryLightboxOpen && (
                    <ImageLightbox
                        items={galleryImages.map((src) => ({src}))}
                        initialIndex={galleryLightboxIndex}
                        onClose={() => setIsGalleryLightboxOpen(false)}
                        getAlt={() => product.title}
                        labels={{
                            prev: t('common.previousSlide'),
                            next: t('common.nextSlide'),
                            close: t('common.close'),
                            zoomIn: t('feedback.zoomIn'),
                            zoomOut: t('feedback.zoomOut'),
                            resetZoom: t('feedback.resetZoom')
                        }}
                        showMeta={false}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="product-detail-page">
            <div className="product-detail-main">
                <div className="product-detail-gallery">
                    <ProductFavoriteButton
                        isFavorited={favorite}
                        onToggleFavorite={onFavoriteClick}
                        ariaLabel={favorite ? t('productCard.removeFavorite') : t('productCard.addFavorite')}
                        className="product-detail-favorite-toggle"
                    />
                    <button
                        type="button"
                        className="product-detail-image-button"
                        onClick={() => openGalleryLightbox(selectedImage || product.img)}
                    >
                        <img src={selectedImage || product.img} alt={product.title} className="product-detail-image"/>
                    </button>
                    <div className="product-detail-thumbs">
                        {galleryImages.map((imageUrl) => (
                            <button
                                key={imageUrl}
                                type="button"
                                className={`product-detail-thumb ${selectedImage === imageUrl ? 'is-active' : ''}`}
                                onClick={() => setSelectedImage(imageUrl)}
                                aria-label={t('productDetail.selectImageAria')}
                            >
                                <img src={imageUrl} alt={product.title}/>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="product-detail-info">
                    <div className="product-detail-breadcrumb">
                        <a href="/">{t('productDetail.home')}</a>
                        <span>/</span>
                        <a href={`/product/${categoryKey}`}>{parentCategoryLabel}</a>
                        <span>/</span>
                        <span>{product.title}</span>
                    </div>

                    <h1 className="product-detail-title-line">
                        <span className="product-detail-title-brand">{product.mark}</span>
                        <span className="product-detail-title-text">{product.title}</span>
                    </h1>

                    <div className="product-detail-rating-row">
                        <span className="product-detail-rating-average">{Number(product.rating || 0).toFixed(1)}</span>
                        <Rating value={product.rating} readOnly cancel={false}/>
                        <button
                            type="button"
                            className="detail-link-button product-detail-review-count"
                            onClick={() => openFeedbackSection('reviews')}
                        >
                            ({product.reviewCount || 0} {t('productDetail.reviewsLabel')}
                            <span className="detail-photo-review-inline" aria-label={t('productDetail.photoReviewsAria', {count: photoReviewCount})}>
                                <i className="pi pi-camera"/>
                                <span>{photoReviewCount}</span>
                            </span>
                            )
                        </button>
                        <button
                            type="button"
                            className="detail-link-button"
                            onClick={() => openFeedbackSection('qa')}
                        >
                            {questionAnswers.length} {t('productDetail.qaLabel')}
                        </button>
                    </div>

                    <div className="product-detail-price-area">
                        <span className="detail-old-price">{formatPrice(product.oldPrice, locale)}</span>
                        <div className="detail-current-price">{formatPrice(product.price, locale)}</div>
                        {product.discountRate > 0 && <span className="detail-discount">{t('productDetail.discount', {count: product.discountRate})}</span>}
                    </div>

                    <div className="product-detail-badges">
                        {product.isFastDelivery && <span className="detail-badge fast">{t('productDetail.fastDelivery')}</span>}
                        {product.isFreeCargo && <span className="detail-badge cargo">{t('productDetail.freeCargo')}</span>}
                        <span className="detail-badge neutral">{product.installmentText}</span>
                    </div>

                    {sizeOptions.length > 0 && (
                        <div className="product-detail-size-block">
                            <div className="product-detail-size-head">
                                <span>{t('productDetail.size')}</span>
                                {selectedSize && <strong>{selectedSize}</strong>}
                            </div>
                            <div className="product-detail-size-options">
                                {sizeOptions.map((sizeItem) => (
                                    <button
                                        key={sizeItem}
                                        type="button"
                                        className={`product-detail-size-option ${selectedSize === sizeItem ? 'is-active' : ''}`}
                                        onClick={() => setSelectedSize(sizeItem)}
                                        aria-pressed={selectedSize === sizeItem}
                                    >
                                        {sizeItem}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {colorOptions.length > 0 && (
                        <div className="product-detail-color-block">
                            <div className="product-detail-size-head">
                                <span>{t('productDetail.color')}</span>
                                {selectedColor && <strong>{selectedColor}</strong>}
                            </div>
                            <div className="product-detail-color-options">
                                {colorOptions.map((colorItem) => (
                                    <button
                                        key={`${colorItem.name}-${colorItem.hex || ''}`}
                                        type="button"
                                        className={`product-detail-color-option ${selectedColor === resolveColorLabel(colorItem) ? 'is-active' : ''}`}
                                        onClick={() => setSelectedColor(resolveColorLabel(colorItem))}
                                        aria-label={`${t('productDetail.color')}: ${resolveColorLabel(colorItem)}`}
                                        aria-pressed={selectedColor === resolveColorLabel(colorItem)}
                                    >
                                        <span
                                            className="product-detail-color-dot"
                                            style={{backgroundColor: resolveColorHex(colorItem)}}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="product-detail-panel-grid">
                    <div className="product-detail-panel-item">
                            <div className="panel-label">{t('productDetail.seller')}</div>
                            <div className="panel-value">{product.mark} {t('productDetail.sellerStoreSuffix')}</div>
                            <div className="panel-sub">{t('productDetail.sellerScore')}: {formatSellerScore(product.sellerScore)}</div>
                        </div>

                        <div className="product-detail-panel-item">
                            <div className="panel-label">{t('productDetail.estimatedDelivery')}</div>
                            <div className="panel-value">{buildDeliveryLabel(language, t)}</div>
                            <div className="panel-sub">{t('productDetail.allDeliveredNote')}</div>
                        </div>
                    </div>

                    <div className="product-detail-cart-row">
                        <div className="product-detail-qty-selector">
                            <button type="button" onClick={decreaseQuantity} aria-label={t('productDetail.qtyDecrease')}>-</button>
                            <span>{quantity}</span>
                            <button type="button" onClick={increaseQuantity} aria-label={t('productDetail.qtyIncrease')}>+</button>
                        </div>

                        <Button
                            label={t('productDetail.addToCart')}
                            icon="pi pi-shopping-cart"
                            className="detail-add-cart-button"
                            onClick={addToCart}
                        />
                    </div>

                    {cartMessageVisible && <div className="detail-cart-feedback">{t('productDetail.addedToCart')}</div>}

                    <section className="product-detail-features-block is-inline">
                        <h2>{t('productDetail.productFeatures')}</h2>
                        <div className="product-detail-attributes-grid">
                            {productAttributes.map((attribute) => (
                                <div key={`${attribute.label}-${attribute.value}`} className="product-detail-attribute-item">
                                    <span className="attribute-key">{attribute.label}</span>
                                    <span className="attribute-value">{attribute.value}</span>
                                </div>
                            ))}
                            {productDetailFacts.map((attribute) => (
                                <div key={`${attribute.label}-${attribute.value}`} className="product-detail-attribute-item is-rich">
                                    <span className="attribute-key">{attribute.label}</span>
                                    <span className="attribute-value">{attribute.value}</span>
                                </div>
                            ))}
                        </div>
                        <ul className="product-detail-highlights">
                            {productHighlights.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </section>
                </div>

                <aside className="product-detail-side">
                    <div className="product-detail-side-card">
                        <h3>{t('productDetail.promoTitle')}</h3>
                        <a href="/" className="side-link-row">
                            <span>{t('productDetail.promoFreeCargo')}</span>
                            <i className="pi pi-angle-right"/>
                        </a>
                        <a href="/" className="side-link-row">
                            <span>{t('productDetail.promoOffer')}</span>
                            <i className="pi pi-angle-right"/>
                        </a>
                    </div>

                    <div className="product-detail-side-card">
                        <h3>{t('productDetail.seller')}</h3>
                        <div className="side-seller-row">
                            <strong>{product.mark}</strong>
                            <span className="seller-score-chip">{formatSellerScore(product.sellerScore)}</span>
                        </div>
                        <div className="side-muted-line">{buildDeliveryLabel(language, t)}</div>
                        <button type="button" className="side-outline-button">{t('productDetail.storeButton')}</button>
                    </div>
                </aside>

            </div>

            <section className="product-detail-features-block desktop-hidden">
                <h2>{t('productDetail.productFeatures')}</h2>
                <div className="product-detail-attributes-grid">
                    {productAttributes.map((attribute) => (
                        <div key={`${attribute.label}-${attribute.value}`} className="product-detail-attribute-item">
                            <span className="attribute-key">{attribute.label}</span>
                            <span className="attribute-value">{attribute.value}</span>
                        </div>
                    ))}
                </div>
                <ul className="product-detail-highlights">
                    {productHighlights.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </section>

            <div className="product-detail-mobile-action-bar">
                <div className="product-detail-mobile-price">
                    <span className="mobile-price-label">{t('productDetail.discount', {count: product.discountRate || 0})}</span>
                    <strong>{formatPrice(product.price, locale)}</strong>
                    <small>{buildDeliveryLabel(language, t)}</small>
                </div>
                <button type="button" className="product-detail-mobile-add-button" onClick={addToCart}>
                    {t('productDetail.addToCart')}
                </button>
            </div>

            <section className="product-detail-section product-detail-summary-section">
                <h2>{t('productDetail.summary')}</h2>
                <div className="product-detail-summary-layout">
                    <div className="product-detail-summary-card is-wide">
                        <p>{productSummaryParagraphs[0]}</p>
                        <ul className="product-detail-summary-points">
                            {productSummaryParagraphs.slice(1).map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section ref={feedbackSectionRef} className="product-detail-section product-detail-feedback-section">
                <h2>{t('productDetail.feedbackTitle')}</h2>
                <ProductFeedbackPanel
                    product={product}
                    mode={activeFeedbackMode}
                    reviews={reviews}
                    questionAnswers={questionAnswers}
                    onModeChange={setActiveFeedbackMode}
                />
            </section>

            <section className="product-detail-section product-detail-related-section">
                <h2>{t('productDetail.related')}</h2>
                {relatedProducts.length > 0 ? (
                    <Carousel
                        value={relatedProducts}
                        numVisible={4}
                        numScroll={2}
                        responsiveOptions={[
                            {breakpoint: '1280px', numVisible: 3, numScroll: 1},
                            {breakpoint: '920px', numVisible: 2, numScroll: 1},
                            {breakpoint: '640px', numVisible: 1, numScroll: 1}
                        ]}
                        itemTemplate={(item) => relatedProductTemplate(item, locale)}
                        circular
                        showIndicators={false}
                    />
                ) : (
                    <div className="product-empty-state">{t('productDetail.relatedEmpty')}</div>
                )}
            </section>

            {isGalleryLightboxOpen && (
                <ImageLightbox
                    items={galleryImages.map((src) => ({src}))}
                    initialIndex={galleryLightboxIndex}
                    onClose={() => setIsGalleryLightboxOpen(false)}
                    getAlt={() => product.title}
                    labels={{
                        prev: t('common.previousSlide'),
                        next: t('common.nextSlide'),
                        close: t('common.close'),
                        zoomIn: t('feedback.zoomIn'),
                        zoomOut: t('feedback.zoomOut'),
                        resetZoom: t('feedback.resetZoom')
                    }}
                    showMeta={false}
                />
            )}
        </div>
    );
};
