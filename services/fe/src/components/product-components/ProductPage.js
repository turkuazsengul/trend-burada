import React, {useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useLocation} from "react-router-dom";
import {ProductFilter} from "./ProductFilter";
import {ProductCard} from "./ProductCard";
import ProductService from "../../service/ProductService";
import AppContext from "../../AppContext";
import {
    getCategoryFacets,
    getMenuItemsByCategory,
    PRICE_RANGES,
} from "../../data/demoProductData";

const PAGE_SIZE = 24;
const INITIAL_FILTERS = {
    mark: [],
    size: [],
    color: [],
    priceRange: [],
    rating: [],
    sellerScore: [],
    discountRate: [],
    isFastDelivery: [],
    isFreeCargo: [],
    installmentText: []
};

const normalizeSlug = (raw = '') => {
    return decodeURIComponent(raw)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const normalizeCategoryKey = (rawSlug) => {
    const slug = normalizeSlug(rawSlug);
    const aliases = {
        'ti-sort': 'tisort',
        'tisort': 'tisort',
        't-shirt': 'tisort',
        'gomlek': 'gomlek'
    };

    return aliases[slug] || slug;
};

const formatPrice = (price, locale) => `${Number(price || 0).toLocaleString(locale)} TL`;

const matchesPriceRange = (price, rangeValue) => {
    const range = PRICE_RANGES.find((x) => x.value === rangeValue);
    return range ? range.check(price) : true;
};

export const ProductPage = ({match}) => {
    const {t = (key) => key, language = 'tr', isMobile = false} = useContext(AppContext) || {};
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const location = useLocation();
    const routeKey = normalizeCategoryKey(match.params.id || 'elbise');
    const isDiscountRoute = routeKey === 'indirim';
    const categoryKey = isDiscountRoute ? 'elbise' : routeKey;
    const discountQuery = Number(new URLSearchParams(location.search).get('discount') || 0);
    const menuItems = useMemo(() => getMenuItemsByCategory(categoryKey), [categoryKey]);
    const catalogRef = useRef(null);
    const productContentRef = useRef(null);
    const productToolbarRef = useRef(null);
    const loadMoreRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [serviceFacets, setServiceFacets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortValue, setSortValue] = useState('recommended');
    const [isMobileFilterStripVisible, setIsMobileFilterStripVisible] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);

    const [selectedFilters, setSelectedFilters] = useState(INITIAL_FILTERS);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadingMore(false);
        setSelectedFilters(INITIAL_FILTERS);
        setProducts([]);
        setServiceFacets([]);
        setTotalCount(0);
        setNextPage(1);
        setHasNextPage(false);

        const productSource = isDiscountRoute
            ? ProductService.getAllProductsPage(0, PAGE_SIZE)
            : ProductService.getProductsPageByCategory(categoryKey, 0, PAGE_SIZE);

        const facetSource = isDiscountRoute
            ? ProductService.getAllProducts().then((safeProducts) => ProductService.getFacetsByProducts(safeProducts))
            : ProductService.getFacetsByCategory(categoryKey);

        Promise.all([productSource, facetSource])
            .then(([productPage, facetList]) => {
                if (cancelled) {
                    return;
                }

                const safeProducts = Array.isArray(productPage?.items) ? productPage.items : [];
                setProducts(safeProducts);
                setTotalCount(Number(productPage?.totalElements || safeProducts.length));
                setHasNextPage(Boolean(productPage?.hasNext));
                setNextPage(Number(productPage?.page || 0) + 1);
                setServiceFacets(Array.isArray(facetList) ? facetList : []);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [categoryKey, isDiscountRoute]);

    const loadNextPage = useCallback(() => {
        if (loading || loadingMore || !hasNextPage) {
            return;
        }

        setLoadingMore(true);
        const request = isDiscountRoute
            ? ProductService.getAllProductsPage(nextPage, PAGE_SIZE)
            : ProductService.getProductsPageByCategory(categoryKey, nextPage, PAGE_SIZE);

        request.then((productPage) => {
            const incoming = Array.isArray(productPage?.items) ? productPage.items : [];
            setProducts((prev) => {
                const known = new Set(prev.map((item) => item.id));
                const merged = [...prev];
                incoming.forEach((item) => {
                    if (!known.has(item.id)) {
                        merged.push(item);
                    }
                });
                return merged;
            });
            setTotalCount(Number(productPage?.totalElements || totalCount));
            setHasNextPage(Boolean(productPage?.hasNext));
            setNextPage(Number(productPage?.page || nextPage) + 1);
        }).finally(() => setLoadingMore(false));
    }, [categoryKey, hasNextPage, isDiscountRoute, loading, loadingMore, nextPage, totalCount]);

    useEffect(() => {
        const sentinel = loadMoreRef.current;
        const root = productContentRef.current;

        if (!sentinel || !root || loading || !hasNextPage) {
            return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                loadNextPage();
            }
        }, {
            root,
            rootMargin: '0px 0px 280px 0px'
        });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, loading, loadingMore, nextPage, categoryKey, isDiscountRoute, loadNextPage]);

    useLayoutEffect(() => {
        const updateFooterVisibility = () => {
            const content = productContentRef.current;
            if (!content) {
                document.body.classList.remove('hide-global-footer');
                return;
            }

            const hasOverflow = content.scrollHeight > content.clientHeight + 4;
            const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 8;

            // Footer appears only when product stream is fully consumed.
            if (hasOverflow && !isAtBottom) {
                document.body.classList.add('hide-global-footer');
            } else {
                document.body.classList.remove('hide-global-footer');
            }
        };

        // Hide footer immediately on mount to prevent first-paint flicker.
        document.body.classList.add('hide-global-footer');

        const content = productContentRef.current;
        const catalog = catalogRef.current;
        let resizeObserver;
        let raf1;
        let raf2;

        updateFooterVisibility();
        raf1 = window.requestAnimationFrame(updateFooterVisibility);
        raf2 = window.requestAnimationFrame(updateFooterVisibility);

        if (content) {
            content.addEventListener('scroll', updateFooterVisibility, {passive: true});
            content.addEventListener('load', updateFooterVisibility, true);
        }

        window.addEventListener('resize', updateFooterVisibility, {passive: true});

        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(updateFooterVisibility);
            if (content) {
                resizeObserver.observe(content);
            }
            if (catalog) {
                resizeObserver.observe(catalog);
            }
        }

        return () => {
            if (raf1) {
                window.cancelAnimationFrame(raf1);
            }
            if (raf2) {
                window.cancelAnimationFrame(raf2);
            }
            if (content) {
                content.removeEventListener('scroll', updateFooterVisibility);
                content.removeEventListener('load', updateFooterVisibility, true);
            }
            window.removeEventListener('resize', updateFooterVisibility);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            document.body.classList.remove('hide-global-footer');
        };
    }, [categoryKey, loading, products.length]);

    useEffect(() => {
        if (!isMobile) {
            setIsMobileFilterStripVisible(true);
            return undefined;
        }

        let lastScrollY = window.scrollY || 0;
        let ticking = false;

        const updateToolbarVisibility = () => {
            const currentScrollY = window.scrollY || 0;
            const delta = currentScrollY - lastScrollY;

            if (currentScrollY <= 12) {
                setIsMobileFilterStripVisible(true);
                lastScrollY = currentScrollY;
                ticking = false;
                return;
            }

            if (delta > 8 && currentScrollY > 72) {
                setIsMobileFilterStripVisible(false);
            } else if (delta < -5) {
                setIsMobileFilterStripVisible(true);
            }

            lastScrollY = currentScrollY;
            ticking = false;
        };

        const handleScroll = () => {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(updateToolbarVisibility);
        };

        window.addEventListener('scroll', handleScroll, {passive: true});

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isMobile]);

    useLayoutEffect(() => {
        if (!isMobile) {
            document.documentElement.style.removeProperty('--mobile-product-toolbar-height');
            return undefined;
        }

        const toolbar = productToolbarRef.current;
        if (!toolbar) {
            return undefined;
        }

        const updateToolbarHeight = () => {
            document.documentElement.style.setProperty('--mobile-product-toolbar-height', `${toolbar.offsetHeight || 0}px`);
        };

        updateToolbarHeight();

        let resizeObserver;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(updateToolbarHeight);
            resizeObserver.observe(toolbar);
        }

        window.addEventListener('resize', updateToolbarHeight, {passive: true});

        return () => {
            window.removeEventListener('resize', updateToolbarHeight);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            document.documentElement.style.removeProperty('--mobile-product-toolbar-height');
        };
    }, [isMobile, isMobileFilterStripVisible]);

    const filters = useMemo(() => {
        if (serviceFacets.length > 0) {
            return serviceFacets;
        }

        return getCategoryFacets(categoryKey);
    }, [serviceFacets, categoryKey]);

    const filteredProducts = useMemo(() => {
        const matchesFilter = (product, key, value) => {
            if (key === 'priceRange') {
                return matchesPriceRange(product.price, value);
            }

            if (key === 'rating') {
                if (value === '4.5+') return Number(product.rating || 0) >= 4.5;
                if (value === '4.0+') return Number(product.rating || 0) >= 4.0;
                if (value === '3.5+') return Number(product.rating || 0) >= 3.5;
                return true;
            }

            if (key === 'sellerScore') {
                const score = Number(product.sellerScore || 0);
                if (value === '9.5+') return score >= 9.5;
                if (value === '9.0-9.4') return score >= 9.0 && score < 9.5;
                if (value === '8.5-8.9') return score >= 8.5 && score < 9.0;
                return true;
            }

            if (key === 'discountRate') {
                const discount = Number(product.discountRate || 0);
                if (value === '10+') return discount >= 10;
                if (value === '20+') return discount >= 20;
                if (value === '30+') return discount >= 30;
                return true;
            }

            if (key === 'isFastDelivery' || key === 'isFreeCargo') {
                const boolValue = value === 'true';
                return Boolean(product[key]) === boolValue;
            }

            return String(product[key] || '').toLowerCase() === String(value || '').toLowerCase();
        };

        return products.filter((product) => {
            if (isDiscountRoute && discountQuery > 0 && Number(product.discountRate || 0) < discountQuery) {
                return false;
            }

            return Object.entries(selectedFilters).every(([key, values]) => {
                if (!Array.isArray(values) || values.length === 0) {
                    return true;
                }

                return values.some((value) => matchesFilter(product, key, value));
            });
        });
    }, [products, selectedFilters, isDiscountRoute, discountQuery]);

    const sortedProducts = useMemo(() => {
        const list = [...filteredProducts];

        switch (sortValue) {
            case 'price-asc':
                return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
            case 'price-desc':
                return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
            case 'rating-desc':
                return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
            case 'newest':
                return list.sort((a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0));
            default:
                return list.sort((a, b) => {
                    const scoreA = (Number(a.rating || 0) * 100) + Number(a.reviewCount || 0) + Number(a.sellerScore || 0);
                    const scoreB = (Number(b.rating || 0) * 100) + Number(b.reviewCount || 0) + Number(b.sellerScore || 0);
                    return scoreB - scoreA;
                });
        }
    }, [filteredProducts, sortValue]);

    const handleFilterChange = (filterKey, value) => {
        setSelectedFilters((prev) => {
            const currentValues = prev[filterKey] || [];
            const exists = currentValues.includes(value);
            const nextValues = exists
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            return {
                ...prev,
                [filterKey]: nextValues
            };
        });
    };

    const clearAllFilters = () => {
        setSelectedFilters({});
    };

    const handleReplaceFilterGroup = (filterKey, nextValues) => {
        setSelectedFilters((prev) => ({
            ...prev,
            [filterKey]: Array.isArray(nextValues) ? nextValues : []
        }));
    };

    return (
        <div className={`catalog product-page-shell ${isMobile ? 'product-page-mobile-mode' : ''}`}>
            <div
                ref={catalogRef}
                className="product-catalog"
            >
                <aside className="product-filter">
                    <ProductFilter
                        filterItemList={filters}
                        selectedFilters={selectedFilters}
                        onFilterChange={handleFilterChange}
                        onReplaceFilterGroup={handleReplaceFilterGroup}
                        onClearAllFilters={clearAllFilters}
                        menuItems={menuItems}
                        activeMenuKey={categoryKey}
                        sortValue={sortValue}
                        onSortChange={setSortValue}
                    />
                </aside>

                <section ref={productContentRef} className="product-content">
                    <div
                        ref={productToolbarRef}
                        className={`product-toolbar ${isMobileFilterStripVisible ? 'is-visible' : 'is-hidden'}`}
                    >
                        <ProductFilter
                            mobileMode
                            filterItemList={filters}
                            selectedFilters={selectedFilters}
                            onFilterChange={handleFilterChange}
                            onReplaceFilterGroup={handleReplaceFilterGroup}
                            onClearAllFilters={clearAllFilters}
                            menuItems={menuItems}
                            activeMenuKey={categoryKey}
                            sortValue={sortValue}
                            onSortChange={setSortValue}
                            showSecondaryStrip
                        />
                        <span>{t('productList.listingCountProgress', {count: sortedProducts.length, total: totalCount || sortedProducts.length})}</span>
                    </div>

                    {loading && <div className="product-empty-state">{t('productList.loading')}</div>}

                    {!loading && (
                        <>
                            <div className="product-list">
                                {sortedProducts.map((product) => (
                                    <div key={product.id} className="product-card-items">
                                        <ProductCard
                                            product={{
                                                ...product,
                                                priceLabel: formatPrice(product.price, locale),
                                                oldPriceLabel: formatPrice(product.oldPrice, locale)
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div ref={loadMoreRef} className="product-list-load-state" aria-live="polite">
                                {loadingMore && t('productList.loadingMore')}
                                {!loadingMore && hasNextPage && t('productList.loadingTrigger')}
                                {!loadingMore && !hasNextPage && sortedProducts.length > 0 && t('productList.allLoaded')}
                            </div>
                        </>
                    )}

                    {!loading && !loadingMore && sortedProducts.length === 0 && !hasNextPage && (
                        <div className="product-empty-state">
                            {t('productList.empty')}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
