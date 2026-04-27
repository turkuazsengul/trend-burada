import React, {useContext, useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {Accordion, AccordionTab} from 'primereact/accordion';
import AppContext from "../../AppContext";

const MENU_ITEM_EN_LABELS = {
    elbise: 'Dress',
    tisort: 'T-Shirt',
    gomlek: 'Shirt',
    pantolon: 'Pants',
    ceket: 'Jacket',
    triko: 'Knitwear',
    'erkek-tisort': 'T-Shirt',
    'erkek-gomlek': 'Shirt',
    jean: 'Jeans',
    'erkek-pantolon': 'Pants',
    sweatshirt: 'Sweatshirt',
    mont: 'Coat',
    'kiz-cocuk': 'Girls',
    'erkek-cocuk': 'Boys',
    'bebek-giyim': 'Baby Clothing',
    'okul-kombinleri': 'School Outfits',
    sneaker: 'Sneakers',
    bot: 'Boots',
    'topuklu-ayakkabi': 'Heels',
    loafer: 'Loafers',
    sandalet: 'Sandals',
    canta: 'Bag',
    kemer: 'Belt',
    cuzdan: 'Wallet',
    taki: 'Jewelry',
    sapka: 'Hat',
    esofman: 'Tracksuit',
    tayt: 'Leggings',
    'spor-sutyeni': 'Sports Bra',
    hoodie: 'Hoodie',
    'kosu-urunleri': 'Running Products'
};

const FACET_TITLE_I18N_KEYS = {
    mark: 'productFilter.brand',
    brand: 'productFilter.brand',
    size: 'productFilter.size',
    color: 'productFilter.color',
    priceRange: 'productFilter.price',
    rating: 'productFilter.rating',
    sellerScore: 'productFilter.sellerScore',
    discountRate: 'productFilter.discount',
    isFastDelivery: 'productFilter.delivery',
    isFreeCargo: 'productFilter.shipping',
    installmentText: 'productFilter.paymentOption',
    __categories: 'productFilter.categories'
};

export const ProductFilter = ({
    filterItemList = [],
    selectedFilters = {},
    onFilterChange,
    onReplaceFilterGroup,
    onClearAllFilters,
    menuItems = [],
    activeMenuKey = '',
    mobileMode = false,
    sortValue = 'recommended',
    onSortChange,
    showSecondaryStrip = true
}) => {
    const {t = (key) => key, language = 'tr'} = useContext(AppContext) || {};
    const sortOptions = useMemo(() => ([
        {value: 'recommended', label: t('productFilter.sortRecommended')},
        {value: 'price-asc', label: t('productFilter.sortPriceAsc')},
        {value: 'price-desc', label: t('productFilter.sortPriceDesc')},
        {value: 'rating-desc', label: t('productFilter.sortRatingDesc')},
        {value: 'newest', label: t('productFilter.sortNewest')}
    ]), [t]);

    const allGroups = useMemo(() => {
        const base = [...filterItemList].map((group) => {
            const i18nKey = FACET_TITLE_I18N_KEYS[group.key];
            return {
                ...group,
                title: i18nKey ? t(i18nKey) : group.title
            };
        });

        if (menuItems.length > 0) {
            return [
                ...(mobileMode ? [{
                    key: '__sort',
                    title: t('productFilter.sorting'),
                    options: sortOptions
                }] : []),
                {
                    key: '__categories',
                    title: t('productFilter.categories'),
                    options: menuItems.map((item) => ({
                        value: item.slug,
                        label: language === 'en' ? (MENU_ITEM_EN_LABELS[item.slug] || item.label) : item.label
                    }))
                },
                ...base
            ];
        }

        return [
            ...(mobileMode ? [{
                key: '__sort',
                title: t('productFilter.sorting'),
                options: sortOptions
            }] : []),
            ...base
        ];
    }, [filterItemList, menuItems, t, language, sortOptions, mobileMode]);

    const defaultActiveIndexes = useMemo(() => {
        const alwaysOpenKeys = new Set(['__categories', 'mark', 'brand']);
        return allGroups
            .map((group, index) => (alwaysOpenKeys.has(group.key) ? index : -1))
            .filter((index) => index !== -1);
    }, [allGroups]);

    const [activeIndexes, setActiveIndexes] = useState(defaultActiveIndexes);
    const [groupSearchTerms, setGroupSearchTerms] = useState({});
    const [activeMobileGroupKey, setActiveMobileGroupKey] = useState('');
    const [mobileDraftValues, setMobileDraftValues] = useState([]);
    const [isMobileFilterScreenOpen, setIsMobileFilterScreenOpen] = useState(false);
    const [mobileScreenDraftFilters, setMobileScreenDraftFilters] = useState({});
    const [mobileScreenDraftCategory, setMobileScreenDraftCategory] = useState('');
    const [mobileScreenOpenKeys, setMobileScreenOpenKeys] = useState(['__categories']);

    useEffect(() => {
        setActiveIndexes(defaultActiveIndexes);
    }, [defaultActiveIndexes]);

    useEffect(() => {
        setGroupSearchTerms((prev) => {
            const next = {};
            allGroups.forEach((group) => {
                next[group.key] = prev[group.key] || '';
            });
            return next;
        });
    }, [allGroups]);

    useEffect(() => {
        if (!isMobileFilterScreenOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        const previousTouchAction = document.body.style.touchAction;
        document.body.classList.add('mobile-filter-screen-open');
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';

        return () => {
            document.body.classList.remove('mobile-filter-screen-open');
            document.body.style.overflow = previousOverflow;
            document.body.style.touchAction = previousTouchAction;
        };
    }, [isMobileFilterScreenOpen]);

    useEffect(() => {
        if (!mobileMode) {
            return;
        }

        if (!activeMobileGroupKey) {
            setMobileDraftValues([]);
            return;
        }

        if (activeMobileGroupKey === '__sort') {
            setMobileDraftValues(sortValue ? [sortValue] : ['recommended']);
            return;
        }

        if (activeMobileGroupKey === '__categories') {
            setMobileDraftValues(activeMenuKey ? [activeMenuKey] : []);
            return;
        }

        setMobileDraftValues(selectedFilters[activeMobileGroupKey] || []);
    }, [mobileMode, activeMobileGroupKey, selectedFilters, activeMenuKey, sortValue]);

    const hasActiveFilter = Object.values(selectedFilters || {}).some((values) => Array.isArray(values) && values.length > 0);
    const chipGroups = allGroups.filter((group) => group.key !== '__sort');

    const toggleScreenDraftValue = (groupKey, value) => {
        if (groupKey === '__categories') {
            setMobileScreenDraftCategory(value);
            return;
        }

        setMobileScreenDraftFilters((prev) => {
            const current = prev[groupKey] || [];
            const nextValues = current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value];

            return {
                ...prev,
                [groupKey]: nextValues
            };
        });
    };

    const openMobileFilterScreen = () => {
        setActiveMobileGroupKey('');
        setMobileScreenDraftFilters({...selectedFilters});
        setMobileScreenDraftCategory(activeMenuKey || '');
        setMobileScreenOpenKeys(['__categories']);
        setIsMobileFilterScreenOpen(true);
    };

    const applyMobileFilterScreen = () => {
        if (onReplaceFilterGroup) {
            allGroups
                .filter((group) => group.key !== '__sort' && group.key !== '__categories')
                .forEach((group) => {
                    onReplaceFilterGroup(group.key, mobileScreenDraftFilters[group.key] || []);
                });
        }

        if (mobileScreenDraftCategory && mobileScreenDraftCategory !== activeMenuKey) {
            window.location.href = `/product/${mobileScreenDraftCategory}`;
            return;
        }

        setIsMobileFilterScreenOpen(false);
    };

    const clearMobileFilterScreen = () => {
        setMobileScreenDraftFilters({});
        setMobileScreenDraftCategory(activeMenuKey || '');
    };

    const toggleMobileScreenSection = (groupKey) => {
        setMobileScreenOpenKeys((prev) => (
            prev.includes(groupKey)
                ? prev.filter((item) => item !== groupKey)
                : [...prev, groupKey]
        ));
    };

    const handleGroupSearchChange = (groupKey, value) => {
        setGroupSearchTerms((prev) => ({
            ...prev,
            [groupKey]: value
        }));
    };

    const renderOptions = (group, options, selectedValues, onToggleValue) => {
        return (
            <>
                {options.map((option) => {
                    const inputId = `${group.key}-${option.value}`;
                    const isChecked = selectedValues.includes(option.value);

                    return (
                        <div key={inputId} className="field-checkbox filter-checkbox-row">
                            <input
                                id={inputId}
                                type="checkbox"
                                name={group.key}
                                value={option.value}
                                checked={isChecked}
                                className="filter-checkbox-input"
                                onChange={() => onToggleValue(option.value)}
                            />
                            <label className="filter-option-label" htmlFor={inputId}>
                                <span className="filter-option-text">{option.label}</span>
                            </label>
                        </div>
                    );
                })}

                {options.length === 0 && (
                    <div className="facet-empty-result">{t('productFilter.noResult')}</div>
                )}
            </>
        );
    };

    if (mobileMode) {
        const activeGroup = allGroups.find((group) => group.key === activeMobileGroupKey);
        const activeSearchTerm = (groupSearchTerms[activeMobileGroupKey] || '').trim().toLowerCase();
        const visibleOptions = activeGroup
            ? (activeSearchTerm
                ? activeGroup.options.filter((option) => String(option.label || '').toLowerCase().includes(activeSearchTerm))
                : activeGroup.options)
            : [];

        const toggleMobileDraftValue = (value) => {
            setMobileDraftValues((prev) => {
                if (activeMobileGroupKey === '__categories' || activeMobileGroupKey === '__sort') {
                    return [value];
                }

                return prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev, value];
            });
        };

        const applyMobileGroup = () => {
            if (!activeMobileGroupKey) {
                return;
            }

            if (activeMobileGroupKey === '__sort') {
                if (onSortChange) {
                    onSortChange(mobileDraftValues[0] || 'recommended');
                }
                setActiveMobileGroupKey('');
                return;
            }

            if (activeMobileGroupKey === '__categories') {
                const selectedCategory = mobileDraftValues[0] || '';
                if (selectedCategory && selectedCategory !== activeMenuKey) {
                    window.location.href = `/product/${selectedCategory}`;
                }
                setActiveMobileGroupKey('');
                return;
            }

            if (onReplaceFilterGroup) {
                onReplaceFilterGroup(activeMobileGroupKey, mobileDraftValues);
            }
            setActiveMobileGroupKey('');
        };

        const mobileFilterScreen = isMobileFilterScreenOpen ? (
                    <div className="mobile-filter-screen">
                        <div className="mobile-filter-screen-head">
                            <button type="button" className="mobile-filter-screen-back" onClick={() => setIsMobileFilterScreenOpen(false)}>
                                <i className="pi pi-angle-left" aria-hidden="true"/>
                            </button>
                            <strong>{t('productFilter.filtering')}</strong>
                        </div>

                        <div className="mobile-filter-screen-body">
                            {chipGroups.map((group) => {
                                const searchTerm = (groupSearchTerms[group.key] || '').trim().toLowerCase();
                                const visibleScreenOptions = searchTerm
                                    ? group.options.filter((option) => String(option.label || '').toLowerCase().includes(searchTerm))
                                    : group.options;
                                const selectedValues = group.key === '__categories'
                                    ? (mobileScreenDraftCategory ? [mobileScreenDraftCategory] : [])
                                    : (mobileScreenDraftFilters[group.key] || []);
                                const isSectionOpen = mobileScreenOpenKeys.includes(group.key);

                                return (
                                    <div key={group.key} className="mobile-filter-screen-section">
                                        <button
                                            type="button"
                                            className="mobile-filter-screen-toggle"
                                            onClick={() => toggleMobileScreenSection(group.key)}
                                        >
                                            <span className="mobile-filter-screen-title">{group.title}</span>
                                            <i className={`pi ${isSectionOpen ? 'pi-angle-up' : 'pi-angle-down'}`} aria-hidden="true"/>
                                        </button>

                                        {isSectionOpen && (
                                            <>
                                                <div className="facet-search-area">
                                                    <input
                                                        type="text"
                                                        className="facet-search-input"
                                                        placeholder={t('productFilter.searchPlaceholder', {title: group.title})}
                                                        value={groupSearchTerms[group.key] || ''}
                                                        onChange={(event) => handleGroupSearchChange(group.key, event.target.value)}
                                                    />
                                                </div>
                                                <div className="facet-options-scroll mobile-filter-screen-options">
                                                    <div className="filter-options-list">
                                                        {renderOptions(group, visibleScreenOptions, selectedValues, (value) => toggleScreenDraftValue(group.key, value))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mobile-filter-screen-actions">
                            <button type="button" className="mobile-filter-cancel" onClick={clearMobileFilterScreen}>
                                {t('productFilter.clearFilters')}
                            </button>
                            <button type="button" className="mobile-filter-apply" onClick={applyMobileFilterScreen}>
                                {t('productFilter.apply')}
                            </button>
                        </div>
                    </div>
        ) : null;

        return (
            <div className={`mobile-filter-shell ${showSecondaryStrip ? 'is-secondary-visible' : 'is-secondary-hidden'}`}>
                <div className="mobile-filter-topbar">
                    <div className="mobile-filter-utility-row">
                        <button
                            type="button"
                            className={`mobile-filter-utility-btn ${activeMobileGroupKey === '__sort' ? 'is-active' : ''}`}
                            onClick={() => setActiveMobileGroupKey((prev) => (prev === '__sort' ? '' : '__sort'))}
                        >
                            <i className="pi pi-sort-alt" aria-hidden="true"/>
                            <span>{t('productFilter.sorting')}</span>
                        </button>
                        <button
                            type="button"
                            className={`mobile-filter-utility-btn ${isMobileFilterScreenOpen ? 'is-active' : ''}`}
                            onClick={openMobileFilterScreen}
                        >
                            <i className="pi pi-sliders-h" aria-hidden="true"/>
                            <span>{t('productFilter.filtering')}</span>
                        </button>
                    </div>
                    <div className="mobile-filter-strip" role="tablist" aria-label={t('productFilter.mobileFilterAria')}>
                        {chipGroups.map((group) => {
                            const count = group.key === '__categories'
                                ? (activeMenuKey ? 1 : 0)
                                : (selectedFilters[group.key] || []).length;

                            return (
                                <button
                                    key={group.key}
                                    type="button"
                                    className={`mobile-filter-chip ${activeMobileGroupKey === group.key ? 'is-active' : ''}`}
                                    onClick={() => setActiveMobileGroupKey((prev) => (prev === group.key ? '' : group.key))}
                                >
                                    <span>{group.title}</span>
                                    {count > 0 && <b>{count}</b>}
                                    <i className={`pi ${activeMobileGroupKey === group.key ? 'pi-angle-up' : 'pi-angle-down'}`}/>
                                </button>
                            );
                        })}

                        {hasActiveFilter && (
                            <button type="button" className="mobile-filter-reset" onClick={onClearAllFilters}>
                                {t('productFilter.clearFilters')}
                            </button>
                        )}
                    </div>
                </div>

                {activeGroup && (
                        <div className="mobile-filter-panel">
                            <div className="mobile-filter-panel-head">
                                <strong>{activeGroup.title}</strong>
                            </div>

                            {activeGroup.key !== '__sort' && (
                                <div className="facet-search-area">
                                    <input
                                        type="text"
                                        className="facet-search-input"
                                        placeholder={t('productFilter.searchPlaceholder', {title: activeGroup.title})}
                                        value={groupSearchTerms[activeGroup.key] || ''}
                                        onChange={(event) => handleGroupSearchChange(activeGroup.key, event.target.value)}
                                    />
                                </div>
                            )}

                            <div className="facet-options-scroll mobile-facet-options-scroll">
                                <div className="filter-options-list">
                                    {renderOptions(activeGroup, visibleOptions, mobileDraftValues, toggleMobileDraftValue)}
                                </div>
                            </div>

                            <div className="mobile-filter-panel-actions">
                                <button type="button" className="mobile-filter-cancel" onClick={() => {
                                    if (activeMobileGroupKey === '__sort' && onSortChange) {
                                        onSortChange('recommended');
                                    } else if (activeMobileGroupKey !== '__categories' && onReplaceFilterGroup) {
                                        onReplaceFilterGroup(activeMobileGroupKey, []);
                                    }
                                    setActiveMobileGroupKey('');
                                }}>
                                    {t('productFilter.clearFilters')}
                                </button>
                                <button type="button" className="mobile-filter-apply" onClick={applyMobileGroup}>
                                    {t('productFilter.apply')}
                                </button>
                            </div>
                        </div>
                )}

                {typeof document !== 'undefined' && mobileFilterScreen ? createPortal(mobileFilterScreen, document.body) : null}
            </div>
        );
    }

    return (
        <div>
            <div className="product-filter-panel">
                <Accordion
                    multiple
                    activeIndex={activeIndexes}
                    expandIcon="pi pi-chevron-down"
                    collapseIcon="pi pi-chevron-down"
                    onTabChange={(event) => setActiveIndexes(event.index)}
                >
                    {allGroups.map((group) => {
                        const searchTerm = (groupSearchTerms[group.key] || '').trim().toLowerCase();
                        const visibleOptions = searchTerm
                            ? group.options.filter((option) => String(option.label || '').toLowerCase().includes(searchTerm))
                            : group.options;

                        const checkedValues = group.key === '__categories'
                            ? (activeMenuKey ? [activeMenuKey] : [])
                            : (selectedFilters[group.key] || []);

                        return (
                            <AccordionTab key={group.key} header={group.title} className="product-filter-items">
                                <div className="facet-search-area">
                                    <input
                                        type="text"
                                        className="facet-search-input"
                                        placeholder={t('productFilter.searchPlaceholder', {title: group.title})}
                                        value={groupSearchTerms[group.key] || ''}
                                        onChange={(event) => handleGroupSearchChange(group.key, event.target.value)}
                                    />
                                </div>
                                <div className="facet-options-scroll">
                                    <div className="filter-options-list">
                                        {renderOptions(group, visibleOptions, checkedValues, (value) => {
                                            if (group.key === '__categories') {
                                                if (value !== activeMenuKey) {
                                                    window.location.href = `/product/${value}`;
                                                }
                                                return;
                                            }
                                            onFilterChange(group.key, value);
                                        })}
                                    </div>
                                </div>
                            </AccordionTab>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
};
