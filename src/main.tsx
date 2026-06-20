import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { AdminPage } from './components/AdminPage';
import { FoundingPage } from './components/FoundingPage';
import './styles.css';

const pathname = window.location.pathname;
let RootComponent: React.FC = App;
if (pathname === '/privacy') RootComponent = PrivacyPage;
if (pathname === '/terms') RootComponent = TermsPage;
if (pathname === '/admin') RootComponent = AdminPage;
if (pathname === '/founding') RootComponent = FoundingPage;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
