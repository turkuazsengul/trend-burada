import React from 'react';
import {SellerLayout} from '../layout/SellerLayout';

export const SellerOrdersPage = () => {
    return (
        <SellerLayout title="Siparisler" subtitle="Magazana ait siparis akisini bu alandan takip edeceksin.">
            <div className="seller-panel-card seller-placeholder-card">
                <h2>Siparis modulu planlandi</h2>
                <p>
                    Seller panelinin ilk tesliminde urun operasyonlarini ayaga kaldiriyoruz. Siparisler ekrani bu layout,
                    navigation ve role ayriminin erken asamada gorunur olmasi icin simdiden acildi.
                </p>
            </div>
        </SellerLayout>
    );
};
