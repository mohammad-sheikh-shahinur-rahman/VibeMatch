import React, { useState } from 'react';
import { Header } from '../components/Header';
import { VideoChatView } from '../components/VideoChatView';
import { HistoryView } from '../components/HistoryView';
import { MessagesView } from '../components/MessagesView';
import { GenderFilterModal } from '../components/GenderFilterModal';
import { ShopModal } from '../components/ShopModal';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { AuthModal } from '../components/AuthModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { EarningsModal } from '../components/EarningsModal';
import { Footer } from '../components/Footer';
import { MatchFilter, MatchPartner, User, AdminSettings } from '../types';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { submitReport } from '../lib/auth';
import { Video, Clock, MessageSquare } from 'lucide-react';

interface HomeProps {
  user: User | null;
  setUser: (u: User | null) => void;
  siteSettings: AdminSettings | null;
  activeLanguages?: any[];
  currentLang?: any;
  setCurrentLang?: (l: any) => void;
}

export const Home: React.FC<HomeProps> = ({ user, setUser, siteSettings, activeLanguages, currentLang, setCurrentLang }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const activeTab = location.pathname === '/history' ? 'history' : 
                    location.pathname === '/messages' ? 'messages' : 
                    'video-chat';

  const setActiveTab = (tab: 'video-chat' | 'history' | 'messages') => {
    if (tab === 'video-chat') navigate('/');
    else navigate(`/${tab}`);
  };

  const [selectedPartnerForChat, setSelectedPartnerForChat] = useState<string | undefined>(undefined);
  const [isCallActive, setIsCallActive] = useState(false);

  React.useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam) {
       setSelectedPartnerForChat(chatParam);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (activeTab === 'video-chat') {
      document.title = siteSettings?.seoTitle || siteSettings?.siteName || 'VibeMatch';
    } else {
      let tabName = activeTab === 'history' ? 'History' : 'Messages';
      document.title = `${tabName} - ${siteSettings?.siteName || 'VibeMatch'}`;
    }
  }, [activeTab, siteSettings?.seoTitle, siteSettings?.siteName]);

  // Filters State
  const [filter, setFilter] = useState<MatchFilter>({
    gender: 'both',
    country: 'All Countries',
    superMatch: false
  });

  // Modals & Drawers
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [reportModalPartner, setReportModalPartner] = useState<MatchPartner | null>(null);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Inappropriate video stream content');
  const [reportDetails, setReportDetails] = useState<string>('');

  const handleUpdateGems = (newGems: number) => {
    if (user) {
      setUser({ ...user, gems: newGems });
    }
  };

  const [onlineUsers, setOnlineUsers] = useState<number | null>(null);

  React.useEffect(() => {
    let interval: any;
    const fetchOnline = async () => {
      try {
        const res = await fetch('/api/stats/online');
        const data = await res.json();
        setOnlineUsers(data.onlineUsers);
      } catch (e) {}
    };
    if (siteSettings?.showOnlineUsers !== false) {
      fetchOnline();
      interval = setInterval(fetchOnline, 10000);
    }
    return () => clearInterval(interval);
  }, [siteSettings?.showOnlineUsers]);

  const [isEarningsModalOpen, setIsEarningsModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (location.pathname === '/edit-profile') {
      if (user) {
        setIsEditProfileModalOpen(true);
      } else {
        // If not logged in but trying to edit profile, show auth
        setIsAuthModalOpen(true);
      }
    }
    if (location.pathname === '/earnings') {
      if (user) {
        setIsEarningsModalOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
    }
  }, [location.pathname, user]);

  const handleEditProfileClose = () => {
    setIsEditProfileModalOpen(false);
    if (location.pathname === '/edit-profile') {
      navigate('/');
    }
  };

  const handleEarningsClose = () => {
    setIsEarningsModalOpen(false);
    if (location.pathname === '/earnings') {
      navigate('/');
    }
  };

  const handleReportSubmit = async () => {
    if (!reportModalPartner) return;
    try {
      await submitReport(
        reportModalPartner.id,
        reportModalPartner.name,
        reportModalPartner.avatar,
        reportReason,
        reportDetails
      );
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModalPartner(null);
        setReportReason('Inappropriate video stream content');
        setReportDetails('');
      }, 1500);
    } catch (e) {
      alert('Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0d0e12] text-white flex flex-col font-sans selection:bg-[#00E676] selection:text-black overflow-x-hidden">
      <div className={isCallActive ? 'hidden md:block' : 'block'}>
        <Header
          activeTab={activeTab as any}
          setActiveTab={setActiveTab as any}
          user={user}
          onOpenShop={() => setIsShopModalOpen(true)}
          onOpenDrawer={() => setIsProfileDrawerOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onlineUsers={onlineUsers}
          settings={siteSettings}
          activeLanguages={activeLanguages}
          currentLang={currentLang}
          setCurrentLang={setCurrentLang}
        />
      </div>

      <main 
        className="flex-1 flex flex-col relative w-full shrink-0 overflow-hidden min-h-0 md:min-h-[calc(100dvh-64px)]"
      >
        {activeTab === 'video-chat' && (
          <VideoChatView
            user={user}
            filter={filter}
            onOpenFilterModal={() => setIsFilterModalOpen(true)}
            onOpenShopModal={() => setIsShopModalOpen(true)}
            onReportUser={(partner) => setReportModalPartner(partner)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onlineUsers={onlineUsers}
            onUpdateGems={handleUpdateGems}
            onCallStateChange={setIsCallActive}
            onOpenMessageWith={(partnerId) => {
              setSelectedPartnerForChat(partnerId);
              setActiveTab('messages');
            }}
          />
        )}



        {activeTab === 'history' && (
          <HistoryView
            onStartChatting={() => setActiveTab('video-chat')}
            onOpenMessageWith={(partnerId) => {
              setSelectedPartnerForChat(partnerId);
              setActiveTab('messages');
            }}
          />
        )}
        {activeTab === 'messages' && (
          <MessagesView
            user={user}
            selectedPartnerId={selectedPartnerForChat}
            onMeetSomeoneNew={() => setActiveTab('video-chat')}
            onOpenShopModal={() => setIsShopModalOpen(true)}
            onUpdateGems={handleUpdateGems}
          />
        )}
      </main>

      {/* VibeMatch Mobile Bottom Navigation Bar */}
      {!isCallActive && (
      <nav className="md:hidden sticky bottom-0 z-40 bg-[#0d0e12]/95 backdrop-blur-xl border-t border-white/10 px-8 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('video-chat')}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            activeTab === 'video-chat' ? 'text-[#00E676]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'video-chat' ? 'bg-[#00E676]/10' : ''}`}>
            <Video className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black tracking-wide">Video Chat</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setActiveTab('history');
          }}
          className={`flex flex-col items-center space-y-1 relative transition-colors ${
            activeTab === 'history' ? 'text-[#00E676]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full relative ${activeTab === 'history' ? 'bg-[#00E676]/10' : ''}`}>
            <Clock className="w-5 h-5" />
            <span className="absolute 0 top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0d0e12]" />
          </div>
          <span className="text-[10px] font-black tracking-wide">History</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            setActiveTab('messages');
          }}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            activeTab === 'messages' ? 'text-[#00E676]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'messages' ? 'bg-[#00E676]/10' : ''}`}>
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black tracking-wide">Messages</span>
        </button>
      </nav>
      )}
      
      <div className="hidden md:block">
        <Footer settings={siteSettings} />
      </div>

      <GenderFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filter={filter}
        onSaveFilter={(newFilter) => setFilter(newFilter)}
        onStartChat={() => setActiveTab('video-chat')}
        isVip={user?.vipExpiry ? new Date(user.vipExpiry) > new Date() : false}
      />

      <ShopModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        user={user}
        onUpdateGems={handleUpdateGems}
      />

      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        user={user}
        onOpenShop={() => setIsShopModalOpen(true)}
        onOpenAdmin={() => navigate('/admin/overview')}
        onLogout={() => {
          import('../lib/auth').then(({ authStorage }) => authStorage.removeToken());
          setUser(null);
          setIsProfileDrawerOpen(false);
        }}
        onUpdateUser={(u) => setUser(u)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u, isNew) => {
          setUser(u);
          if (isNew) {
            setIsEditProfileModalOpen(true);
          }
        }}
        settings={siteSettings}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={handleEditProfileClose}
        user={user}
        onUpdate={(u) => setUser(u)}
      />

      {user && (
        <EarningsModal
          isOpen={isEarningsModalOpen}
          onClose={handleEarningsClose}
          user={user}
          siteSettings={siteSettings}
          setUser={setUser}
        />
      )}

      {reportModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1d24] border border-red-500/40 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-lg text-white">Report {reportModalPartner.name}?</h3>
            <p className="text-xs text-gray-400">
              Submit a content report to VibeMatch safety moderators.
            </p>

            {reportSuccess ? (
              <div className="p-3 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] rounded-xl text-xs font-bold text-center">
                ✓ Report submitted to safety moderators
              </div>
            ) : (
              <div className="space-y-3">
                <select 
                  className="w-full bg-gray-900 border border-gray-700 text-xs text-white rounded-xl p-2.5"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="Inappropriate video stream content">Inappropriate video stream content</option>
                  <option value="Spam or commercial advertising">Spam or commercial advertising</option>
                  <option value="Harassment or offensive text">Harassment or offensive text</option>
                  <option value="Underage user">Underage user</option>
                </select>

                <textarea
                  className="w-full bg-gray-900 border border-gray-700 text-xs text-white rounded-xl p-2.5 min-h-[80px] resize-none focus:outline-none focus:border-red-500"
                  placeholder="Optional: Provide more details..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={handleReportSubmit}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition-colors"
                  >
                    Submit Report
                  </button>
                  <button
                    onClick={() => setReportModalPartner(null)}
                    className="flex-1 bg-gray-800 text-gray-300 font-bold text-xs py-2.5 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
