import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {startAnalytics} from './analytics';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
startAnalytics();
import './iteration2.css';


import './discovery.css';
const customerPaths=['/cms','/personalise','/','/templates','/saved','/pricing','/dashboard','/login','/signup','/forgot-password','/create','/form','/editor','/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy','/blog'];
if(customerPaths.includes(location.pathname)||location.pathname.startsWith('/blog/')||location.pathname.startsWith('/manage/')||location.pathname.startsWith('/invitations'))document.body.classList.add('di-site');
