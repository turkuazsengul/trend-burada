import React, {useContext, useEffect, useMemo, useState} from 'react';
import CampaignService from "../../service/CampaignService";
import {USE_STATIC_CAMPAIGN_ITEMS} from "../../constants/UrlConstans";
import AppContext from "../../AppContext";
import {MEGA_MENU_CATEGORIES} from "../../data/demoProductData";

const staticCampaignData = [
    {
        id: 1,
        value: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=82",
        description: "Şehirde Yeni Sezon Stili"
    },
    {
        id: 2,
        value: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=82",
        description: "Premium Sokak Koleksiyonu"
    },
    {
        id: 3,
        value: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=82",
        description: "Modern Kadın Seçkisi"
    },
    {
        id: 4,
        value: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=82",
        description: "Minimal ve Şık Kombinler"
    },
    {
        id: 5,
        value: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=82",
        description: "Günlük Rahatlık, Premium Duruş"
    },
    {
        id: 6,
        value: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=82",
        description: "Sezonun En Yeni Parçaları"
    },
    {
        id: 7,
        value: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=2200&q=86",
        description: "Kadın Ceket & Dış Giyim"
    },
    {
        id: 8,
        value: "https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=2200&q=86",
        description: "Erkek Günlük Koleksiyon"
    },
    {
        id: 9,
        value: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=2200&q=86",
        description: "Çocuk Moda Dünyası"
    },
    {
        id: 10,
        value: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=2200&q=86",
        description: "Ayakkabı Trendleri"
    },
    {
        id: 11,
        value: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=2200&q=86",
        description: "Aksesuar Editi"
    },
    {
        id: 12,
        value: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2200&q=86",
        description: "Spor Giyim Performans"
    },
];

