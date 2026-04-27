import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {useHistory, useLocation} from "react-router-dom";
import 'primeicons/primeicons.css';
import AppContext from "./AppContext";
import PromoService from "./service/PromoService";
import {USE_STATIC_PROMO_IMAGES} from "./constants/UrlConstans";
import {getParentCategoryIdBySlug, MEGA_MENU_CATEGORIES} from "./data/demoProductData";
import {supportedLanguages} from "./i18n/i18n";

const megaMenuCategories = MEGA_MENU_CATEGORIES;
const CATEGORY_LABEL_TRANSLATIONS = {
    kadin: {tr: 'Kadın', en: 'Women'},
    erkek: {tr: 'Erkek', en: 'Men'},
    cocuk: {tr: 'Çocuk', en: 'Kids'},
    ayakkabi: {tr: 'Ayakkabı', en: 'Shoes'},
    aksesuar: {tr: 'Aksesuar', en: 'Accessories'},
    'spor-giyim': {tr: 'Spor Giyim', en: 'Sportswear'}
};
const SUBCATEGORY_LABEL_TRANSLATIONS = {
    elbise: {tr: 'Elbise', en: 'Dress'},
    tisort: {tr: 'Tişört', en: 'T-Shirt'},
    gomlek: {tr: 'Gömlek', en: 'Shirt'},
    pantolon: {tr: 'Pantolon', en: 'Pants'},
    ceket: {tr: 'Ceket', en: 'Jacket'},
    triko: {tr: 'Triko', en: 'Knitwear'},
    'erkek-tisort': {tr: 'Tişört', en: 'T-Shirt'},
    'erkek-gomlek': {tr: 'Gömlek', en: 'Shirt'},
    jean: {tr: 'Jean', en: 'Jeans'},
    'erkek-pantolon': {tr: 'Pantolon', en: 'Pants'},
    sweatshirt: {tr: 'Sweatshirt', en: 'Sweatshirt'},
    mont: {tr: 'Mont', en: 'Coat'},
    'kiz-cocuk': {tr: 'Kız Çocuk', en: 'Girls'},
    'erkek-cocuk': {tr: 'Erkek Çocuk', en: 'Boys'},
    'bebek-giyim': {tr: 'Bebek Giyim', en: 'Baby Clothing'},
    'okul-kombinleri': {tr: 'Okul Kombinleri', en: 'School Outfits'},
    sneaker: {tr: 'Sneaker', en: 'Sneakers'},
    bot: {tr: 'Bot', en: 'Boots'},
    'topuklu-ayakkabi': {tr: 'Topuklu Ayakkabı', en: 'Heels'},
    loafer: {tr: 'Loafer', en: 'Loafers'},
    sandalet: {tr: 'Sandalet', en: 'Sandals'},
    canta: {tr: 'Çanta', en: 'Bag'},
    kemer: {tr: 'Kemer', en: 'Belt'},
    cuzdan: {tr: 'Cüzdan', en: 'Wallet'},
    taki: {tr: 'Takı', en: 'Jewelry'},
    sapka: {tr: 'Şapka', en: 'Hat'},
    esofman: {tr: 'Eşofman', en: 'Tracksuit'},
    tayt: {tr: 'Tayt', en: 'Leggings'},
    'spor-sutyeni': {tr: 'Spor Sütyeni', en: 'Sports Bra'},
    hoodie: {tr: 'Hoodie', en: 'Hoodie'},
    'kosu-urunleri': {tr: 'Koşu Ürünleri', en: 'Running Products'}
};

const staticMegaMenuPromoImages = [
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2200&q=86",
    "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=2200&q=86"
];

const mobileSearchPreviewProducts = [
    {
        id: 'gomlek-3',
        mark: 'Mavi',
        title: 'Premium Dokulu Oversize Gömlek',
        priceLabel: '1.249 TL',
        img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 'elbise-4',
        mark: 'Nocturne',
        title: 'Modern Kesim Midi Elbise',
        priceLabel: '1.799 TL',
        img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 'sneaker-2',
        mark: 'Lufian',
        title: 'Günlük Sneaker Koleksiyonu',
        priceLabel: '2.149 TL',
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
    }
];

