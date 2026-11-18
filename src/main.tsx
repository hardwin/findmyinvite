import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {startAnalytics} from './analytics';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if(location.pathname!=='/auth/callback')startAnalytics();
import './iteration2.css';


import './discovery.css';
import './glass-theme.css';
import './storefront-density.css';
const customerPaths=['/video-personalise','/auth/callback','/cms','/personalise','/','/templates','/search','/saved','/pricing','/dashboard','/login','/signup','/forgot-password','/create','/form','/editor','/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy','/blog'];
if(customerPaths.includes(location.pathname.replace(/\/$/,'')||'/')||location.pathname.startsWith('/blog/')||location.pathname.startsWith('/manage/')||location.pathname.startsWith('/invitations')){
 document.documentElement.classList.add('di-site');
 document.body.classList.add('di-site');
}
// Public shopping surfaces only. Account, admin, personalisation and invitation
// documents retain their original type scale and artwork coordinate systems.
const storefrontPaths=['/','/templates','/search','/saved','/pricing','/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy','/blog'];
const storefrontPath=location.pathname.replace(/\/$/,'')||'/';
if(storefrontPaths.includes(storefrontPath)||storefrontPath.startsWith('/blog/')||storefrontPath.startsWith('/invitations/')){
 document.documentElement.classList.add('di-storefront');
}
