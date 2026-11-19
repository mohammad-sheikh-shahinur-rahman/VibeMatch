import React, { useState, useEffect, useRef } from 'react';
import { Video, Clock, MessageSquare, Bell, User as UserIcon, Shield, Menu, CheckCircle } from 'lucide-react';
import { FreeFireDiamond } from './FreeFireDiamond';
import { User, Notification } from '../types';
import { getNotifications, markNotificationAsRead } from '../lib/auth';

interface HeaderProps {
  activeTab: 'video-chat' | 'history' | 'messages' | 'admin';
  setActiveTab: (tab: 'video-chat' | 'history' | 'messages' | 'admin') => void;
  user: User | null;
  onOpenShop: () => void;
  onOpenDrawer: () => void;
  onOpenAuthModal: () => void;
  settings?: any;
  onlineUsers?: number | null;
  activeLanguages?: any[];
  currentLang?: any;
  setCurrentLang?: (l: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenShop,
  onOpenDrawer,
  onOpenAuthModal,
  settings,
  onlineUsers,
  activeLanguages,
  currentLang,
  setCurrentLang
}) => {
  const t = (key: string) => currentLang?.translations?.[key] || key;
  
  const getFlagUrl = (flag?: string, code?: string) => {
    const codeMap: Record<string, string> = {
      en: 'us.svg',
      fr: 'fr.svg',
      ar: 'sa.svg',
      es: 'es.svg',
      it: 'it.svg',
      hi: 'in.svg',
      ru: 'ru.svg'
    };
    if (!flag || !flag.includes('.')) {
      const c = code?.toLowerCase() || '';
      return `/images/flags/${codeMap[c] || `${c || 'us'}.svg`}`;
    }
    return flag.startsWith('/') ? flag : `/images/flags/${flag}`;
  };

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    const notifs = await getNotifications();
    setNotifications(notifs);
  };

  const handleReadNotification = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="glass-dark sticky top-0 z-40 px-2.5 sm:px-6 h-16 flex items-center justify-between w-full max-w-full shrink-0">
      {/* Left: Brand Logo & Navigation */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {/* Logo */}
        <button 
          onClick={() => setActiveTab('video-chat')}
          className="flex items-center space-x-1.5 sm:space-x-2 group focus:outline-none shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center text-black font-extrabold text-lg sm:text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] group-hover:scale-105 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-white/20 w-1/2 h-full -skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-700"></div>
            {settings?.logoUrl && settings.logoUrl.length > 3 ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              settings?.logoUrl || '⚡'
            )}
          </div>
          <span className="hidden sm:block text-lg sm:text-2xl font-black tracking-tight text-white group-hover:text-[#10b981] transition-colors ml-0.5 sm:ml-1">
            {settings?.siteName || 'VibeMatch'}
          </span>
        </button>

        {/* Online Users Counter (Desktop) */}
        {onlineUsers !== null && onlineUsers !== undefined && (
          <div className="hidden lg:flex items-center space-x-1.5 bg-[#00E676]/10 border border-[#00E676]/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,230,118,0.1)] ml-4">
            <div className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse shadow-[0_0_5px_#00E676]"></div>
            <span className="text-xs font-bold text-[#00E676]">
              {onlineUsers.toLocaleString()} Online
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 pl-4">
          <button
            onClick={() => setActiveTab('video-chat')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'video-chat'
                ? 'bg-white/10 text-[#00E676] shadow-inner backdrop-blur-md border border-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{t('Video Chat')}</span>
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuthModal();
                return;
              }
              setActiveTab('history');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'history'
                ? 'bg-white/10 text-[#00E676] shadow-inner backdrop-blur-md border border-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('History')}</span>
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuthModal();
                return;
              }
              setActiveTab('messages');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'messages'
                ? 'bg-white/10 text-[#00E676] shadow-inner backdrop-blur-md border border-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('Messages')}</span>
          </button>
        </nav>
      </div>

      {/* Right: Bonus Banner, Gems Shop, Notifications, Profile Avatar */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Language Selector */}
        {activeLanguages && activeLanguages.length > 1 && currentLang && (
          <div className="relative shrink-0" ref={langDropdownRef}>
            <button 
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center space-x-1 bg-[#1e293b]/50 hover:bg-[#1e293b] border border-gray-700/50 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-all"
            >
              <img 
                src={getFlagUrl(currentLang.flag, currentLang.code)} 
                alt={currentLang.name} 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                onError={(e) => {
                  const fallback = `/images/flags/${currentLang.code === 'en' ? 'us' : currentLang.code}.svg`;
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
            </button>
            
            {showLangDropdown && (
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-2 w-40 sm:w-48 bg-[#181a20] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                {activeLanguages.map((lang: any) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (setCurrentLang) setCurrentLang(lang);
                      localStorage.setItem('vibematch_lang', lang.code);
                      document.documentElement.dir = lang.rtl ? 'rtl' : 'ltr';
                      setShowLangDropdown(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-800 transition-colors ${currentLang.code === lang.code ? 'bg-gray-800/50' : ''}`}
                  >
                    <img 
                      src={getFlagUrl(lang.flag, lang.code)} 
                      alt={lang.name} 
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        const fallback = `/images/flags/${lang.code === 'en' ? 'us' : lang.code}.svg`;
                        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                      }}
                    />
                    <span className="text-sm text-gray-200 font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        

        {/* Shop Gems Button - Free Fire Diamond style (Screenshot 3 & 4) */}
        {user && (
          <button
            onClick={onOpenShop}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-[#0f172a]/90 hover:bg-[#1e293b] border border-cyan-500/40 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-black text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <FreeFireDiamond className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="font-extrabold text-xs hidden sm:inline">Shop</span>
            <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold ml-0.5">
              {user.gems}
            </span>
          </button>
        )}

        {/* Notification Bell */}
        {user && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-[-45px] sm:right-0 mt-3 w-80 max-w-[calc(100vw-24px)] bg-[#181a20] border border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`px-4 py-3 hover:bg-gray-800/50 flex flex-col space-y-2 transition-colors ${!notif.isRead ? 'bg-[#00E676]/5' : ''}`}
                        onClick={() => !notif.isRead && handleReadNotification(notif.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <img src={notif.fromUserAvatar} alt={notif.fromUserName} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                          <div className="flex-1 cursor-pointer">
                            <p className="text-sm text-gray-200">
                              <span className="font-bold text-white">{notif.fromUserName}</span>
                              {notif.type === 'follow' ? ' started following you' : ` sent you a ${notif.type}`}
                            </p>
                            <span className="text-xs text-gray-500">{new Date(notif.timestamp).toLocaleDateString()}</span>
                          </div>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-[#00E676] mt-1.5" />}
                        </div>
                        {notif.type === 'follow' && (
                          <div className="flex items-center space-x-2 pl-13 ml-12">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/@${notif.fromUserUsername || notif.fromUserName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;
                              }}
                              className="text-[10px] bg-[#00E676]/20 text-[#00E676] px-3 py-1.5 rounded-full font-bold hover:bg-[#00E676]/30 transition-colors"
                            >
                              View Profile & Follow Back
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Avatar / Menu Trigger */}
        {user ? (
          <button
            onClick={onOpenDrawer}
            className="flex items-center group focus:outline-none overflow-hidden rounded-full shrink-0"
          >
            <img
              src={user.avatar}
              alt={user.name}
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff`; }}
              className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] rounded-full object-cover border-2 border-[#00E676] group-hover:opacity-90 transition-opacity bg-gray-800 shrink-0"
            />
          </button>
        ) : (
          <button 
            onClick={onOpenAuthModal}
            className="bg-white hover:bg-gray-200 text-black px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 shrink-0"
          >
            Sign In
          </button>
        )}

        {/* Mobile Menu Icon */}
        
      </div>
    </header>
  );
};
