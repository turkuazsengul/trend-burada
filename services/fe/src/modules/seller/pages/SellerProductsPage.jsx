import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import {SellerLayout} from '../layout/SellerLayout';
import SellerProductService from '../service/SellerProductService';

const formatPrice = (price) => `${Number(price || 0).toLocaleString('tr-TR')} TL`;

export const SellerProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState('');
    const [query, setQuery] = useState('');

    const loadProducts = useCallback(() => {
        setLoading(true);
        return SellerProductService.getSellerProducts()
            .then((items) => {
                setProducts(Array.isArray(items) ? items : []);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const filteredProducts = useMemo(() => {
        const normalizedQuery = String(query || '').trim().toLowerCase();
        if (!normalizedQuery) {
            return products;
        }

        return products.filter((item) => {
            const haystack = [item.title, item.category, item.brand, item.mark, item.productCode]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [products, query]);

    const handleDelete = async (productId) => {
        const target = products.find((item) => String(item.productCode || item.routeId || item.id) === String(productId));
        if (!target) {
            return;
        }

        const approved = window.confirm(`${target.title || 'Bu urun'} kalici olarak silinsin mi?`);
        if (!approved) {
            return;
        }

        setDeletingId(productId);
        try {
            await SellerProductService.deleteSellerProduct(productId);
            await loadProducts();
        } finally {
            setDeletingId('');
        }
    };

    return (
        <SellerLayout
            title="Urunler"
            subtitle="Bu ekranda sadece aktif magazaya ait urunleri gorur, duzenler ve yayindan kaldirirsin."
            actions={<Link to="/seller/products/new"><Button label="Yeni urun" icon="pi pi-plus"/></Link>}
        >
            <div className="seller-toolbar-row">
                <span className="p-input-icon-left seller-search-input">
                    <i className="pi pi-search"/>
                    <InputText
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Urun, kategori veya urun kodu ara"
                    />
                </span>
                <div className="seller-toolbar-note">Arama, duzenleme ve silme islemleri bu liste uzerinden yapilir.</div>
            </div>

            <div className="seller-panel-card seller-table-card">
                {loading ? <div className="seller-empty-state">Urunler yukleniyor...</div> : null}

                {!loading && filteredProducts.length === 0 ? (
                    <div className="seller-empty-state">Bu seller icin gosterilecek urun bulunamadi.</div>
                ) : null}

                {!loading && filteredProducts.length > 0 ? (
                    <div className="seller-products-table-wrap">
                        <table className="seller-products-table">
                            <thead>
                            <tr>
                                <th>Urun</th>
                                <th>Kategori</th>
                                <th>Marka</th>
                                <th>Fiyat</th>
                                <th>Durum</th>
                                <th>Aksiyonlar</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredProducts.map((item) => {
                                const rowId = item.productCode || item.routeId || item.id;
                                const isDeleting = deletingId === rowId;

                                return (
                                    <tr key={rowId}>
                                        <td>
                                            <div className="seller-product-cell">
                                                <img src={item.img || item.imageUrl} alt={item.title}/>
                                                <div>
                                                    <strong>{item.title}</strong>
                                                    <span>{rowId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.category || '-'}</td>
                                        <td>{item.brand || item.mark || '-'}</td>
                                        <td>
                                            <strong>{formatPrice(item.price)}</strong>
                                            <span className="seller-muted-row">Eski: {formatPrice(item.oldPrice)}</span>
                                        </td>
                                        <td>
                                            <span className="seller-status-pill">Yayinda</span>
                                        </td>
                                        <td>
                                            <div className="seller-action-row">
                                                <Link to={`/seller/products/${encodeURIComponent(rowId)}/edit`}>
                                                    <Button label="Duzenle" className="p-button-text"/>
                                                </Link>
                                                <Button
                                                    label="Sil"
                                                    className="p-button-text p-button-danger"
                                                    loading={isDeleting}
                                                    onClick={() => handleDelete(rowId)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </SellerLayout>
    );
};
