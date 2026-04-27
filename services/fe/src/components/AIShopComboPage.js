import React, {useContext, useEffect, useMemo, useState} from 'react';
import {useHistory, useParams} from 'react-router-dom';
import AppContext from '../AppContext';
import CartService from '../service/CartService';

const AI_SHOP_COMBOS_KEY = 'tb_ai_shop_combos_v1';

const readCombo = (comboId) => {
    try {
        const raw = sessionStorage.getItem(AI_SHOP_COMBOS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.[comboId] || null;
    } catch (e) {
        return null;
    }
};

const AIShopComboPage = () => {
    const {comboId} = useParams();
    const history = useHistory();
    const appContext = useContext(AppContext);
    const t = appContext?.t || ((key) => key);
    const safeText = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };
    const combo = useMemo(() => readCombo(comboId), [comboId]);
    const [visibleItems, setVisibleItems] = useState(combo?.items || []);
    const [addedAll, setAddedAll] = useState(false);

    useEffect(() => {
        setVisibleItems(combo?.items || []);
    }, [combo]);

    const addProduct = (product) => {
        CartService.addToCart({
            product,
            quantity: 1,
            selectedSize: product?.sizeOptions?.[0] || product?.size || 'M',
            selectedColor: product?.colorOptions?.[0]?.name || product?.color || ''
        });
        setVisibleItems((prev) => prev.filter((item) => item.id !== product.id));
    };

    const addAllProducts = () => {
        visibleItems.forEach((product) => {
            CartService.addToCart({
                product,
                quantity: 1,
                selectedSize: product?.sizeOptions?.[0] || product?.size || 'M',
                selectedColor: product?.colorOptions?.[0]?.name || product?.color || ''
            });
        });
        setVisibleItems([]);
        setAddedAll(true);
        window.setTimeout(() => setAddedAll(false), 1800);
    };

    if (!combo) {
        return (
            <div className="ai-shop-combo-page">
                <div className="ai-shop-combo-empty">
                    <strong>{safeText('aiShop.comboMissingTitle', 'Kombin bulunamadı')}</strong>
                    <p>{safeText('aiShop.comboMissingText', 'AI Shop üzerinden yeni bir kombin oluşturarak tekrar deneyin.')}</p>
                    <button type="button" onClick={() => history.push('/')}>{safeText('common.back', 'Geri')}</button>
                </div>
            </div>
        );
    }

    if (visibleItems.length === 0) {
        return (
            <div className="ai-shop-combo-page">
                <div className="ai-shop-combo-empty">
                    <strong>{safeText('aiShop.comboCompletedTitle', 'Bu kombin sepete eklendi')}</strong>
                    <p>{safeText('aiShop.comboCompletedText', 'Seçtiğiniz parçalar sepetinize aktarıldı. Yeni bir kombin oluşturabilir veya sepetinize geçebilirsiniz.')}</p>
                    <div className="ai-shop-combo-header-actions">
                        <button type="button" className="ghost" onClick={() => history.push('/?aiShop=1')}>{safeText('aiShop.createNewCombo', 'AI Shop’a Dön')}</button>
                        <button type="button" className="primary" onClick={() => history.push('/sepetim')}>{safeText('aiShop.goToCart', 'Sepetime Git')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-shop-combo-page">
            <div className="ai-shop-combo-header">
                <div className="ai-shop-combo-hero">
                    <span className="ai-shop-combo-eyebrow">{safeText('aiShop.comboEyebrow', 'AI SHOP SEÇİMİ')}</span>
                    <strong>{safeText('aiShop.comboHeroTitle', 'Tarzınıza Özel Kombin')}</strong>
                    <span>{safeText('aiShop.comboHeaderText', 'Tercihlerinize göre seçilen parçaları birlikte inceleyin ve tek adımda sepete ekleyin')}</span>
                </div>
                <div className="ai-shop-combo-header-actions">
                    <button type="button" className="primary ai-shop-combo-add-all" onClick={addAllProducts}>{addedAll ? safeText('aiShop.allAdded', 'Tümü sepete eklendi') : safeText('aiShop.addAllToCart', 'Tümünü Sepete Ekle')}</button>
                </div>
            </div>

            <div className="ai-shop-combo-products-grid">
                {visibleItems.map((product) => (
                    <article key={product.id} className="ai-shop-combo-product-card">
                        <img src={product.img} alt={product.title} />
                        <div className="ai-shop-combo-product-content">
                            <strong>{product.mark}</strong>
                            <span>{product.title}</span>
                            <b>{Number(product.price || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL</b>
                            <div className="ai-shop-combo-product-actions">
                                <button type="button" className="ghost" onClick={() => history.push(`/detail/${product.routeId || product.productCode || product.id}`)}>{safeText('aiShop.viewProduct', 'Ürünü Gör')}</button>
                                <button type="button" className="primary" onClick={() => addProduct(product)}>{safeText('productCard.addToCart', 'Sepete Ekle')}</button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default AIShopComboPage;
