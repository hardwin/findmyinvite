import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {startAnalytics} from './analytics';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
startAnalytics();
import './iteration2.css';
import './invitation3.css';
