import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home } from './pages/Home';
import { User, AdminSettings } from './types';
import { getCurrentUser, getAdminSettings } from './lib/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import PaymentCallback from './pages/PaymentCallback';

const AdminDashboard = React.lazy(() => import('./pages/Admin').then(module => ({ default: module.AdminDashboard })));
const CustomPage = React.lazy(() => import('./pages/CustomPage').then(module => ({ default: module.CustomPage })));
const ContactPage = React.lazy(() => import('./pages/Contact').then(module => ({ default: module.ContactPage })));
const UserProfilePage = React.lazy(() => import('./pages/UserProfilePage'));
const NotFound = React.lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));
const InstallWizard = React.lazy(() => import('./pages/Install').then(module => ({ default: module.InstallWizard })));

import { useParams as useRouterParams } from 'react-router-dom';
const DynamicRouteResolver = (props: any) => {
  const { slug } = useRouterParams();
  if (slug?.startsWith('@')) {
    return <UserProfilePage currentUser={props.user} siteSettings={props.siteSettings} activeLanguages={props.activeLanguages} currentLang={props.currentLang} setCurrentLang={props.setCurrentLang} />;
  }
  return <CustomPage user={props.user} siteSettings={props.siteSettings} activeLanguages={props.activeLanguages} currentLang={props.currentLang} setCurrentLang={props.setCurrentLang} />;
};

