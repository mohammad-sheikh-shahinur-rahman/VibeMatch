import React, { useState, useEffect } from 'react';
import { X, Heart, Users, UserPlus, UserCheck, AlertCircle } from 'lucide-react';
import { getFlagEmoji } from '../lib/countries';
import { authStorage } from '../lib/auth';
import toast from 'react-hot-toast';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
  token?: string;
  currentUserId?: string;
  onOpenMessageWith?: (partnerId: string) => void;
}

export function UserProfileModal({ userId, onClose, token: propToken, currentUserId, onOpenMessageWith }: UserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const effectiveToken = propToken || authStorage.getToken() || '';

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        
        // Record profile view
        if (effectiveToken && currentUserId !== userId) {
          fetch(`/api/users/${userId}/view`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${effectiveToken}` }
          }).catch(() => {});
        }
      } else {
        setError('Failed to load profile');
      }
    } catch (e) {
      setError('An error occurred while loading profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!effectiveToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${effectiveToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user?.following?.includes(userId)) {
          setIsFollowing(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (profile && effectiveToken) {
      checkFollowStatus();
    }
  }, [profile, effectiveToken]);

  const handleFollowToggle = async () => {
    if (!effectiveToken) {
      alert('Please sign in to follow users');
      return;
    }
    setFollowLoading(true);
    try {
      const endpoint = isFollowing ? `/api/users/${userId}/unfollow` : `/api/users/${userId}/follow`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${effectiveToken}` }
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setProfile((prev: any) => ({
          ...prev,
          followersCount: Math.max(0, (prev?.followersCount || 0) + (isFollowing ? -1 : 1))
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
      <div className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-300">{error}</p>
          </div>
        ) : profile ? (
          <>
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 relative"></div>
            
            {/* Avatar */}
            <div className="flex justify-center -mt-16 relative z-10">
              <div className="p-1.5 bg-[#1a1c23] rounded-full">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-28 h-28 rounded-full object-cover bg-gray-800"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 pt-2 text-center">
              <h2 className="text-2xl font-bold text-white mb-0.5 flex items-center justify-center gap-2">
                {profile.name}
                {profile.vipExpiry && new Date(profile.vipExpiry) > new Date() && (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                    👑 VIP
                  </span>
                )}
              </h2>
              <p className="text-[#00E676] text-sm font-medium mb-3">
                @{profile.username}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
                <span>{getFlagEmoji(profile.countryCode)}</span>
                <span>{profile.country || 'Global'}</span>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-8 border-y border-white/5 py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-pink-500 mb-1">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="font-bold">{profile.likesCount || 0}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Likes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">{profile.followersCount || 0}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Followers</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                    <UserCheck className="w-4 h-4" />
                    <span className="font-bold">{profile.followingCount || 0}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Following</div>
                </div>
              </div>

              {/* Action Buttons */}
              {currentUserId !== profile.id && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isFollowing
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-[#00E676] hover:bg-[#00c853] text-black font-extrabold shadow-[0_0_20px_rgba(0,230,118,0.4)]'
                    }`}
                  >
                    {followLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Follow
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (profile.isMutualFollow) {
                        onClose();
                        onOpenMessageWith?.(profile.id);
                      } else {
                        toast.error("This user does not follow you. Mutual follow is required to send messages.");
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      profile.isMutualFollow
                        ? 'bg-[#00E676]/10 text-[#00E676] hover:bg-[#00E676] hover:text-black'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                    title={profile.isMutualFollow ? "Send Direct Message" : "Mutual follow required"}
                  >
                    Message
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
