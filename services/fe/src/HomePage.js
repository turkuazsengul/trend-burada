import React, {useEffect, useState} from 'react';
import {AppTopBar} from "./AppTopBar";
import {AppFooter} from "./AppFooter";
import AppContext from "./AppContext";
import {CampaignItems} from "./components/home-page-components/CampaignItems";
import {Redirect, Route, Switch, useLocation} from "react-router-dom";
import {LoginPage} from "./components/login-register-page-components/LoginPage";

import "./css/publicPage.css"
import "./css/topBar.css"
import "./css/footer.css"
import "./css/campaignItem.css"
import "./css/login.css"
import './css/dialog.css'
import './css/register-confirm.css'
import './css/product.css'
import {AuthenticatedRoute} from "./AuthenticatedRoute";
import {ProductPage} from "./components/product-components/ProductPage";
import {SearchResultsPage} from "./components/product-components/SearchResultsPage";
import {ProductDetail} from "./components/product-components/ProductDetail";
import MyOrderComp from "./components/customer-profile-components/MyOrderComp";
import UserDetailComp from "./components/customer-profile-components/MyUserInfo";
import MyUserInfo from "./components/customer-profile-components/MyUserInfo";
import AllOrderComp from "./components/customer-profile-components/MyOrderComp";
import {FavoritesPage} from "./components/FavoritesPage";
import CartService, {CART_UPDATED_EVENT} from "./service/CartService";
import {CartPage} from "./components/CartPage";
import {translate} from "./i18n/i18n";
import {AppBreadcrumb} from "./components/AppBreadcrumb";
import './css/breadcrumb.css'
import './css/responsive-shell.css'
import {useResponsiveMode} from "./hooks/useResponsiveMode";
import LiveHelpWidget from "./components/LiveHelpWidget";
import AIShopWidget from "./components/AIShopWidget";
import AIShopComboPage from "./components/AIShopComboPage";
import {SellerApp} from "./modules/seller/SellerApp";
import {detectShellMode, normalizeSellerPath} from "./utils/appShell";

const AddressRedirect = () => <Redirect to="/hesabım/KullaniciBilgilerim?section=address"/>;

export const HomePage = () => {
    const location = useLocation();
    const {isMobile, isTablet, viewportWidth} = useResponsiveMode();
    const [component, setComponent] = useState(<CampaignItems/>);
    const [orderCount, setOrderCount] = useState(0);
    const [authenticated, setAuthenticated] = useState();
    const [timer, setTimer] = useState(null);
    const [language, setLanguage] = useState(localStorage.getItem('tb_lang') || 'tr');

    useEffect(() => {
        const syncCartCount = () => {
            setOrderCount(CartService.getCartCount());
        };

        syncCartCount();
        window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
        return () => window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
    }, []);

    const userSettings = {
        component: component,
        orderCount: orderCount,
        timer: timer,
        authenticated: authenticated,
        isMobile,
        isTablet,
        viewportWidth,
        language,
        t: (key, params) => translate(language, key, params),
        setLanguage: (nextLanguage) => {
            localStorage.setItem('tb_lang', nextLanguage);
            setLanguage(nextLanguage);
        },
        setOrderCount,
        setComponent,
        setAuthenticated,
        setTimer,
    };

    const isCartRoute = (location?.pathname || '').startsWith('/sepetim');
    const shellMode = detectShellMode();
    const sellerHostRedirectTarget = shellMode === "seller" && !location.pathname.startsWith('/seller')
        ? `${normalizeSellerPath(location.pathname)}${location.search || ''}${location.hash || ''}`
        : null;

    useEffect(() => {
        document.body.classList.toggle('app-mode-mobile', isMobile);
        document.body.classList.toggle('app-mode-tablet', isTablet);

        return () => {
            document.body.classList.remove('app-mode-mobile');
            document.body.classList.remove('app-mode-tablet');
        };
    }, [isMobile, isTablet]);

    return (
        <div className={`home-layout ${isMobile ? 'home-layout-mobile' : ''} ${isTablet ? 'home-layout-tablet' : ''}`}>
            <AppContext.Provider value={userSettings}>
                {sellerHostRedirectTarget ? <Redirect to={sellerHostRedirectTarget}/> : null}
                {shellMode === "seller" || location.pathname.startsWith('/seller') ? <SellerApp/> : (
                    <>
                <AppTopBar/>
                <AppBreadcrumb/>
                <div className={`container-items ${location.pathname === '/' ? 'is-home-route' : 'is-inner-route'}`}>
                    <div className={`container ${isCartRoute ? 'container-full' : ''}`}>
                        <Switch>
                            <Route path="/" exact component={CampaignItems}/>
                            <Route path="/login" exact component={LoginPage}/>
                            <Route path="/product/:id" exact component={ProductPage}/>
                            <Route path="/arama" exact component={SearchResultsPage}/>
                            <AuthenticatedRoute key="favorites" exact path="/favoriler" component={FavoritesPage}/>
                            <Route path="/detail/:id" exact component={ProductDetail}/>
                            <Route path="/ai-shop/kombin/:comboId" exact component={AIShopComboPage}/>
                            <Route path="/sepetim" exact component={CartPage}/>
                            <AuthenticatedRoute key="profile" exact path="/hesabım/KullaniciBilgilerim" component={MyUserInfo}/>
                            <AuthenticatedRoute key="order" exact path="/hesabım/Siparislerim" component={AllOrderComp}/>
                            <AuthenticatedRoute key="address" exact path="/hesabım/Adreslerim" component={AddressRedirect}/>
                        </Switch>
                    </div>
                </div>
                <AIShopWidget/>
                <LiveHelpWidget/>
                <AppFooter/>
                    </>
                )}
            </AppContext.Provider>

        </div>
    );
}
