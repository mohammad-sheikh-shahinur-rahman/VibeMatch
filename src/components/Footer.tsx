import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { AdminSettings } from '../types';

interface FooterProps {
  settings?: AdminSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const [pages, setPages] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/pages')
      .then(res => res.json())
      .then(data => {
        if (data.pages) setPages(data.pages);
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="mt-auto border-t border-gray-800 bg-[#0d0e12]/80 backdrop-blur-md pb-8 pt-10 hidden md:block">
      <div className="w-full px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center text-black font-extrabold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {settings?.logoUrl && settings.logoUrl.length > 3 ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  '⚡'
                )}
              </div>
              <span className="text-xl font-black text-white">{settings?.siteName || 'VibeMatch'}</span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm">
              {settings?.footerDescription || 'Connect with real people instantly. The most secure, fast, and exciting video chat platform.'}
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Follow Us</h4>
            <div className="flex items-center space-x-4">
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-900 rounded-full hover:bg-blue-600 hover:text-white text-gray-400 transition-all shadow-sm">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-900 rounded-full hover:bg-pink-600 hover:text-white text-gray-400 transition-all shadow-sm">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-900 rounded-full hover:bg-sky-500 hover:text-white text-gray-400 transition-all shadow-sm">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings?.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-900 rounded-full hover:bg-white hover:text-black text-gray-400 transition-all shadow-sm">
                  {/* Since Lucide might not have tiktok, fallback to an icon or SVG */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.25-.9 4.54-2.5 6.13-1.84 1.83-4.5 2.82-7.1 2.5-2.8-.35-5.22-2.15-6.3-4.73-1.13-2.67-.84-5.83 1.05-8.09 1.6-1.92 4.12-2.88 6.55-2.56.12.02.24.03.36.05v4.06c-.66-.19-1.4-.23-2.08-.06-1.07.27-1.89 1.14-2.21 2.19-.24.78-.17 1.65.25 2.36.43.74 1.25 1.25 2.1 1.34 1.05.12 2.12-.26 2.8-1.01.69-.76 1.01-1.79.99-2.83-.02-4.94 0-9.88-.01-14.82z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Download App Buttons */}
          <div className="flex flex-col items-center md:items-end space-y-4">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Get The App</h4>
             <div className="flex items-center space-x-3">
               {(!settings?.appStoreUrl && !settings?.playStoreUrl) && (
                 <span className="text-sm text-gray-600">Coming Soon!</span>
               )}
               {settings?.appStoreUrl && (
                 <a href={settings.appStoreUrl} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105 active:scale-95">
                    <img src="/images/app-store-badge.png" alt="Download on App Store" className="h-[40px]" />
                 </a>
               )}
               {settings?.playStoreUrl && (
                 <a href={settings.playStoreUrl} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105 active:scale-95">
                    <img src="/images/google-play-badge.png" alt="Get it on Google Play" className="h-[40px]" />
                 </a>
               )}
             </div>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>{settings?.footerCopyright || `© ${new Date().getFullYear()} ${settings?.siteName || 'VibeMatch'}. All rights reserved.`}</p>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            {pages.map(page => (
              <a key={page.slug} href={`/${page.slug}`} className="hover:text-white transition-colors">{page.title}</a>
            ))}
            <a href="/contact" className="hover:text-white transition-colors">Contact Us</a>
          </div>

        </div>
      </div>
    </footer>
  );
};
