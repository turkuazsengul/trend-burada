import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Switch} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import ScrollToTop from './ScrollToTop';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'prismjs/themes/prism-coy.css';
import './layout/flags/flags.css';
import './layout/layout.scss';
import clearLegacyAddresses from './utils/clearLegacyAddresses';


import {HomePage} from "./HomePage";

// One-shot cleanup of the pre-API `tb_addresses_*` localStorage keys. Runs before render
// so the address UI never reads from the legacy store on its first paint.
clearLegacyAddresses();

// Single shared QueryClient. Defaults are deliberately conservative so this rollout cannot
// regress anything else: no automatic retries on mutations (would replay POSTs after a 5xx),
// 30s default staleTime, refetch on window focus stays at the library default (true).
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
            retry: 1,
        },
        mutations: {
            retry: 0,
        },
    },
});

ReactDOM.render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <ScrollToTop>
                <Switch>
                    <HomePage/>
                </Switch>
            </ScrollToTop>
        </BrowserRouter>
    </QueryClientProvider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
//serviceWorker.unregister();