export const AppTopBar = () => {
    const history = useHistory();
    const location = useLocation();
    const myContext = useContext(AppContext);
    const t = myContext?.t || ((key) => key);
    const language = myContext?.language || 'tr';
    const isMobile = Boolean(myContext?.isMobile);
    const closeTimerRef = useRef(null);
    const profileMenuCloseTimerRef = useRef(null);
    const cartButtonAnchorRef = useRef(null);
    const cartBounceTimerRef = useRef(null);
    const lastCartCountRef = useRef(0);
    const mobileTopBarRef = useRef(null);

    const [userFullName, setUserFullName] = useState('');
    const [activeMegaCategoryId, setActiveMegaCategoryId] = useState(megaMenuCategories[0].id);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [promoImages, setPromoImages] = useState(staticMegaMenuPromoImages);
    const [promoImageIndex, setPromoImageIndex] = useState(0);
    const [isCartBadgeBouncing, setIsCartBadgeBouncing] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileSearchValue, setMobileSearchValue] = useState('');
    const [desktopSearchValue, setDesktopSearchValue] = useState('');
    const [isMobileCategoryStripVisible, setIsMobileCategoryStripVisible] = useState(true);
    const isHomeRoute = (location?.pathname || '') === '/';

    useEffect(() => {
        const path = location?.pathname || '';
        if (!path.startsWith('/product/')) {
            return;
        }

        const slug = decodeURIComponent(path.replace('/product/', '')).trim().toLowerCase();
        if (!slug) {
            return;
        }

        const parentId = getParentCategoryIdBySlug(slug);
        if (parentId) {
            setActiveMegaCategoryId(parentId);
        }
    }, [location]);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            const storedUserStr = localStorage.getItem('user');
            const user = storedUserStr ? JSON.parse(storedUserStr) : null;
            if (user) {
                setUserFullName(`${user.name || ''} ${user.surname || ''}`.trim());
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
            if (profileMenuCloseTimerRef.current) {
                clearTimeout(profileMenuCloseTimerRef.current);
            }
            if (cartBounceTimerRef.current) {
                clearTimeout(cartBounceTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isMobileSearchOpen && !isMobileMenuOpen) {
            return undefined;
        }

        const currentOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = currentOverflow;
        };
    }, [isMobileSearchOpen, isMobileMenuOpen]);

    useEffect(() => {
        const currentQuery = new URLSearchParams(location.search).get('q') || '';
        setMobileSearchValue(currentQuery);
        setDesktopSearchValue(currentQuery);
    }, [location.search]);

    useEffect(() => {
        if (!isMobile) {
            document.documentElement.style.removeProperty('--mobile-topbar-offset');
            return undefined;
        }

        const element = mobileTopBarRef.current;
        if (!element) {
            return undefined;
        }

        const updateTopBarOffset = () => {
            const nextHeight = Math.ceil(element.getBoundingClientRect().height || 0);
            document.documentElement.style.setProperty('--mobile-topbar-offset', `${nextHeight}px`);
        };

        updateTopBarOffset();

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => updateTopBarOffset())
            : null;

        if (resizeObserver) {
            resizeObserver.observe(element);
        }

        window.addEventListener('resize', updateTopBarOffset, {passive: true});

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', updateTopBarOffset);
        };
    }, [isMobile, isHomeRoute, isMobileCategoryStripVisible, isMobileSearchOpen, location.pathname]);

    useEffect(() => {
        if (!isMobile || !isHomeRoute || isMobileSearchOpen) {
            setIsMobileCategoryStripVisible(true);
            return undefined;
        }

        let lastScrollY = window.scrollY || 0;

        const handleScroll = () => {
            const currentScrollY = window.scrollY || 0;
            const delta = currentScrollY - lastScrollY;

            if (currentScrollY <= 12) {
                setIsMobileCategoryStripVisible(true);
                lastScrollY = currentScrollY;
                return;
            }

            if (delta > 8 && currentScrollY > 72) {
                setIsMobileCategoryStripVisible(false);
            } else if (delta < -5) {
                setIsMobileCategoryStripVisible(true);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, {passive: true});

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isHomeRoute, isMobile, isMobileSearchOpen]);

    useEffect(() => {
        if (USE_STATIC_PROMO_IMAGES) {
            setPromoImages(staticMegaMenuPromoImages);
            return;
        }

        PromoService.getPromoImages().then((imageUrls) => {
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                setPromoImages(imageUrls);
                setPromoImageIndex(0);
            } else {
                setPromoImages(staticMegaMenuPromoImages);
            }
        });
    }, []);

    useEffect(() => {
        if (!isMegaMenuOpen || !promoImages || promoImages.length <= 1) {
            return;
        }

        const intervalId = setInterval(() => {
            setPromoImageIndex((prev) => (prev + 1) % promoImages.length);
        }, 3200);

        return () => clearInterval(intervalId);
    }, [promoImages, isMegaMenuOpen]);

    const topMenuItems = [
        {
            id: 1,
            value: t('topbar.campaigns'),
            to: '/'
        },
        {
            id: 2,
            value: t('topbar.orders'),
            to: '/hesabım/Siparislerim'
        },
        {
            id: 3,
            value: t('topbar.about'),
            to: '/'
        },
        {
            id: 4,
            value: t('topbar.newSeason'),
            to: '/'
        }
    ];

    const profileToolItem = [
        {
            id: 1,
            name: t('topbar.profileAccount'),
            icon: 'pi pi-user',
            to: '/hesabım/KullaniciBilgilerim?section=user-info'
        },
        {
            id: 2,
            name: t('topbar.profileOrders'),
            icon: 'pi pi-box',
            to: '/hesabım/KullaniciBilgilerim?section=orders'
        },
        {
            id: 3,
            name: t('topbar.profileAddresses'),
            icon: 'pi pi-map',
            to: '/hesabım/KullaniciBilgilerim?section=address'
        },
        {
            id: 4,
            name: t('topbar.profileReviews'),
            icon: 'pi pi-comment',
            to: '/hesabım/KullaniciBilgilerim?section=reviews'
        },
        {
            id: 5,
            name: t('topbar.profileMessages'),
            icon: 'pi pi-envelope',
            to: '/hesabım/KullaniciBilgilerim?section=seller-messages'
        }
    ];
    const localizedMegaMenuCategories = megaMenuCategories.map((category) => ({
        ...category,
        label: CATEGORY_LABEL_TRANSLATIONS[category.id]?.[language] || category.label,
        items: category.items.map((item) => ({
            ...item,
            label: SUBCATEGORY_LABEL_TRANSLATIONS[item.slug]?.[language] || item.label
        }))
    }));

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const openMegaMenu = (categoryId) => {
        clearCloseTimer();
        setActiveMegaCategoryId(categoryId);
        setIsMegaMenuOpen(true);
    };

    const scheduleCloseMegaMenu = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsMegaMenuOpen(false);
        }, 180);
    };

    const handleMegaMenuBlur = (event) => {
        const nextFocused = event.relatedTarget;
        if (!event.currentTarget.contains(nextFocused)) {
            scheduleCloseMegaMenu();
        }
    };

    const clearProfileMenuCloseTimer = () => {
        if (profileMenuCloseTimerRef.current) {
            clearTimeout(profileMenuCloseTimerRef.current);
            profileMenuCloseTimerRef.current = null;
        }
    };

    const openProfileMenu = () => {
        if (!localStorage.getItem('token')) {
            return;
        }
        clearProfileMenuCloseTimer();
        setIsProfileMenuOpen(true);
    };

    const scheduleCloseProfileMenu = () => {
        clearProfileMenuCloseTimer();
        profileMenuCloseTimerRef.current = setTimeout(() => {
            setIsProfileMenuOpen(false);
        }, 160);
    };

    const handleProfileMenuBlur = (event) => {
        const nextFocused = event.relatedTarget;
        if (!event.currentTarget.contains(nextFocused)) {
            scheduleCloseProfileMenu();
        }
    };

    const clickLoginButton = () => {
        if (!localStorage.getItem('token')) {
            history.push('/login');
        } else {
            history.push('/hesabım/KullaniciBilgilerim');
        }
    };

    const clickBoxButton = () => {
        history.push('/sepetim');
    };

    const clickFavoriteButton = () => {
        if (!localStorage.getItem('token')) {
            history.push('/login');
            return;
        }

        history.push('/favoriler');
    };

    const executeSearch = useCallback((rawValue) => {
        const query = String(rawValue || '').trim();
        if (!query) {
            return;
        }

        setMobileSearchValue(query);
        setDesktopSearchValue(query);
        setIsMobileSearchOpen(false);
        history.push(`/arama?q=${encodeURIComponent(query)}`);
    }, [history]);

    const topMenuItemBody = () => {
        return topMenuItems.map((x) => {
            return (
                <a key={x.id} href={x.to}>{x.value}</a>
            );
        });
    };

    const getLoginButtonLabel = () => {
        if (localStorage.getItem('token')) {
            return (
                <Button
                    onClick={clickLoginButton}
                    onFocus={openProfileMenu}
                    icon="pi pi-user"
                    label={t('topbar.account')}
                    className="session-in top-bar-login-button p-button-text top-bar-button p-button-secondary p-button-outlined mr-3 mb-2"
                />
            );
        }

        return (
            <Button
                onClick={clickLoginButton}
                icon="pi pi-user"
                label={t('topbar.login')}
                className="session-out top-bar-login-button p-button-text top-bar-button p-button-secondary p-button-outlined mr-3 mb-2"
            />
        );
    };

    const profileActionList = () => {
        const token = localStorage.getItem('token');
        if (token) {
            return profileToolItem.map((x) => {
                return (
                    <a key={x.id} className="account-dropdown-item" href={x.to}>
                        <i className={x.icon} style={{fontWeight: 'bold'}}/>
                        <span>{x.name}</span>
                    </a>
                );
            });
        }
        return null;
    };

    const logoutButtonBody = () => {
        if (localStorage.getItem('token')) {
            return (
                <button type="button" className="account-dropdown-item is-logout" onClick={logOutClick}>
                    <i className="pi pi-sign-out" style={{fontWeight: 'bold'}}/>
                    <span>{t('topbar.logout')}</span>
                </button>
            );
        }
        return null;
    };

    const logOutClick = () => {
        localStorage.clear();
        window.location.reload();
    };

    const cartCount = Number(myContext?.orderCount || 0);
    const cartBadgeLabel = cartCount > 99 ? '99+' : String(cartCount);

    const triggerCartBounce = useCallback(() => {
        setIsCartBadgeBouncing(false);
        window.requestAnimationFrame(() => {
            setIsCartBadgeBouncing(true);
            if (cartBounceTimerRef.current) {
                clearTimeout(cartBounceTimerRef.current);
            }
            cartBounceTimerRef.current = setTimeout(() => {
                setIsCartBadgeBouncing(false);
            }, 760);
        });
    }, []);

    const playFlyToCartAnimation = useCallback(({startX, startY, imageUrl}) => {
        const anchor = cartButtonAnchorRef.current;
        if (!anchor || typeof startX !== 'number' || typeof startY !== 'number') {
            triggerCartBounce();
            return;
        }

        const iconEl = anchor.querySelector('.top-cart-icon-wrap') || anchor.querySelector('.p-button-icon') || anchor;
        const iconRect = iconEl.getBoundingClientRect();
        const endX = iconRect.left + (iconRect.width / 2);
        const endY = iconRect.top + (iconRect.height / 2);

        const flyEl = document.createElement('div');
        flyEl.className = 'cart-fly-item';
        flyEl.style.left = `${startX - 18}px`;
        flyEl.style.top = `${startY - 18}px`;
        flyEl.style.setProperty('--fly-x', `${endX - startX}px`);
        flyEl.style.setProperty('--fly-y', `${endY - startY}px`);
        if (imageUrl) {
            flyEl.style.backgroundImage = `url('${imageUrl}')`;
            flyEl.classList.add('has-image');
        }

        document.body.appendChild(flyEl);

        window.requestAnimationFrame(() => {
            flyEl.classList.add('is-animating');
        });

        window.setTimeout(() => {
            if (flyEl.parentNode) {
                flyEl.parentNode.removeChild(flyEl);
            }
            triggerCartBounce();
        }, 760);
    }, [triggerCartBounce]);

    useEffect(() => {
        const hasIncreased = cartCount > Number(lastCartCountRef.current || 0);
        if (hasIncreased) {
            triggerCartBounce();
        }
        lastCartCountRef.current = cartCount;
    }, [cartCount, triggerCartBounce]);

    useEffect(() => {
        const handleCartFly = (event) => {
            const detail = event?.detail || {};
            playFlyToCartAnimation({
                startX: Number(detail.startX),
                startY: Number(detail.startY),
                imageUrl: detail.imageUrl || ''
            });
        };

        window.addEventListener('cart:add:fly', handleCartFly);
        return () => window.removeEventListener('cart:add:fly', handleCartFly);
    }, [playFlyToCartAnimation]);

    const activeCategory = localizedMegaMenuCategories.find((category) => category.id === activeMegaCategoryId) || localizedMegaMenuCategories[0];
    const orderedMegaMenuCategories = [
        activeCategory,
        ...localizedMegaMenuCategories.filter((category) => category.id !== activeCategory.id)
    ];
    const popularSearches = [
        'Elbise',
        'Sneaker',
        'Basic Tişört',
        'Oversize Gömlek',
        'Ceket',
        'Çanta'
    ];

    if (isMobile) {
        return (
            <div ref={mobileTopBarRef} className={`top-bar top-bar-mobile ${isHomeRoute ? 'is-home-route' : 'is-inner-route'}`}>
                <div className="top-bar-mobile-head">
                    <a href="/" className={`top-bar-mobile-logo ${isHomeRoute ? 'top-bar-mobile-logo-home' : 'top-bar-mobile-logo-inner'}`}>TREND BURADA</a>
                    <div className="top-bar-mobile-icons">
                        <button
                            type="button"
                            className="top-bar-mobile-icon-button"
                            onClick={clickLoginButton}
                            aria-label={localStorage.getItem('token') ? t('topbar.account') : t('topbar.login')}
                        >
                            <i className="pi pi-user"/>
                        </button>
                        <button
                            type="button"
                            className="top-bar-mobile-icon-button"
                            onClick={clickFavoriteButton}
                            aria-label={t('topbar.favorites')}
                        >
                            <i className="pi pi-heart"/>
                        </button>
                        <button
                            type="button"
                            ref={cartButtonAnchorRef}
                            className="top-bar-mobile-icon-button top-bar-mobile-cart"
                            onClick={clickBoxButton}
                            aria-label={t('topbar.cartAria', {count: cartCount})}
                        >
                            <i className="pi pi-shopping-cart"/>
                            {cartCount > 0 && (
                                <span className={`top-cart-count-badge ${isCartBadgeBouncing ? 'is-bouncing' : ''}`}>
                                    {cartBadgeLabel}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="top-bar-mobile-search">
                    <div className={`top-bar-mobile-search-row ${isHomeRoute ? 'is-home' : 'is-inner'}`}>
                        <button
                            type="button"
                            className="top-bar-mobile-menu-button is-inline"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label={t('topbar.categoriesAria')}
                        >
                            <i className="pi pi-bars"/>
                        </button>

                        {!isHomeRoute && (
                            <button
                                type="button"
                                className="top-bar-mobile-back"
                                onClick={() => {
                                    if (window.history.length > 1) {
                                        history.goBack();
                                    } else {
                                        history.push('/');
                                    }
                                }}
                                aria-label={t('common.back')}
                            >
                                <i className="pi pi-angle-left"/>
                            </button>
                        )}

                        <button
                            type="button"
                            className={`top-bar-mobile-search-trigger ${isHomeRoute ? 'is-home' : 'is-inner'}`}
                            onClick={() => setIsMobileSearchOpen(true)}
                        >
                            <i className="pi pi-search"/>
                            <span>{t('topbar.searchPlaceholder')}</span>
                        </button>
                    </div>
                </div>

                {isMobileSearchOpen && (
                    <div className="mobile-search-overlay" onClick={() => setIsMobileSearchOpen(false)}>
                        <div className="mobile-search-sheet" onClick={(event) => event.stopPropagation()}>
                            <div className="mobile-search-top-row">
                                <button
                                    type="button"
                                    className="mobile-search-back"
                                    onClick={() => setIsMobileSearchOpen(false)}
                                    aria-label={t('common.back')}
                                >
                                    <i className="pi pi-angle-left"/>
                                </button>
                                <div className="mobile-search-input-shell">
                                    <i className="pi pi-search"/>
                                    <InputText
                                        autoFocus
                                        value={mobileSearchValue}
                                        onChange={(event) => setMobileSearchValue(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                executeSearch(mobileSearchValue);
                                            }
                                        }}
                                        className="mobile-search-input"
                                        placeholder={t('topbar.searchPlaceholder')}
                                    />
                                </div>
                            </div>

                            <div className="mobile-search-popular">
                                <span className="mobile-search-popular-title">{t('topbar.popularSearches')}</span>
                                <div className="mobile-search-chip-list">
                                    {popularSearches.map((item, index) => (
                                        <button
                                            key={item}
                                            type="button"
                                            className="mobile-search-chip"
                                            onClick={() => executeSearch(item)}
                                        >
                                            {index < 3 && (
                                                <span className="mobile-search-flame" aria-hidden="true">
                                                    <span className="mobile-search-flame-core"/>
                                                </span>
                                            )}
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mobile-search-preview">
                                <span className="mobile-search-popular-title">{t('topbar.searchSuggestions')}</span>
                                <div className="mobile-search-product-list">
                                    {mobileSearchPreviewProducts.map((item) => (
                                        <a key={item.id} href={`/detail/${item.routeId || item.productCode || item.id}`} className="mobile-search-product-card">
                                            <div className="mobile-search-product-media">
                                                <img src={item.img} alt={item.title} loading="lazy" decoding="async"/>
                                            </div>
                                            <div className="mobile-search-product-content">
                                                <strong>{item.mark}</strong>
                                                <span>{item.title}</span>
                                                <b>{item.priceLabel}</b>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isMobileMenuOpen && (
                    <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
                            <div className="mobile-menu-head">
                                <strong>{t('topbar.categoriesAria')}</strong>
                                <button
                                    type="button"
                                    className="mobile-menu-close"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    aria-label={t('common.close')}
                                >
                                    <i className="pi pi-times"/>
                                </button>
                            </div>

                            <div className="mobile-menu-body">
                                <aside className="mobile-menu-category-rail">
                                    {localizedMegaMenuCategories.map((category) => {
                                        const isActive = category.id === activeMegaCategoryId;
                                        return (
                                            <button
                                                key={category.id}
                                                type="button"
                                                className={`mobile-menu-category-tab ${isActive ? 'is-active' : ''}`}
                                                onClick={() => setActiveMegaCategoryId(category.id)}
                                            >
                                                {category.label}
                                            </button>
                                        );
                                    })}
                                </aside>

                                <div className="mobile-menu-content">
                                    <div className="mobile-menu-header">
                                        <span className="mobile-menu-label">{activeCategory.label} {t('topbar.collectionSuffix')}</span>
                                        <a
                                            href={`/product/${encodeURIComponent(activeCategory.items?.[0]?.slug || activeCategory.id)}`}
                                            className="mobile-menu-view-all"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {t('topbar.viewAll')}
                                        </a>
                                    </div>

                                    <div className="mobile-menu-links">
                                        {activeCategory.items.map((subCategory) => (
                                            <a
                                                key={subCategory.slug}
                                                href={`/product/${encodeURIComponent(subCategory.slug)}`}
                                                className="mobile-menu-link"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <span>{subCategory.label}</span>
                                                <i className="pi pi-angle-right" aria-hidden="true"/>
                                            </a>
                                        ))}
                                    </div>

                                    <div className="mobile-menu-promo">
                                        <div className="mobile-menu-promo-image-wrapper">
                                            <img
                                                className="mobile-menu-promo-image"
                                                src={promoImages[promoImageIndex]}
                                                alt={t('topbar.promoImageAlt')}
                                                loading="eager"
                                                decoding="async"
                                            />
                                        </div>
                                        <span className="mobile-menu-promo-badge">{t('topbar.promoBadge')}</span>
                                        <h4>{t('topbar.promoTitle')}</h4>
                                        <p>{t('topbar.promoText')}</p>
                                        <a href="/" className="mobile-menu-promo-cta" onClick={() => setIsMobileMenuOpen(false)}>
                                            {t('topbar.promoCta')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="top-bar">
            <div className="top-bar-items">
                <div className="top-menu">
                    <ul>{topMenuItemBody()}</ul>
                    <div className="language-switcher" role="group" aria-label={t('topbar.language')}>
                        <i className="pi pi-globe" aria-hidden="true"/>
                        {supportedLanguages.map((lang) => (
                            <button
                                key={lang.value}
                                type="button"
                                className={`language-switcher-btn ${myContext?.language === lang.value ? 'is-active' : ''}`}
                                onClick={() => myContext?.setLanguage && myContext.setLanguage(lang.value)}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="top-bar-item">
                    <div className="top-bar-search">
                        <div className="top-bar-logo">
                            <span><a href="/">TREND BURADA</a></span>
                        </div>
                        <div className="top-bar-actions">
                            <div
                                className="account-menu-wrapper"
                                onMouseEnter={openProfileMenu}
                                onMouseLeave={scheduleCloseProfileMenu}
                                onBlur={handleProfileMenuBlur}
                            >
                                {getLoginButtonLabel()}

                                {localStorage.getItem('token') && (
                                    <div className={`account-dropdown-panel ${isProfileMenuOpen ? 'is-open' : ''}`}>
                                        <div className="account-dropdown-header">{userFullName}</div>
                                        <div className="account-dropdown-list">
                                            {profileActionList()}
                                            {logoutButtonBody()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="top-bar-button top-favorite-button p-button-secondary p-button-text"
                                icon="pi pi-heart"
                                onClick={clickFavoriteButton}
                                label={t('topbar.favorites')}
                            />

                            <div ref={cartButtonAnchorRef} className="top-cart-button-anchor">
                                <button
                                    type="button"
                                    className="top-bar-button top-cart-button top-cart-custom"
                                    onClick={clickBoxButton}
                                    aria-label="Sepetim"
                                >
                                    <span className="top-cart-icon-wrap" aria-hidden="true">
                                        <i className="pi pi-shopping-cart"/>
                                        {cartCount > 0 && (
                                            <span
                                                className={`top-cart-count-badge ${isCartBadgeBouncing ? 'is-bouncing' : ''}`}
                                                aria-label={t('topbar.cartAria', {count: cartCount})}
                                            >
                                                {cartBadgeLabel}
                                            </span>
                                        )}
                                    </span>
                                    <span className="top-cart-label">{t('topbar.cart')}</span>
                                </button>
                            </div>
                        </div>
                        <div className="top-bar-search-input">
                            <div className="col-12 md:col-4">
                                <div className="p-inputgroup search-input-group">
                                    <InputText
                                        value={desktopSearchValue}
                                        onChange={(event) => setDesktopSearchValue(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                executeSearch(desktopSearchValue);
                                            }
                                        }}
                                        className="search-input"
                                        placeholder={t('topbar.searchPlaceholder')}
                                    />
                                    <Button
                                        icon="pi pi-search"
                                        className="search-button p-button-secondary p-button-text"
                                        onClick={() => executeSearch(desktopSearchValue)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="mega-menu-wrapper"
                    onMouseEnter={clearCloseTimer}
                            onMouseLeave={scheduleCloseMegaMenu}
                            onBlur={handleMegaMenuBlur}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setIsMegaMenuOpen(false);
                        }
                    }}
                >
                    <div className="tab-menu-category" role="menubar" aria-label={t('topbar.categoriesAria')}>
                        {localizedMegaMenuCategories.map((category) => {
                            const isActive = activeMegaCategoryId === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`category-tab ${isActive ? 'is-active' : ''}`}
                                    onMouseEnter={() => openMegaMenu(category.id)}
                                    onFocus={() => openMegaMenu(category.id)}
                                    aria-expanded={isMegaMenuOpen}
                                    aria-controls="fashion-mega-menu-panel"
                                >
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        id="fashion-mega-menu-panel"
                        className={`fashion-mega-menu-panel ${isMegaMenuOpen ? 'is-open' : ''}`}
                        aria-hidden={!isMegaMenuOpen}
                    >
                        <div className="mega-menu-main">
                            <div className="mega-menu-header">
                                <span className="mega-menu-label">{activeCategory.label} {t('topbar.collectionSuffix')}</span>
                                <a href="/" className="mega-menu-view-all">{t('topbar.viewAll')}</a>
                            </div>

                            <div className="mega-menu-columns">
                                {orderedMegaMenuCategories.map((category) => {
                                    const isColumnActive = category.id === activeMegaCategoryId;
                                    return (
                                        <div key={category.id} className={`mega-menu-column ${isColumnActive ? 'is-active' : ''}`}>
                                            <a href="/" className="mega-menu-column-title">{category.label}</a>
                                            <ul>
                                                {category.items.map((subCategory) => (
                                                    <li key={subCategory.slug}>
                                                        <a href={`/product/${encodeURIComponent(subCategory.slug)}`}>{subCategory.label}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <aside className="mega-menu-promo">
                            <div className="mega-menu-promo-image-wrapper">
                                <img
                                    key={promoImageIndex}
                                    className="mega-menu-promo-image"
                                    src={promoImages[promoImageIndex]}
                                    alt={t('topbar.promoImageAlt')}
                                    loading="eager"
                                    decoding="async"
                                />
                            </div>
                            <span className="promo-badge">{t('topbar.promoBadge')}</span>
                            <h4>{t('topbar.promoTitle')}</h4>
                            <p>{t('topbar.promoText')}</p>
                            <a href="/" className="promo-cta">{t('topbar.promoCta')}</a>
                        </aside>
                    </div>
                </div>
            </div>

            <div className="hr-style">

            </div>

        </div>
    );
};
