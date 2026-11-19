import React, { useState } from 'react';
import { User as UserIcon, Settings, Edit3, LogOut, Copy, Check, ExternalLink, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenShop: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onOpenShop,
  onOpenAdmin,
  onLogout,
  onUpdateUser
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shortId = user?.id ? user.id.substring(0, 12).toLowerCase() : '18i102m1m0hn3';

  const copyId = () => {
    navigator.clipboard.writeText(shortId.replace(/^u_/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="absolute top-16 right-6 z-50 bg-[#1c1c1e] rounded-3xl w-72 text-white shadow-2xl border border-white/10 overflow-hidden animate-fadeIn pb-2">
        {user ? (
          <div className="p-5 pb-4 border-b border-white/5">
            <div className="flex items-center space-x-4">
              <Link to={`/@${user.username || user.name}`} onClick={onClose}>
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover bg-gray-800 hover:scale-105 transition-transform"
                />
              </Link>
              <div>
                <div className="flex items-center space-x-1">
                  <Link to={`/@${user.username || user.name}`} onClick={onClose}>
                    <h3 className="font-bold text-lg leading-tight flex items-center gap-1 hover:underline">
                      {user.name}
                      {user.vipExpiry && new Date(user.vipExpiry) > new Date() && (
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                          👑 VIP
                        </span>
                      )}
                    </h3>
                  </Link>
                  <div className="bg-white/10 p-0.5 rounded-full">
                    <UserIcon className="w-3 h-3 text-white/50" />
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-white/70 mt-1">
                  <img src={`/images/flags/${user.countryCode?.toLowerCase() || 'ma'}.png`} alt="flag" className="h-3 rounded-sm object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span>{user.countryCode || 'MA'}</span>
                  <span>|</span>
                  <span>{user.gender === 'male' ? '♂ Male' : user.gender === 'female' ? '♀ Female' : 'Other'}</span>
                </div>
                <div className="mt-2 flex items-center space-x-2 bg-white/5 px-2 py-1 rounded-lg w-max">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">ID</span>
                  <span className="text-xs font-mono text-white/80">{shortId.replace(/^u_/, '')}</span>
                  <button onClick={copyId} className="text-white/40 hover:text-white transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 border-b border-white/5 text-center">
            <p className="text-sm text-gray-400">Guest User</p>
          </div>
        )}

        <div className="py-2">
          <Link 
            to={`/@${user?.username || user?.name}`}
            onClick={onClose}
            className="w-full flex items-center space-x-4 px-6 py-3 hover:bg-white/5 transition-colors text-left"
          >
            <ExternalLink className="w-5 h-5 text-[#00E676]" />
            <span className="font-bold text-[15px] text-[#00E676]">View Profile</span>
          </Link>

          <Link 
            to="/edit-profile"
            onClick={onClose}
            className="w-full flex items-center space-x-4 px-6 py-3 hover:bg-white/5 transition-colors text-left"
          >
            <UserIcon className="w-5 h-5 text-white/80" />
            <span className="font-bold text-[15px]">Edit Profile</span>
          </Link>

          <Link 
            to="/earnings"
            onClick={onClose}
            className="w-full flex items-center space-x-4 px-6 py-3 hover:bg-white/5 transition-colors text-left"
          >
            <DollarSign className="w-5 h-5 text-[#00E676]" />
            <span className="font-bold text-[15px] text-[#00E676]">Earnings & Cashout</span>
          </Link>
          
          <button 
            onClick={() => { onClose(); window.location.href = '/contact'; }}
            className="w-full flex items-center space-x-4 px-6 py-3 hover:bg-white/5 transition-colors text-left"
          >
            <Edit3 className="w-5 h-5 text-white/80" />
            <span className="font-bold text-[15px]">Contact us</span>
          </button>
          
          <button 
            onClick={() => { onClose(); onLogout(); }}
            className="w-full flex items-center space-x-4 px-6 py-3 hover:bg-white/5 transition-colors text-left text-white"
          >
            <LogOut className="w-5 h-5 text-white/80" />
            <span className="font-bold text-[15px]">Log out</span>
          </button>
        </div>
      </div>
    </>
  );
};
