import React from 'react';
import {createRoot} from 'react-dom/client';
import {TemplatePreview} from './templates/TemplatePreview';
// Preserve the invitation's existing global styles without booting the shop,
// account UI, catalogue or their JavaScript in every embedded preview.
import './style.css';
import './iteration2.css';
import './discovery.css';
import './glass-theme.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><TemplatePreview/></React.StrictMode>);
