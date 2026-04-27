import React, {useContext, useEffect, useMemo, useState} from "react";
import {ProductCard} from "./product-components/ProductCard";
import {FAVORITES_UPDATED_EVENT, getFavorites, getFavoritesFromService} from "../service/FavoriteService";
import AppContext from "../AppContext";

const formatPrice = (price, locale) => `${Number(price || 0).toLocaleString(locale)} TL`;

export const FavoritesPage = () => {
    const {t = (key) => key, language = 'tr', isMobile = false} = useContext(AppContext) || {};
    const locale = language === 'en' ? 'en-US' : 'tr-TR';
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncFavorites = () => {
            setFavorites(getFavorites());
        };

        syncFavorites();
        getFavoritesFromService().then(syncFavorites).finally(() => setLoading(false));
        window.addEventListener('storage', syncFavorites);
        window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);

        return () => {
            window.removeEventListener('storage', syncFavorites);
            window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
        };
    }, []);

    const favoriteProducts = useMemo(() => {
        return favorites.map((item) => ({
            ...item,
            priceLabel: item.priceLabel || formatPrice(item.price, locale),
            oldPriceLabel: item.oldPriceLabel || formatPrice(item.oldPrice, locale)
        }));
    }, [favorites, locale]);

    return (
        <div className={`catalog favorites-page ${isMobile ? 'favorites-page-mobile-mode' : ''}`}>
            <div className="favorites-header">
                <h1>{t('favorites.title')}</h1>
                <span>{t('favorites.productCount', {count: favoriteProducts.length})}</span>
            </div>

            {loading && (
                <div className="favorites-empty-state">
                    <h3>{t('favorites.loading')}</h3>
                </div>
            )}

            {!loading && favoriteProducts.length === 0 && (
                <div className="favorites-empty-state">
                    <h3>{t('favorites.emptyTitle')}</h3>
                    <p>{t('favorites.emptyText')}</p>
                    <a href="/" className="favorites-empty-cta">{t('favorites.startShopping')}</a>
                </div>
            )}

            {!loading && favoriteProducts.length > 0 && (
                <div className="product-list favorites-list">
                    {favoriteProducts.map((product) => (
                        <div key={product.id} className="product-card-items">
                            <ProductCard product={product}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
