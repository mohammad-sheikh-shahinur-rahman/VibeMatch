import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, MessageSquare, MapPin, Heart, ArrowRight } from 'lucide-react';
import { User } from '../types';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/auth';

interface ProfileData {
  id: string;
  name: string;
  username: string;
  avatar: string;
  country: string;
  countryCode: string;
  bio?: string;
  age?: number;
  gender?: string;
  likesCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export default function UserProfilePage({ currentUser, siteSettings, activeLanguages, currentLang, setCurrentLang }: { currentUser: User | null, siteSettings?: any, activeLanguages?: any[], currentLang?: any, setCurrentLang?: any }) {
  const { username, slug } = useParams<{ username?: string, slug?: string }>();
  const navigate = useNavigate();
  const t = (key: string) => currentLang?.translations?.[key] || key;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const actualUsername = username || slug;
  // Normalize username (remove @ if present)
  const normalizedUsername = actualUsername?.startsWith('@') ? actualUsername.substring(1) : actualUsername;

  useEffect(() => {
    async function loadProfile() {
      if (!normalizedUsername) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/users/by-username/${normalizedUsername}`);
        if (!res.ok) {
          throw new Error('User not found');
        }
        const data = await res.json();
        
        let isFollowing = false;
        if (currentUser) {
           isFollowing = currentUser.following?.includes(data.profile.id) || false;
           // Record view in the background
           if (currentUser.id !== data.profile.id) {
             apiFetch(`/api/users/${data.profile.id}/view`, { method: 'POST' }).catch(() => {});
           }
        }

        setProfile({ ...data.profile, isFollowing });
      } catch (err) {
        setError('User not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [normalizedUsername, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please log in to follow users');
      return;
    }
    if (!profile) return;
    
    if (profile.id === currentUser.id) {
       toast.error("You cannot follow yourself");
       return;
    }

    try {
      setActionLoading(true);
      if (profile.isFollowing) {
        await apiFetch(`/api/users/${profile.id}/unfollow`, { method: 'POST' });
        setProfile(prev => prev ? { ...prev, isFollowing: false, followersCount: Math.max(0, prev.followersCount - 1) } : null);
        toast.success(`Unfollowed @${profile.username}`);
      } else {
        await apiFetch(`/api/users/${profile.id}/follow`, { method: 'POST' });
        setProfile(prev => prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null);
        toast.success(`Following @${profile.username}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
     if (!currentUser) {
       toast.error('Please log in to send messages');
       return;
     }
     if (profile?.id === currentUser.id) {
        toast.error('You cannot message yourself');
        return;
     }
     
     // Check if they follow us. If `currentUser.followers` is empty or doesn't include them:
     const theyFollowUs = currentUser.followers?.includes(profile!.id);
     const weFollowThem = profile!.isFollowing;

     if (!theyFollowUs) {
       toast.error('rah madarx lik follow. Mutual follow is required to send messages.');
       return;
     }
     
     if (theyFollowUs && !weFollowThem) {
       toast.error('You need to follow this user first to send messages.');
       return;
     }
     
     navigate(`/messages?chat=${profile?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E676]"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
        <p className="text-gray-400 mb-8">The user @{normalizedUsername} doesn't exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#00E676] text-black font-semibold rounded-full hover:bg-[#00c968] transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  const isSelf = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0d0e12]/80 backdrop-blur-md border-b border-gray-800 p-4 flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-800 rounded-full transition mr-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-display">{profile.name}</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full pb-20">
        {/* Cover Photo Area (Gradient placeholder) */}
        <div className="h-48 w-full bg-gradient-to-r from-[#00E676]/20 to-blue-500/20"></div>

        {/* Profile Info */}
        <div className="px-4 -mt-16 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="relative">
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-32 h-32 rounded-full border-4 border-[#0d0e12] object-cover bg-gray-800"
              />
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-[#0d0e12] rounded-full"></div>
            </div>
            
            {!isSelf && (
              <div className="flex gap-2">
                <button 
                  onClick={handleMessage}
                  className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-700 hover:bg-gray-800 transition text-white"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleFollow}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-full font-bold transition flex items-center gap-2 ${
                    profile.isFollowing 
                      ? 'border border-gray-700 hover:bg-gray-800 text-white' 
                      : 'bg-[#00E676] text-black hover:bg-[#00c968]'
                  }`}
                >
                  {profile.isFollowing ? (
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
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display">{profile.name}</h2>
            <p className="text-gray-400">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-gray-300 mb-4 whitespace-pre-wrap">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.country}</span>
            </div>
            {profile.age && (
              <div className="flex items-center gap-1">
                <span>{profile.age} years old</span>
                {profile.gender && <span className="capitalize">• {profile.gender}</span>}
              </div>
            )}
          </div>

          <div className="flex gap-6 mb-8 border-t border-b border-gray-800 py-4">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">{profile.followingCount}</span>
              <span className="text-gray-500 text-sm">Following</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">{profile.followersCount}</span>
              <span className="text-gray-500 text-sm">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">{profile.likesCount}</span>
              <span className="text-gray-500 text-sm">Likes</span>
            </div>
          </div>
          
          {/* Action to match */}
          {!isSelf && (
            <div 
              onClick={() => navigate('/')}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#00E676]/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00E676]/10 flex items-center justify-center text-[#00E676]">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Find your next match</h3>
                  <p className="text-sm text-gray-400">Return to video chat</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
