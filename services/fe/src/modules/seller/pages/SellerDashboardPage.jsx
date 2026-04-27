import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from 'primereact/button';
import {SellerLayout} from '../layout/SellerLayout';
import SellerProductService from '../service/SellerProductService';
import {getSellerProfile, getSellerProfiles} from '../data/sellerCatalogConfig';
import AuthService from '../../../service/AuthService';

export const SellerDashboardPage = () => {
    const [products, setProducts] = useState([]);
    const activeProfile = useMemo(() => getSellerProfile(AuthService.getCurrentUser()), []);
    const recommendedProfiles = useMemo(() => getSellerProfiles().filter((item) => item.email !== activeProfile.email), [activeProfile.email]);

    useEffect(() => {
        SellerProductService.getSellerProducts().then((items) => setProducts(Array.isArray(items) ? items : []));
    }, []);

    const stats = [
        {label: 'Toplam urun', value: products.length},
        {label: 'CRUD', value: 'Aktif'},
        {label: 'Marka secimi', value: `${activeProfile.allowedBrands.length} marka`},
        {label: 'Ownership', value: 'Seller bazli'}
    ];

    return (
        <SellerLayout
            title="Magaza Ozeti"
            subtitle="Magazanin urunlerini, marka secimlerini ve yayin akislarini tek panelden yonet."
            actions={<Link to="/seller/products/new"><Button label="Yeni urun" icon="pi pi-plus"/></Link>}
        >
            <div className="seller-stats-grid">
                {stats.map((item) => (
                    <article key={item.label} className="seller-stat-card">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </article>
                ))}
            </div>

            <div className="seller-card-grid seller-card-grid-wide">
                <article className="seller-panel-card">
                    <h2>Bugun bu panelde neler yonetiliyor?</h2>
                    <ul>
                        <li>Liste sadece bu magazaya ait urunleri gosterir</li>
                        <li>Marka secimi magazanin yetkili marka havuzundan gelir</li>
                        <li>Kategori secimi kademeli secim akisi ile ilerler</li>
                        <li>Urun duzenleme ve silme aksiyonlari dogrudan kullanilabilir</li>
                    </ul>
                </article>

                <article className="seller-panel-card seller-panel-card-accent">
                    <h2>Diger magaza hesaplari</h2>
                    <ul>
                        {recommendedProfiles.map((item) => (
                            <li key={item.email}>{item.email} - {item.storeName}</li>
                        ))}
                    </ul>
                </article>
            </div>
        </SellerLayout>
    );
};
