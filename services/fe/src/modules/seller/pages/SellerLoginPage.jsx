import React from 'react';
import {Login} from '../../../components/login-register-page-components/Login';

const quickHighlights = [
    'Urunlerini hizli sekilde yayina al ve tek ekrandan yonet',
    'Magaza yonetimi icin sade ve odakli bir operasyon alani',
    'Guvenli giris ile magazana ait urunleri ayri bir alanda yonet'
];

const previewStats = [
    {label: 'Odak', value: 'Urun Yonetimi'},
    {label: 'Deneyim', value: 'Magaza Paneli'},
    {label: 'Erisim', value: 'Guvenli Giris'}
];

export const SellerLoginPage = () => {
    return (
        <div className="seller-login-shell">
            <div className="seller-login-panel">
                <section className="seller-login-stage">
                    <span className="seller-login-kicker">Trend Burada Magaza Paneli</span>
                    <h1>Magaza yonetimi icin hazirlanan calisma alanina giris yap</h1>
                    <p>
                        Urun listeleme, yeni urun ekleme ve yayin akisini daha duzenli yonetebilmen icin magaza tarafini ayri bir deneyim olarak konumluyoruz.
                    </p>

                    <div className="seller-login-highlights">
                        {quickHighlights.map((item) => (
                            <div key={item} className="seller-login-highlight">
                                <span className="seller-login-highlight-dot" aria-hidden="true"/>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="seller-login-metrics">
                        {previewStats.map((item) => (
                            <article key={item.label} className="seller-login-metric-card">
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="seller-login-card container-items">
                    <div className="seller-login-card-head">
                        <span className="seller-login-card-badge">Giris</span>
                        <h2>Seller hesabinla devam et</h2>
                        <p>Magaza hesabinla giris yaparak urunlerini ve yayin akisini yonet.</p>
                    </div>
                    <Login showSocialActions={false} defaultRedirectTarget="/seller"/>
                </section>
            </div>
        </div>
    );
};