export default function App() {
  const [globalLoading, setGlobalLoading] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(true);
  const [siteSettings, setSiteSettings] = useState<AdminSettings | null>(() => {
    try {
      const saved = localStorage.getItem('vibematch_site_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [activeLanguages, setActiveLanguages] = useState<any[]>([]);
  const [currentLang, setCurrentLang] = useState<any>(null);

  useEffect(() => {
    // If we're on the install page, we don't need to check auth normally
    const isInstallRoute = window.location.pathname.startsWith('/install');
    async function initApp() {
      try {
        // First check if installed to avoid long loading times waiting for DB timeouts on user/settings
        let installed = true;
        try {
          const res = await fetch('/api/install/status');
          const data = await res.json();
          installed = !!data.installed;
          setIsInstalled(installed);
          
          if (!installed && !isInstallRoute) {
            window.location.href = '/install';
            return;
          } else if (installed && isInstallRoute) {
            window.location.href = '/';
            return;
          }
        } catch (e) {
          console.error('Install status error', e);
          // If we can't even get install status, assume not installed or network error
          installed = false;
        }

        // If not installed, stop initialization early
        if (!installed) {
          setGlobalLoading(false);
          return;
        }

        // Only fetch user and settings if installed
        const u = await getCurrentUser();
        if (u) {
          // Prevent admin users from leaking into the frontend user session
          if (u.role === 'admin' && !window.location.pathname.startsWith('/admin')) {
            import('./lib/auth').then(({ authStorage }) => authStorage.removeToken());
          } else {
            if (u.avatar && u.avatar.includes('api.dicebear.com/7.x')) {
              u.avatar = u.avatar.replace('7.x', '9.x');
            }
            setUser(u);
          }
        }
        
        const st = await getAdminSettings();
        setSiteSettings(st);
        localStorage.setItem('vibematch_site_settings', JSON.stringify(st));
        
        try {
          const langRes = await fetch('/api/languages');
          const langData = await langRes.json();
          if (langData.languages) {
            setActiveLanguages(langData.languages);
            const savedLangCode = localStorage.getItem('vibematch_lang');
            let current = langData.languages.find((l: any) => l.code === savedLangCode);
            if (!current && st?.defaultLanguage) current = langData.languages.find((l: any) => l.code === st.defaultLanguage);
              if (!current && langData.languages.length > 0) current = langData.languages.find((l: any) => l.code === 'en') || langData.languages[0];
            if (current) {
              setCurrentLang(current);
              document.documentElement.dir = current.rtl ? 'rtl' : 'ltr';
            }
          }
        } catch (err) {}

        // Update document title and favicon dynamically
        if (st) {
          document.title = st.seoTitle || st.siteName || 'VibeMatch';
          if (st.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            if (st.faviconUrl.length <= 2) {
              link.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${st.faviconUrl}</text></svg>`;
            } else {
              link.href = st.faviconUrl;
            }
          }
        }
      } catch (err) {
        console.error('Init error', err);
      } finally {
        setGlobalLoading(false);
      }
    }
    initApp();
  }, []);

  if (globalLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00E676]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '0.5s' }}></div>

        {/* Logo and Name Container */}
        <div className="relative z-10 flex flex-col items-center space-y-8 animate-fade-in-up">
          {/* Pulsing Logo Circle */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00E676] to-emerald-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700 animate-pulse"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/20">
              <img 
                src={siteSettings?.logoUrl || "/images/logo.png"} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-full z-10 filter drop-shadow-[0_0_15px_rgba(0,230,118,0.5)] transform hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>

          {/* Site Name and Tagline */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tight">
              {siteSettings?.siteName || 'VibeMatch'}
            </h1>
            <p className="text-emerald-400/80 font-medium text-sm sm:text-base tracking-[0.2em] uppercase font-mono animate-pulse">
              Initializing...
            </p>
          </div>

          {/* Loading Progress Bar */}
          <div className="w-48 h-1.5 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 mt-4">
            <div className="h-full bg-gradient-to-r from-[#00E676] to-emerald-400 rounded-full w-full animate-loading-bar origin-left"></div>
          </div>
        </div>

        {/* Global Animation Styles */}
        <style>{`
          @keyframes loading-bar {
            0% { transform: scaleX(0); opacity: 0.5; }
            50% { transform: scaleX(0.7); opacity: 1; }
            100% { transform: scaleX(1); opacity: 0.5; }
          }
          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out infinite;
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  if (user?.isBanned && !window.location.pathname.startsWith('/contact')) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
        <div className="bg-[#16181f] border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-red-500">⚠</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-4">Account Suspended</h1>
          <p className="text-gray-400 mb-8">
            You are banned, please contact support <a href="/contact" className="text-[#00E676] hover:underline">/contact</a>
          </p>
          <button
            onClick={() => {
              import('./lib/auth').then(({ authStorage }) => {
                authStorage.removeToken();
                window.location.href = '/';
              });
            }}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ 
          style: { background: '#181a20', color: '#fff', border: '1px solid #374151' },
          success: { iconTheme: { primary: '#00E676', secondary: '#181a20' } }
        }} />
        <Routes>
          <Route path="/" element={<Home user={user} setUser={setUser} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />} />
          <Route path="/history" element={<Home user={user} setUser={setUser} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />} />
          <Route path="/messages" element={<Home user={user} setUser={setUser} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />} />
          <Route path="/edit-profile" element={<Home user={user} setUser={setUser} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />} />
          <Route path="/earnings" element={<Home user={user} setUser={setUser} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />} />
          
          {/* Lazy loaded routes */}
          <Route path="/admin/*" element={
            <React.Suspense fallback={<div className="min-h-screen bg-[#0d0e12]" />}>
              <AdminDashboard />
            </React.Suspense>
          } />
          
          <Route path="/contact" element={
            <React.Suspense fallback={<div className="min-h-screen bg-[#0d0e12]" />}>
              <ContactPage user={user} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
            </React.Suspense>
          } />

          <Route path="/:slug" element={
            <React.Suspense fallback={<div className="min-h-screen bg-[#0d0e12]" />}>
              <DynamicRouteResolver user={user} siteSettings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
            </React.Suspense>
          } />
          
          <Route path="*" element={
            <React.Suspense fallback={<div className="min-h-screen bg-[#0d0e12]" />}>
              <NotFound />
            </React.Suspense>
          } />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          <Route path="/install" element={
            <React.Suspense fallback={<div className="min-h-screen bg-[#0d0e12]" />}>
              <InstallWizard />
            </React.Suspense>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
