import React, {useContext, useMemo} from 'react';
import AppContext from "./AppContext";

import appstoreicon from './icons/app-store-icon.svg'

export const AppFooter = () => {
    const {t = (key) => key, isMobile = false} = useContext(AppContext) || {};
    const footerBodyData = useMemo(() => ([
        {
            id: 0,
            header: t('footer.trendBurada'),
            items: [t('footer.whoWeAre'), t('footer.contact'), t('footer.corporateGift')]
        },
        {
            id: 1,
            header: t('footer.about'),
            items: [t('footer.whoWeAre'), t('footer.contact'), t('footer.career')]
        },
        {
            id: 2,
            header: t('footer.campaigns'),
            items: [t('footer.activeCampaigns'), t('footer.membership'), t('footer.giftIdeas'), t('footer.trendDeals')]
        },
        {
            id: 3,
            header: t('footer.help'),
            items: [t('footer.faq'), t('footer.liveHelp'), t('footer.howToReturn'), t('footer.guide')]
        }
    ]), [t]);

    if (isMobile) {
        return null;
    }

    return (
        <div className="footer">
            <div className="footer-body">
                <div className="footer-body-header">
                    {footerBodyData.map((group) => (
                        <div key={group.id} className="footer-body-header-items">
                            <span><a href="/">{group.header}</a></span>
                            {group.items.map((item, index) => (
                                <a key={`${group.id}-${index}`} href="/">{item}</a>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="footer-body-content">
                    <div className="footer-body-content-items">
                        <span><a href="/">{t('footer.safeShopping')}</a></span>
                        <div className="pay-method-icon">
                            <div className="troy-img"/>
                            <div className="master-card-img"/>
                            <div className="visa-img"/>
                            <div className="amex-img"/>
                        </div>
                    </div>

                    <div className="footer-body-content-items">
                        <span><a href="/">{t('footer.mobileApps')}</a></span>
                        <a href="https://www.apple.com/tr/app-store/"><img src={appstoreicon} alt=""/></a>
                    </div>

                    <div className="footer-body-content-items">
                        <span><a href="/">{t('footer.socialMedia')}</a></span>
                        <div className="mobil-app-icon">
                            <a href="https://tr-tr.facebook.com" aria-label="Facebook"><span className="pi pi-facebook"/></a>
                            <a href="https://twitter.com" aria-label="Twitter"><span className="pi pi-twitter"/></a>
                            <a href="https://www.youtube.com" aria-label="YouTube"><span className="pi pi-youtube"/></a>
                            <a href="https://www.instagram.com/" aria-label="Instagram"><span className="pi pi-instagram"/></a>
                        </div>

                    </div>
                </div>

                <div className="footer-body-bottom">
                    <span className="font-medium ml-2">© {(new Date().getFullYear())} Trend Burada</span>
                </div>
            </div>
        </div>
    );
}
