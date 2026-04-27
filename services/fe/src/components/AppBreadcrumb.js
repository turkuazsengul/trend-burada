import React, {useContext, useMemo} from 'react';
import {useHistory, useLocation} from "react-router-dom";
import AppContext from "../AppContext";

const normalizeLabel = (raw = '') => {
    const decoded = decodeURIComponent(raw || '');
    return decoded
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const AppBreadcrumb = () => {
    const {t = (key) => key, isMobile = false} = useContext(AppContext) || {};
    const location = useLocation();
    const history = useHistory();
    const pathname = location?.pathname || '/';

    const crumbs = useMemo(() => {
        if (pathname === '/') {
            return [];
        }

        const parts = pathname.split('/').filter(Boolean);
        const dynamicPart = parts[1] || '';
        const items = [{label: t('breadcrumb.home'), to: '/'}];

        if (parts[0] === 'product') {
            items.push({label: t('breadcrumb.products'), to: pathname});
            if (dynamicPart) {
                items.push({label: normalizeLabel(dynamicPart), to: pathname});
            }
            return items;
        }

        if (parts[0] === 'detail') {
            items.push({label: t('breadcrumb.productDetail'), to: pathname});
            return items;
        }

        if (parts[0] === 'sepetim') {
            items.push({label: t('breadcrumb.cart'), to: pathname});
            return items;
        }

        if (parts[0] === 'favoriler') {
            items.push({label: t('breadcrumb.favorites'), to: pathname});
            return items;
        }

        if (parts[0] === 'hesabım') {
            items.push({label: t('breadcrumb.account'), to: pathname});
            return items;
        }

        if (parts[0] === 'login') {
            items.push({label: t('breadcrumb.login'), to: pathname});
            return items;
        }

        parts.forEach((part, index) => {
            const to = `/${parts.slice(0, index + 1).join('/')}`;
            items.push({label: normalizeLabel(part), to});
        });
        return items;
    }, [pathname, t]);

    if (isMobile || crumbs.length === 0) {
        return null;
    }

    return (
        <div className="app-breadcrumb-wrap">
            <div className="app-breadcrumb">
                <button
                    type="button"
                    className="breadcrumb-back-button"
                    onClick={() => {
                        if (window.history.length > 1) {
                            history.goBack();
                        } else {
                            history.push('/');
                        }
                    }}
                >
                    <i className="pi pi-angle-left"/>
                    <span>{t('breadcrumb.back')}</span>
                </button>

                <nav className="breadcrumb-trail" aria-label={t('breadcrumb.ariaLabel')}>
                    {crumbs.map((crumb, index) => (
                        <span key={`${crumb.to}-${index}`} className="breadcrumb-item">
                            <a href={crumb.to}>{crumb.label}</a>
                            {index < crumbs.length - 1 && <i className="pi pi-angle-right"/>}
                        </span>
                    ))}
                </nav>
            </div>
        </div>
    );
};