export const CampaignItems = () => {
    const {t = (key) => key, isMobile = false} = useContext(AppContext) || {};
    const [campaignData, setCampaignData] = useState(staticCampaignData);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        if (USE_STATIC_CAMPAIGN_ITEMS) {
            setCampaignData(staticCampaignData);
            return;
        }

        CampaignService.getCampaignItems().then((list) => {
            if (Array.isArray(list) && list.length > 0) {
                setCampaignData(list);
            } else {
                setCampaignData(staticCampaignData);
            }
        });
    }, []);

    const buildFilledList = (list, targetCount) => {
        const safeList = Array.isArray(list) && list.length > 0 ? list : staticCampaignData;
        const filled = [];

        for (let i = 0; i < targetCount; i += 1) {
            const source = safeList[i % safeList.length];
            filled.push({
                ...source,
                id: `${source.id}-${i}`
            });
        }

        return filled;
    };

    const heroSlides = useMemo(() => buildFilledList(campaignData, 6), [campaignData]);
    const heroMiniSlides = useMemo(() => buildFilledList(campaignData.slice(2), 6), [campaignData]);

    useEffect(() => {
        if (heroSlides.length <= 1) {
            return;
        }

        const sliderId = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroSlides.length);
        }, 3800);

        return () => clearInterval(sliderId);
    }, [heroSlides]);

    useEffect(() => {
        if (activeSlide >= heroSlides.length) {
            setActiveSlide(0);
        }
    }, [heroSlides, activeSlide]);

    const safeSlides = heroSlides.length > 0 ? heroSlides : buildFilledList(staticCampaignData, 1);
    const safeMiniSlides = heroMiniSlides.length > 0 ? heroMiniSlides : safeSlides;

    const trendCards = useMemo(() => buildFilledList(campaignData, 4), [campaignData]);
    const mosaicCards = useMemo(() => buildFilledList(campaignData.slice(4), 5), [campaignData]);
    const campaignCards = useMemo(() => buildFilledList(campaignData, 12), [campaignData]);
    const categoryCards = useMemo(() => {
        const visualPool = buildFilledList(campaignData, Math.max(MEGA_MENU_CATEGORIES.length, 6));
        return MEGA_MENU_CATEGORIES.map((category, index) => ({
            id: category.id,
            label: category.label,
            image: visualPool[index]?.value || staticCampaignData[index % staticCampaignData.length].value,
            subItems: category.items.slice(0, 3),
            to: `/product/${encodeURIComponent(category.items[0]?.slug || '')}`
        }));
    }, [campaignData]);
    const discountBanners = useMemo(() => ([
        {
            id: 'discount-1',
            badge: '%40',
            title: 'Sezon Sonu İndirimi',
            text: 'Seçili ürünlerde sınırlı süre',
            cta: 'Hemen İncele',
            to: '/product/elbise'
        },
        {
            id: 'discount-2',
            badge: '3 AL 2 ÖDE',
            title: 'Basic Ürünlerde Avantaj',
            text: 'Favori parçaları sepete ekle',
            cta: 'Kampanyayı Gör',
            to: '/product/tisort'
        },
        {
            id: 'discount-3',
            badge: 'EK %20',
            title: 'Sepette Ek İndirim',
            text: 'Mobil uygulamaya özel fırsat',
            cta: 'Alışverişe Başla',
            to: '/product/sneaker'
        },
        {
            id: 'discount-4',
            badge: '12 TAKSİT',
            title: 'Kartlara Özel Ödeme',
            text: 'Yeni sezon ürünlerinde geçerli',
            cta: 'Detayları Gör',
            to: '/product/esofman'
        }
    ]), []);

    const nextSlide = () => {
        setActiveSlide((prev) => (prev + 1) % safeSlides.length);
    };

    const prevSlide = () => {
        setActiveSlide((prev) => (prev - 1 + safeSlides.length) % safeSlides.length);
    };

    return (
        <div className="catalog">
            <section className="hero-slider-section">
                <div className="hero-slider-split">
                    <div className="hero-slider-shell">
                        <a href="/product" className="hero-slider-track" style={{transform: `translateX(-${activeSlide * 100}%)`}}>
                            {safeSlides.map((slide, index) => (
                                <article key={slide.id} className="hero-slide">
                                    <img
                                        src={slide.value}
                                        alt={slide.description}
                                        width="1600"
                                        height="1100"
                                        loading={isMobile ? "eager" : (index === activeSlide ? "eager" : "lazy")}
                                        decoding="async"
                                        fetchPriority={index === activeSlide ? "high" : "low"}
                                    />
                                    <div className="hero-slide-overlay">
                                        <span className="hero-pill">{t('home.heroPill')}</span>
                                        <h2>{slide.description}</h2>
                                        <p>{t('home.heroText')}</p>
                                    </div>
                                </article>
                            ))}
                        </a>

                        <button type="button" className="hero-nav prev" onClick={prevSlide} aria-label={t('common.previousSlide')}>‹</button>
                        <button type="button" className="hero-nav next" onClick={nextSlide} aria-label={t('common.nextSlide')}>›</button>
                    </div>

                    <div className="hero-mini-slider-shell">
                        <a href="/product" className="hero-mini-slider-track" style={{transform: `translateX(-${activeSlide * 100}%)`}}>
                            {safeMiniSlides.map((slide, index) => (
                                <article key={`mini-${slide.id}`} className="hero-mini-slide">
                                    <img
                                        src={slide.value}
                                        alt={slide.description}
                                        width="1200"
                                        height="1800"
                                        loading={isMobile ? "eager" : (index === activeSlide ? "eager" : "lazy")}
                                        decoding="async"
                                    />
                                    <div className="hero-mini-overlay">
                                        <span>{t('home.specialOffers')}</span>
                                        <strong>{slide.description}</strong>
                                    </div>
                                </article>
                            ))}
                        </a>
                    </div>
                </div>

                <div className="hero-dots">
                    {safeSlides.map((slide, index) => (
                        <button
                            key={slide.id}
                            type="button"
                            className={`hero-dot ${index === activeSlide ? 'is-active' : ''}`}
                            onClick={() => setActiveSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            <section className="campaign-showcase-section">
                <div className="section-head">
                    <h3>{t('home.featuredCollections')}</h3>
                    <a href="/product">{t('home.allCampaigns')}</a>
                </div>
                <div className="trend-card-grid">
                    {trendCards.map((item) => (
                        <a key={item.id} href="/product" className="trend-card">
                            <img src={item.value} alt={item.description} width="1200" height="1500" loading={isMobile ? "eager" : "lazy"} decoding="async" />
                            <span className="campaign-caption">{item.description}</span>
                        </a>
                    ))}
                </div>
            </section>

            <section className="category-spotlight-section">
                <div className="section-head">
                    <h3>{t('home.categorySpotlightTitle')}</h3>
                    <a href="/product/elbise">{t('home.seeAll')}</a>
                </div>

                <div className="category-spotlight-grid">
                    {categoryCards.map((category) => (
                        <a key={category.id} href={category.to} className="category-spotlight-card">
                            <img src={category.image} alt={category.label} width="1200" height="1500" loading={isMobile ? "eager" : "lazy"} decoding="async"/>
                            <div className="category-spotlight-overlay">
                                <h4>{category.label}</h4>
                                <div className="category-spotlight-tags">
                                    {category.subItems.map((item) => (
                                        <span key={item.slug}>{item.label}</span>
                                    ))}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            <section className="discount-ribbon-section">
                <div className="section-head">
                    <h3>{t('home.discountTitle')}</h3>
                    <a href="/product">{t('home.seeAll')}</a>
                </div>

                <div className="discount-ribbon-row">
                    {discountBanners.map((banner) => (
                        <a key={banner.id} href={banner.to} className="discount-ribbon-card">
                            <span className="discount-badge">{banner.badge}</span>
                            <h4>{banner.title}</h4>
                            <p>{banner.text}</p>
                            <span className="discount-link">{banner.cta}</span>
                        </a>
                    ))}
                </div>
            </section>

            <section className="discovery-section">
                <a href="/product" className="discovery-lead">
                    <img
                        src={(mosaicCards[0] || safeSlides[0]).value}
                        alt={(mosaicCards[0] || safeSlides[0]).description}
                        width="1600"
                        height="1200"
                        loading={isMobile ? "eager" : "lazy"}
                        decoding="async"
                    />
                    <div>
                        <h3>{(mosaicCards[0] || safeSlides[0]).description}</h3>
                        <p>{t('home.discoverTitle')}</p>
                    </div>
                </a>

                <div className="discovery-grid">
                    {mosaicCards.slice(1).map((item) => (
                        <a key={item.id} href="/product" className="discovery-card">
                            <img src={item.value} alt={item.description} width="1200" height="1200" loading={isMobile ? "eager" : "lazy"} decoding="async" />
                            <span className="campaign-caption">{item.description}</span>
                        </a>
                    ))}
                </div>
            </section>

            <section className="campaign-list">
                <div className="section-head">
                    <h3>{t('home.specialOffers')}</h3>
                    <a href="/product">{t('home.seeAll')}</a>
                </div>

                <div className="campaign-list-item">
                    {campaignCards.map((item) => (
                        <div key={item.id} className="campaign-item">
                            <a href="/product">
                                <div className="campaign-item-img-wrap">
                                    <img className="campaign-item-img" src={item.value} alt={item.description} width="1200" height="1500" loading={isMobile ? "eager" : "lazy"} decoding="async" />
                                </div>
                                <div className="campaign-item-summary">
                                    <span className="campaign-caption">{item.description}</span>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
