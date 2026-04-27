import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import '../../css/seller.css';
import {SellerGuard} from './components/SellerGuard';
import {SellerDashboardPage} from './pages/SellerDashboardPage';
import {SellerLoginPage} from './pages/SellerLoginPage';
import {SellerOrdersPage} from './pages/SellerOrdersPage';
import {SellerProductCreatePage} from './pages/SellerProductCreatePage';
import {SellerProductEditPage} from './pages/SellerProductEditPage';
import {SellerProductsPage} from './pages/SellerProductsPage';

export const SellerApp = () => {
    return (
        <Switch>
            <Route path="/seller/login" exact component={SellerLoginPage}/>
            <SellerGuard path="/seller" exact component={SellerDashboardPage}/>
            <SellerGuard path="/seller/products" exact component={SellerProductsPage}/>
            <SellerGuard path="/seller/products/new" exact component={SellerProductCreatePage}/>
            <SellerGuard path="/seller/products/:id/edit" exact component={SellerProductEditPage}/>
            <SellerGuard path="/seller/orders" exact component={SellerOrdersPage}/>
            <Redirect to="/seller"/>
        </Switch>
    );
};
