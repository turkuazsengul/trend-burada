import React, {useContext, useEffect, useMemo, useState} from 'react';
import {useLocation} from "react-router-dom";
import AppContext from "../../AppContext";
import SearchService from "../../service/SearchService";
import {ProductCard} from "./ProductCard";

const formatPrice = (price, locale) => `${Number(price || 0).toLocaleString(locale)} TL`;

export const SearchResultsPage = () => {
    const location = useLocation();
    const {t = (key) => key, language = 'tr', isMobile = false} = useContext(AppContext) || {};
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const query = useMemo(() => new URLSearchParams(location.search).get('q') || '', [location.search]);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return undefined;
        }

        let isMounted = true;
        setLoading(true);

        SearchService.searchProducts(query)
            .then((items) => {
                if (isMounted) {
                    setResults(Array.isArray(items) ? items : []);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [query]);

    return (
        <div className={`catalog product-page-shell search-results-page ${isMobile ? 'product-page-mobile-mode' : ''}`}>
            <div className="search-results-content">
                <div className="product-toolbar search-results-toolbar">
                    <div className="search-results-copy">
                        <strong>{t('search.resultsFor', {query})}</strong>
                        {!loading && <span>{t('productList.listingCount', {count: results.length})}</span>}
                    </div>
                </div>

                {loading && <div className="product-empty-state">{t('search.loading')}</div>}

                {!loading && results.length > 0 && (
                    <div className="product-list">
                        {results.map((product) => (
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
                )}

                {!loading && results.length === 0 && (
                    <div className="product-empty-state">
                        {t('search.empty', {query})}
                    </div>
                )}
            </div>
        </div>
    );
};
