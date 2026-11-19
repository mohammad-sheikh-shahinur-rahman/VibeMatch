import toast from 'react-hot-toast';
import { Rnd } from 'react-rnd';
import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { 
  Video, Mic, MicOff, Camera, RefreshCw, Heart, Gift, Flag, MessageSquare, 
  ChevronDown, ChevronRight, Globe, Sparkles, Send, ShieldAlert, X, Volume2, VolumeX,
  Play, Pause, Award, Maximize2, ShoppingBag, Smile, SlidersHorizontal, User as UserIcon
, UserPlus, UserMinus } from 'lucide-react';
import { FreeFireDiamond } from './FreeFireDiamond';
import { MatchFilter, MatchPartner, User } from '../types';
import { sendMessage, authStorage, toggleLike, apiFetch, subscribeToVip, toggleFollow } from '../lib/auth';
import { io, Socket } from 'socket.io-client';
import { UserProfileModal } from './UserProfileModal';
import { getFlagEmoji } from '../lib/countries';
import { Link } from 'react-router-dom';
import { GiftSelectionModal, GiftItem } from './GiftSelectionModal';
import { VipSubscriptionModal } from './VipSubscriptionModal';

interface VideoChatViewProps {
  user: User | null;
  filter: MatchFilter;
  onOpenFilterModal: () => void;
  onOpenShopModal: () => void;
  onReportUser: (partner: MatchPartner) => void;
  onOpenAuthModal: () => void;
  onOpenMessageWith?: (partnerId: string) => void;
  onlineUsers?: number | null;
  onUpdateGems?: (gems: number) => void;
  onCallStateChange?: (isActive: boolean) => void;
}

// 1. ISOLATED LIVE CHAT MESSAGES OVERLAY
const LiveChatMessagesOverlay = memo(({
  messages,
  isVisible
}: {
  messages: { sender: 'me' | 'partner'; text: string; id: string; giftImage?: string }[];
  isVisible: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-3 bottom-20 right-3 md:left-6 md:bottom-24 md:right-6 max-h-36 md:max-h-48 overflow-y-auto space-y-2 md:space-y-3 pointer-events-none p-1 md:p-2 scrollbar-none z-30 flex flex-col"
    >
      {messages.map(m => (
        <div
          key={m.id}
          className={`max-w-[80%] p-2.5 md:p-3.5 rounded-2xl text-[13px] md:text-[15px] font-medium backdrop-blur-md shadow-2xl animate-slideUp flex flex-col gap-2 ${
            m.sender === 'me'
              ? 'bg-gradient-to-r from-[#00E676] to-[#047857] text-black font-extrabold ml-auto rounded-br-sm items-end'
              : 'bg-black/70 text-white rounded-bl-sm border border-white/15 items-start'
          }`}
        >
          {m.giftImage && (
            <img src={m.giftImage} alt="Gift" className="w-12 h-12 object-contain" />
          )}
          <span>{m.text}</span>
        </div>
      ))}
    </div>
  );
});

LiveChatMessagesOverlay.displayName = 'LiveChatMessagesOverlay';

// 2. ISOLATED CHAT INPUT COMPONENT
const ChatInputSection = memo(({
  onSendMessage, onToggleLike, onSendGift, onNextMatch, liked, skipCooldown, isMobile }: {
  onSendMessage: (msg: string) => void;
  onToggleLike: () => void;
  onSendGift: () => void;
  onNextMatch: () => void;
  liked: boolean;
  skipCooldown?: number;
  isMobile?: boolean;
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanMsg = message.trim();
    if (!cleanMsg) return;
    onSendMessage(cleanMsg);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-1.5 md:p-2 bg-black/60 backdrop-blur-xl border border-white/20 flex items-center space-x-2 md:space-x-3 pointer-events-auto w-full rounded-2xl shadow-2xl"
    >
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Type a message..."
        className="flex-1 min-w-0 bg-transparent px-3 md:px-4 py-1.5 md:py-2 text-[13px] md:text-[15px] text-white focus:outline-none placeholder-gray-400"
      />
      <button
        type="submit"
        disabled={!message.trim()}
        className="p-2 md:p-2.5 bg-[#00E676] hover:bg-[#00c853] disabled:opacity-40 text-black rounded-xl transition-all shadow-lg shrink-0 active:scale-95"
      >
        <Send className="w-4 h-4 md:w-5 md:h-5" />
      </button>
      <div className="hidden md:block w-px h-8 bg-white/10 mx-1 shrink-0"></div>
      {!isMobile && (
        <>
      <button
        type="button"
        onClick={onSendGift}
        className="p-2.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-xl hover:bg-cyan-500 hover:text-black transition-all shadow-lg shrink-0 flex items-center gap-1 font-bold text-xs"
        title="Send Gift"
      >
        <Gift className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onNextMatch} disabled={skipCooldown && skipCooldown > 0} className={`px-4 md:px-6 py-2 md:py-3 ${skipCooldown && skipCooldown > 0 ? 'bg-gray-600 cursor-not-allowed border-gray-500' : 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105 active:scale-95 border-red-500/50'} rounded-2xl text-white font-black text-sm md:text-lg shrink-0 ml-1 flex items-center justify-center space-x-1 border`}
        title="Next Match / Skip"
      >
        <span>{skipCooldown > 0 ? `Skip (${skipCooldown})` : 'Skip'}</span>
                    <ChevronRight className="w-4 h-4" />
        </button>
        </>
        )}
    </form>
  );
});

ChatInputSection.displayName = 'ChatInputSection';

export const VideoChatView: React.FC<VideoChatViewProps> = ({
  user,
  filter,
  onOpenFilterModal,
  onOpenShopModal,
  onReportUser,
  onOpenAuthModal,
  onOpenMessageWith,
  onlineUsers,
  onUpdateGems,
  onCallStateChange
, currentLang, setCurrentLang}) => {
  const t = (key: string) => currentLang?.translations?.[key] || key;
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [currentPartner, setCurrentPartner] = useState<MatchPartner | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (onCallStateChange) {
        onCallStateChange(!!currentPartner || isSearching);
      }
    // Bulletproof CSS hiding
    if (currentPartner || isSearching) {
      document.body.classList.add('in-video-call');
    } else {
      document.body.classList.remove('in-video-call');
    }
    
    return () => {
      document.body.classList.remove('in-video-call');
    };
  }, [currentPartner, isSearching, onCallStateChange]);

  const isSearchingRef = useRef<boolean>(false);

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  // Local Media State
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  
  // Handle open filter modal with VIP check
  const handleOpenFilterModal = () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    const isVip = user?.vipExpiry && new Date(user.vipExpiry) > new Date();
    if (!isVip) {
      setShowVipModal(true);
    } else {
      onOpenFilterModal();
    }
  };

  const [hasWebcamAccess, setHasWebcamAccess] = useState<boolean>(false);
  
  // Live Chat inside Video
  const [liveMessages, setLiveMessages] = useState<{ sender: 'me' | 'partner'; text: string; id: string; giftImage?: string }[]>([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [showMobileChatInput, setShowMobileChatInput] = useState<boolean>(false);
  const [selectedPartnerProfileId, setSelectedPartnerProfileId] = useState<string | null>(null);

  const [isChatVisible, setIsChatVisible] = useState<boolean>(true);
  const [isFollowingPartner, setIsFollowingPartner] = useState(false);
  const [skipCooldown, setSkipCooldown] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : true);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleFollow = async () => {
    if (!currentPartner || !user) return onOpenAuthModal();
    if (user.id.startsWith('guest') || !localStorage.getItem('vibematch_jwt_token') && !localStorage.getItem('vibematch_admin_jwt_token')) {
      setIsFollowingPartner(!isFollowingPartner);
      toast.success(isFollowingPartner ? 'Unfollowed ' + currentPartner.name : 'Following ' + currentPartner.name);
      return;
    }
    try {
      await toggleFollow(currentPartner.id);
      setIsFollowingPartner(!isFollowingPartner);
      toast.success(isFollowingPartner ? 'Unfollowed ' + currentPartner.name : 'Following ' + currentPartner.name);
    } catch (err) {
      toast.error('Failed to follow user');
    }
  };

  useEffect(() => {
    if (user && user.following && currentPartner) {
      setIsFollowingPartner(user.following.includes(currentPartner.id));
    } else {
      setIsFollowingPartner(false);
    }
  }, [currentPartner, user]);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [partnerSocketId, setPartnerSocketId] = useState<string>('');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const mobilePipVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileIdleVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobilePartnerVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopPartnerVideoRef = useRef<HTMLVideoElement | null>(null);

  const attachStreamToVideo = useCallback((videoNode: HTMLVideoElement | null) => {
    if (videoNode && localStream) {
      if (videoNode.srcObject !== localStream) {
        videoNode.srcObject = localStream;
      }
    }
  }, [localStream]);

  const attachRemoteStream = useCallback((videoNode: HTMLVideoElement | null) => {
    if (videoNode) {
      if (remoteStream) {
        if (videoNode.srcObject !== remoteStream) {
          videoNode.srcObject = remoteStream;
        }
      } else {
        if (videoNode.srcObject !== null) {
          videoNode.srcObject = null;
        }
      }
    }
  }, [remoteStream]);

  // Discover Users State for desktop masonry cards
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/discover')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setDiscoverUsers(data.users);
        }
      })
      .catch(err => console.error('Failed to fetch discover users:', err));
  }, []);

  // Initialize local camera stream safely
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    async function setupCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          currentStream = stream;
          setLocalStream(stream);
          setHasWebcamAccess(true);
        }
      } catch (err) {
        console.warn('Webcam permission not granted or unavailable in iframe environment:', err);
        setHasWebcamAccess(false);
      }
    }
    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run only once on mount

  // Stable local video attachment effect to all active video tags
  useEffect(() => {
    attachStreamToVideo(mobilePipVideoRef.current);
    attachStreamToVideo(mobileIdleVideoRef.current);
    attachStreamToVideo(desktopLocalVideoRef.current);
  }, [localStream, hasWebcamAccess, isCameraOff, currentPartner, isSearching, attachStreamToVideo]);

  // Stable remote stream attachment effect
  useEffect(() => {
    attachRemoteStream(mobilePartnerVideoRef.current);
    attachRemoteStream(desktopPartnerVideoRef.current);
  }, [remoteStream, currentPartner, attachRemoteStream]);

  // Socket.io Setup
  useEffect(() => {
    if (!user) return;
    
    socketRef.current = io('/');

    socketRef.current.on('match_found', async (data) => {
      if (!isSearchingRef.current) {
        socketRef.current?.emit('skip_match');
        return;
      }
      setIsMatching(true);

      try {
        const res = await fetch(`/api/users/${data.partner.id}/profile`);
        const profileData = await res.json();
        if (profileData.profile && profileData.profile.username) {
          data.partner.username = profileData.profile.username;
        }
      } catch (err) {
        console.error('Failed to fetch partner full profile', err);
      }

      setCurrentPartner(data.partner);
        setIsSearching(false);
      setPartnerSocketId(data.socketId);
      setIsChatVisible(true);
      setLiveMessages([]);

      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const res = await fetch('/api/webrtc/ice-servers');
        const iceData = await res.json();
        if (iceData && iceData.iceServers && iceData.iceServers.length > 0) {
          iceServers = iceData.iceServers;
        }
      } catch (err) {
        console.error('Failed to fetch ICE servers, using fallback');
      }

      const pc = new RTCPeerConnection({ iceServers });
      peerRef.current = pc;

      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        setRemoteStream(stream);
        if (mobilePartnerVideoRef.current) {
          mobilePartnerVideoRef.current.srcObject = stream;
        }
        if (desktopPartnerVideoRef.current) {
          desktopPartnerVideoRef.current.srcObject = stream;
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('signal', { to: data.socketId, signal: { type: 'candidate', candidate: event.candidate } });
        }
      };

      if (data.initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', { to: data.socketId, signal: { type: 'offer', sdp: offer } });
      }
    });

    socketRef.current.on('signal', async (data) => {
      if (!peerRef.current) return;
      const signal = data.signal;
      try {
        if (signal.type === 'offer') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          socketRef.current?.emit('signal', { to: data.from, signal: { type: 'answer', sdp: answer } });
        } else if (signal.type === 'answer') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate') {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error('WebRTC Signaling Error:', err);
      }
    });

    socketRef.current.on('receive_message', (data) => {
      setLiveMessages(prev => [...prev, { sender: 'partner', text: data.text, id: `msg_${Date.now()}`, giftImage: data.giftImage }]);
    });

    socketRef.current.on('partner_liked', (data: { newLikesCount: number }) => {
      setCurrentPartner(prev => prev ? { ...prev, likesCount: data.newLikesCount } : null);
    });

    socketRef.current.on('partner_skipped', () => {
        setIsSearching(true);
        resetMatchState();
      setLiked(false);
      setLiveMessages([]);
      socketRef.current?.emit('join_queue', {
        userId: user?.id || `guest_${Math.random().toString(36).substring(2, 9)}`,
        gender: user?.gender || 'other',
        country: user?.country || 'Global',
        filter: filter,
        isGuest: !user
      });
    });

    socketRef.current.on('match_error', (data) => {
      alert(data.message || 'Match error');
      setIsSearching(false);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, [user?.id, localStream]);

  const resetMatchState = () => {
    setIsMatching(false);
    setCurrentPartner(null);
    setPartnerSocketId('');
    setShowMobileChatInput(false);
    setRemoteStream(null);
    if (mobilePartnerVideoRef.current) {
      mobilePartnerVideoRef.current.srcObject = null;
    }
    if (desktopPartnerVideoRef.current) {
      desktopPartnerVideoRef.current.srcObject = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicMuted;
      });
    }
    setIsMicMuted(!isMicMuted);
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isCameraOff;
      });
    }
    setIsCameraOff(!isCameraOff);
  };

  const handleCancelMatch = () => {
    setIsSearching(false);
    socketRef.current?.emit('leave_queue');
  };

  const handleEndCall = () => {
    if (isMatching) {
      socketRef.current?.emit('skip_match');
      resetMatchState();
    }
    setIsSearching(false);
  };

  const handleNextMatch = () => {
    if (skipCooldown > 0) return;
    if (!user) {
      onOpenAuthModal();
      return;
    }

    setIsSearching(true);
      if (isMatching) {
        socketRef.current?.emit('skip_match');
        resetMatchState();
      }
    setLiked(false);
    setLiveMessages([]);
    socketRef.current?.emit('join_queue', { userId: user.id, gender: filter.gender, country: filter.country });
  };

  const handleSendLiveMessage = async (userText: string) => {
    if (!userText.trim() || !currentPartner || !partnerSocketId) return;

    const newMsg = { sender: 'me' as const, text: userText.trim(), id: `msg_${Date.now()}` };
    setLiveMessages(prev => [...prev, newMsg]);

    socketRef.current?.emit('send_message', { to: partnerSocketId, text: userText.trim() });

    if (user) {
      sendMessage(user.id, currentPartner.id, userText.trim());
    }
  };

  const handleSendGift = () => {
    setShowGiftModal(true);
  };

  const handleSelectGift = async (gift: GiftItem) => {
    if (!user || user.gems < gift.price || !partnerSocketId) {
      setShowGiftModal(false);
      onOpenShopModal();
      return;
    }
    
    // Call API
    try {
      const res = await apiFetch('/api/gifts/send', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: gift.price }) 
      });
      if (res.success && onUpdateGems) {
        onUpdateGems(res.gems);
      }
    } catch (err) {}

    const giftMsg = `Sent a ${gift.name} gift!`;
    setLiveMessages(prev => [...prev, { sender: 'me', text: giftMsg, id: `gift_${Date.now()}`, giftImage: gift.imagePath }]);
    socketRef.current?.emit('send_message', { to: partnerSocketId, text: giftMsg, isGift: true, giftType: gift.name, giftAmount: gift.price, giftImage: gift.imagePath });
    setShowGiftModal(false);
  };

  const handleToggleLike = async () => {
    if (!currentPartner) return;
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    if (user && !currentPartner.isDemo) {
      try {
        await toggleLike(currentPartner.id, newLikedState ? 'like' : 'unlike');
      } catch (e) {
        console.error('Failed to toggle like', e);
      }
    }
  };

  // Keyboard shortcut listener on Desktop (ESC to end, ArrowRight to next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMatching || isSearching) {
          handleCancelMatch();
          resetMatchState();
        }
      } else if (e.key === 'ArrowRight' && (isMatching || isSearching)) {
        handleNextMatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMatching, isSearching, skipCooldown]);

  const DEMO_VIDEOS_MAP: Record<string, string> = {
    female: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-with-phone-41484-large.mp4',
    male: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-the-rain-43098-large.mp4',
    default: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-1232-large.mp4'
  };

  const getPartnerVideoSrc = (partner: MatchPartner | null) => {
    if (!partner) return undefined;
    if (partner.videoUrl) return partner.videoUrl;
    return DEMO_VIDEOS_MAP[partner.gender as string] || DEMO_VIDEOS_MAP.default;
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#0d0e12]">

      {/* ========================================================================= */}
      {/* 1. VIBEMATCH RESPONSIVE MOBILE VIEW */}
      {/* ========================================================================= */}
      {isMobileView && (
<div className="flex-1 w-full flex flex-col relative bg-black overflow-hidden">
        
        {/* A. Connected Call Screen (Screenshot 2) */}
        {currentPartner ? (
          <div className="relative w-full flex-1 overflow-hidden bg-black flex flex-col justify-between">
            {/* Fullscreen Partner Video (Other Person's Camera) */}
            <video
              key="mobile-partner-video"
              ref={(el) => {
                mobilePartnerVideoRef.current = el;
                attachRemoteStream(el);
              }}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              {...(!remoteStream && getPartnerVideoSrc(currentPartner) ? { src: getPartnerVideoSrc(currentPartner), loop: true, muted: isAudioMuted } : {})}
            />

            {/* Top Bar Overlay (Screenshot 2) */}
            <div className="relative z-30 p-3.5 pt-5 flex items-start justify-between">
              {/* Partner Profile Badge - Click to view profile & Follow */}
              <button
                onClick={() => setSelectedPartnerProfileId(currentPartner.id)}
                className="flex items-center space-x-2.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15 shadow-xl hover:bg-black/60 transition-colors text-left group"
              >
                <img 
                  src={currentPartner.avatar} 
                  alt={currentPartner.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/30 group-hover:scale-105 transition-transform"
                />
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1">
                    <span className="font-extrabold text-white text-xs group-hover:text-[#00E676] group-hover:underline transition-colors">{currentPartner.name}{currentPartner.age ? `, ${currentPartner.age}` : ''}</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#00E676] text-black text-[9px] flex items-center justify-center font-black">✓</span>
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold flex items-center">
                    <img src={`https://flagcdn.com/w20/${(currentPartner.countryCode || 'us').toLowerCase()}.png`} className="w-4 h-3 inline-block object-cover mr-1 rounded-sm" alt="flag" /> {currentPartner.country}
                  </span>
                </div>
              </button>

              {/* Top-Right: Follow, Like, Shield (Report) & Close */}
              <div className="flex flex-col items-end space-y-2 pr-2 z-30 transform-gpu">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10 transition-all active:scale-95 transform-gpu ${isFollowingPartner ? 'bg-[#00E676]/20 text-[#00E676] hover:bg-[#00E676]/30' : 'bg-black/60 text-gray-300 hover:text-white'}`}
                  aria-label={isFollowingPartner ? "Unfollow" : "Follow"}
                >
                  {isFollowingPartner ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10 transition-all active:scale-95 transform-gpu ${
                    liked ? 'bg-pink-500/30 text-pink-400 border-pink-500/40' : 'bg-black/60 text-gray-300 hover:text-white'
                  }`}
                  aria-label="Send Heart / Like"
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onReportUser(currentPartner)}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-black/60 hover:bg-red-600/90 text-gray-300 hover:text-white border border-white/10 shadow-lg transition-all active:scale-95 transform-gpu"
                  aria-label="Report User"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-black/60 text-white hover:text-gray-300 border border-white/10 shadow-lg transition-all active:scale-95 transform-gpu"
                  aria-label="Close / End"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Floating Top-Right PIP: You (Screenshot 2) */}
            <Rnd
              default={{
                x: typeof window !== 'undefined' ? window.innerWidth - 110 : 250,
                y: typeof window !== 'undefined' ? window.innerHeight - 300 : 400,
                width: 96,
                height: 144
              }}
              minWidth={80}
              minHeight={120}
              bounds="parent"
              className="z-30 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black !absolute"
            >
              {hasWebcamAccess && !isCameraOff ? (
                <video
                  key="mobile-pip-video"
                  ref={(el) => {
                    mobilePipVideoRef.current = el;
                    attachStreamToVideo(el);
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#181a20] text-center p-2" style={{ pointerEvents: 'none' }}>
                  <span className="text-xl">dY` </span>
                </div>
              )}
            </Rnd>

            {/* Live Chat Overlay */}
            <LiveChatMessagesOverlay
              messages={liveMessages}
              isVisible={isChatVisible}
            />

            {/* In-Call Mobile Bottom Controls Bar (Screenshot 2) */}
            <div className="relative z-30 p-3.5 flex flex-col space-y-2">
              {/* Optional expanded chat input */}
              {showMobileChatInput && (
                <div className="w-full animate-fadeIn mb-1">
                  <ChatInputSection
                    onSendMessage={(text) => {
                      handleSendLiveMessage(text);
                      setShowMobileChatInput(false);
                      }}
                      onToggleLike={handleToggleLike}
                      onSendGift={handleSendGift}
                      onNextMatch={handleNextMatch}
                      liked={liked}
                      skipCooldown={skipCooldown}
                      isMobile={true}
                    />
                </div>
              )}

              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {/* Chat toggle button */}
                    <button
                      onClick={() => setShowMobileChatInput(!showMobileChatInput)}
                      className={`p-2.5 sm:p-3 rounded-full backdrop-blur-xl transition-all shadow-xl border border-white/15 ${
                        showMobileChatInput ? 'bg-[#00E676] text-black' : 'bg-black/50 text-white hover:bg-black/80'
                      }`}
                      title="Toggle Live Chat"
                    >
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Mic Toggle */}
                    <button
                      onClick={toggleMic}
                      className={`p-2.5 sm:p-3 rounded-full backdrop-blur-xl transition-all shadow-xl border border-white/15 ${
                        isMicMuted ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                      }`}
                      title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMicMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>

                    {/* Cam Toggle */}
                    <button
                      onClick={toggleCamera}
                      className={`p-2.5 sm:p-3 rounded-full backdrop-blur-xl transition-all shadow-xl border border-white/15 ${
                        isCameraOff ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/80'
                      }`}
                      title={isCameraOff ? "Turn On Camera" : "Turn Off Camera"}
                    >
                      {isCameraOff ? <Video className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 opacity-50" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>

                    

                    {/* Gift button */}
                    <button
                      onClick={handleSendGift}
                      className="p-2.5 sm:p-3 rounded-full backdrop-blur-xl transition-all shadow-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/30"
                      title="Send Gift"
                    >
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Right: Next > button (Screenshot 2) */}
                <button
                  onClick={handleNextMatch} disabled={skipCooldown > 0} className={`px-6 py-3 ${skipCooldown > 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-black/75 hover:bg-black/90 text-white active:scale-95'} font-black text-sm rounded-full shadow-2xl border border-white/20 flex items-center space-x-1.5`}
                >
                  <span>{skipCooldown > 0 ? `Skip (${skipCooldown})` : 'Skip'}</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : isSearching ? (
          /* B. Searching Radar Mode (Screenshot 4 style) */
          <div className="relative w-full flex-1 rounded-3xl overflow-hidden bg-black flex flex-col items-center justify-center p-6 text-center shadow-2xl border border-white/10">
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-[#00E676]/20 animate-radar-pulse" />
              <div className="w-24 h-24 rounded-full bg-[#00E676]/10 flex items-center justify-center text-4xl border border-[#00E676]/30 shadow-[0_0_50px_rgba(0,230,118,0.3)]">
                🌍
              </div>
            </div>
            <h3 className="text-xl font-black text-white mb-2 flex items-center">
              Finding your next match<span className="animate-pulse">...</span>
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mb-8">Connecting with people from {filter.country}</p>
            <button
              onClick={handleCancelMatch}
              className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-black text-xs rounded-full border border-red-500/40 shadow-lg active:scale-95"
            >
              Cancel Search
            </button>
          </div>
        ) : (
          /* C. Idle Screen (VibeMatch Matchmaking Stage) */
          <div className="relative w-full flex-1 overflow-hidden bg-black flex flex-col justify-between p-4 pb-20">
            {/* Background Camera Feed */}
            {hasWebcamAccess && !isCameraOff ? (
              <video
                key="mobile-idle-video"
                ref={(el) => {
                  mobileIdleVideoRef.current = el;
                  attachStreamToVideo(el);
                }}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="absolute inset-0 bg-[#121418] flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl text-gray-400">
                  👤
                </div>
              </div>
            )}

            {/* Dark gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

            {/* Floating Right Matches Indicator (Screenshot 3) */}
            {(onlineUsers !== undefined && onlineUsers !== null) && (
              <div className="absolute right-4 top-[35%] -translate-y-1/2 z-30 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white text-xs font-black shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse shadow-[0_0_8px_#00E676]" />
                <span>{onlineUsers.toLocaleString()} matches</span>
              </div>
            )}

            {/* Bottom Overlay: Filters + Big Start Video Chat Button (Screenshot 3) */}
            <div className="relative z-30 flex flex-col space-y-3.5 w-full mt-auto">
              {/* Bottom Controls Overlay (Mic / Cam) - Mobile */}
              <div className="flex items-center justify-center space-x-3 mb-2">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-lg ${
                    isMicMuted ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-lg ${
                    isCameraOff ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              {/* Gender & Country Filter Pill */}
              <div className="flex items-center justify-center space-x-4 bg-black/50 backdrop-blur-xl border border-white/15 px-6 py-2.5 rounded-full text-xs font-extrabold text-gray-200 shadow-xl self-center">
                <button 
                  onClick={handleOpenFilterModal}
                  className="flex items-center space-x-1.5 hover:text-[#00E676] transition-colors"
                >
                  <span className="text-pink-400 font-bold">👤</span>
                  <span>{filter.gender === 'both' ? 'Gender' : filter.gender}</span>
                </button>
                <span className="text-gray-600 font-light">|</span>
                <button 
                  onClick={handleOpenFilterModal}
                  className="flex items-center space-x-1.5 hover:text-[#00E676] transition-colors"
                >
                  <span className="text-pink-400 font-bold">🌍</span>
                  <span>{filter.country === 'All Countries' ? 'Region' : filter.country}</span>
                </button>
              </div>

              {/* Big Neon Green Button (Screenshot 3) */}
              <button
                onClick={handleNextMatch}
                className="w-full py-4 bg-[#00E676] hover:bg-[#00c853] text-black font-black text-base sm:text-lg rounded-full shadow-[0_0_30px_rgba(0,230,118,0.4)] flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Video className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                <span>{t('Start Video Chat')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      )}
        {/* ========================================================================= */}
        {/* 2. VIBEMATCH DESKTOP DUAL-PANEL VIEW */}
        {/* ========================================================================= */}
        {!isMobileView && (
        <div className="flex flex-1 w-full min-h-[calc(100vh-80px)] flex-col p-6 max-w-7xl mx-auto">
        <div className="flex-1 w-full grid grid-cols-2 gap-6 min-h-0 items-stretch">
          
          {/* Left Column: Local Video & Controls (Screenshots 4 & 5) */}
          <div className="flex flex-col gap-4 min-h-[460px]">
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#121418] border border-white/5 shadow-2xl flex flex-col justify-between p-4">
              {/* Webcam */}
              {hasWebcamAccess && !isCameraOff ? (
                <video
                  key="desktop-local-video"
                  ref={(el) => {
                    desktopLocalVideoRef.current = el;
                    attachStreamToVideo(el);
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="absolute inset-0 bg-[#121418] flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl text-gray-400">
                    👤
                  </div>
                </div>
              )}

              {/* Bottom Local Controls Overlay */}
              <div className="relative z-30 flex items-center justify-center space-x-3">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-lg ${
                    isMicMuted ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-lg ${
                    isCameraOff ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Desktop Gender & Country Filter Pill */}
            <div className="flex items-center justify-center space-x-4 mt-4 w-full">
              <div className="flex items-center space-x-4 bg-[#121418] border border-white/5 px-6 py-3 rounded-full text-xs font-extrabold text-gray-200 shadow-xl">
                <button 
                  onClick={handleOpenFilterModal}
                  className="flex items-center space-x-1.5 hover:text-[#00E676] transition-colors"
                >
                  <span className="text-pink-400 font-bold">👤</span>
                  <span>{filter.gender === 'both' ? 'Gender' : filter.gender}</span>
                </button>
                <span className="text-gray-600 font-light">|</span>
                <button 
                  onClick={handleOpenFilterModal}
                  className="flex items-center space-x-1.5 hover:text-[#00E676] transition-colors"
                >
                  <span className="text-pink-400 font-bold">🌍</span>
                  <span>{filter.country === 'All Countries' ? 'Region' : filter.country}</span>
                </button>
              </div>

              {(!isSearching && !currentPartner) && (
                <button
                  onClick={handleNextMatch}
                  className="px-6 py-3 bg-[#00E676] hover:bg-[#00c853] text-black font-black text-sm rounded-full shadow-[0_0_20px_rgba(0,230,118,0.4)] flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Video className="w-4 h-4 fill-current" />
                  <span>{t('Start Video Chat')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Discover Grid / Searching 3D Globe / Connected Partner (Screenshots 4 & 5) */}
          <div className="flex flex-col min-h-[460px]">
            {currentPartner ? (
              /* Connected Partner Desktop Screen */
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-black border border-white/5 shadow-2xl flex flex-col justify-between">
                <video
                  key="desktop-partner-video"
                  ref={(el) => {
                    desktopPartnerVideoRef.current = el;
                    attachRemoteStream(el);
                  }}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  {...(!remoteStream && getPartnerVideoSrc(currentPartner) ? { src: getPartnerVideoSrc(currentPartner), loop: true, muted: isAudioMuted } : {})}
                />
                
                {/* Header Partner info - Click to view profile */}
                <div className="relative z-30 p-6 pt-10 flex justify-between items-start">
                  <button
                    onClick={() => setSelectedPartnerProfileId(currentPartner.id)}
                    className="bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-2xl text-white shadow-2xl border border-white/10 flex items-center space-x-3 hover:bg-black/60 transition-colors group cursor-pointer"
                  >
                    <span className="font-extrabold text-base group-hover:text-[#00E676] group-hover:underline transition-colors">{currentPartner.name}, {currentPartner.age}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#00E676]/20 text-[#00E676] font-bold border border-[#00E676]/40">
                      ONLINE
                    </span>
                    <span className="text-xs text-gray-300"><img src={`https://flagcdn.com/w20/${(currentPartner.countryCode || 'us').toLowerCase()}.png`} className="w-4 h-3 inline-block object-cover mr-1 rounded-sm" alt="flag" /> {currentPartner.country}</span>
                  </button>
                  <div className="flex flex-col space-y-3 z-30 transform-gpu">
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-xl transition-all active:scale-95 transform-gpu ${isFollowingPartner ? 'bg-[#00E676]/20 text-[#00E676] hover:bg-[#00E676]/30' : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'}`}
                      aria-label={isFollowingPartner ? "Unfollow" : "Follow"}
                    >
                      {isFollowingPartner ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleLike}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-xl transition-all active:scale-95 transform-gpu ${
                        liked ? 'bg-pink-500/30 text-pink-400 border-pink-500/40' : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'
                      }`}
                      aria-label="Send Heart / Like"
                    >
                      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReportUser(currentPartner)}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-black/60 hover:bg-red-600/90 text-gray-300 hover:text-white border border-white/10 shadow-xl transition-all active:scale-95 transform-gpu"
                      aria-label="Report User"
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Live Chat Overlay */}
                <LiveChatMessagesOverlay
                  messages={liveMessages}
                  isVisible={isChatVisible}
                />

                {/* Bottom Input */}
                <div className="relative z-30 p-6">
                  <ChatInputSection
                    onSendMessage={handleSendLiveMessage}
                    onToggleLike={handleToggleLike}
                    onSendGift={handleSendGift}
                    onNextMatch={handleNextMatch}
                    liked={liked}
                    skipCooldown={skipCooldown}
                  />
                </div>
              </div>
            ) : isSearching ? (
              /* Searching 3D Globe Screen (Screenshot 4) */
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#121418] border border-white/5 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                <div className="relative w-72 h-72 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border border-[#00E676]/20 animate-radar-pulse" />
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-7xl shadow-[0_0_80px_rgba(6,182,212,0.3)] animate-pulse">
                    🌍
                  </div>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Finding your next match..</h2>
                <p className="text-sm text-gray-400 mb-8">Press right arrow or button to skip</p>
                <button
                  onClick={handleCancelMatch}
                  className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-black text-sm rounded-full shadow-xl transition-all"
                >
                  Cancel Search
                </button>
              </div>
            ) : (
              /* Discover Cards Masonry Grid (Screenshot 5) */
              <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#121418] border border-white/5 shadow-2xl p-4 flex flex-col">
                <div className="relative flex-1 overflow-hidden pointer-events-auto">
                  <div className="grid grid-cols-2 gap-3 absolute top-0 w-full animate-scroll-vertical">
                    {/* Double the array for infinite seamless scrolling */}
                    {[
                      ...(discoverUsers.length > 0 ? discoverUsers : [
                        { id: '1', name: 'David', age: 29, country: 'USA', countryCode: 'US', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
                        { id: '2', name: 'Ngọc Anh', age: 23, country: 'Vietnam', countryCode: 'VN', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
                        { id: '3', name: '지수 (Ji-soo)', age: 23, country: 'South Korea', countryCode: 'KR', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
                        { id: '4', name: 'Joshua', age: 25, country: 'USA', countryCode: 'US', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
                      ]),
                      ...(discoverUsers.length > 0 ? discoverUsers : [
                        { id: '1', name: 'David', age: 29, country: 'USA', countryCode: 'US', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
                        { id: '2', name: 'Ngọc Anh', age: 23, country: 'Vietnam', countryCode: 'VN', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
                        { id: '3', name: '지수 (Ji-soo)', age: 23, country: 'South Korea', countryCode: 'KR', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
                        { id: '4', name: 'Joshua', age: 25, country: 'USA', countryCode: 'US', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
                      ])
                    ].map((u: any, idx: number) => (
                      <div 
                        key={`${u.id}-${idx}`} 
                        onClick={() => setSelectedPartnerProfileId(u.id)}
                        className="relative rounded-2xl overflow-hidden h-44 group cursor-pointer border border-white/5 shadow-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1"
                      >
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity" />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full flex items-center space-x-1.5 border border-white/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                          <span className="text-[9px] text-white font-bold tracking-wider">ONLINE</span>
                        </div>
                        
                        {/* User Info */}
                        <div className="absolute bottom-3 left-3 right-3 flex flex-col justify-end text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm tracking-wide drop-shadow-md truncate max-w-[80%]">
                              {u.name}, {u.age || 22}
                            </span>
                            <img 
                              src={`https://flagcdn.com/w20/${(u.countryCode || 'US').toLowerCase()}.png`} 
                              alt={u.countryCode || 'US'} 
                              className="w-4 h-auto rounded-[2px] shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Bottom Controls Bar (Screenshot 4) */}
        {(isSearching || currentPartner) && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400 px-2">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono font-bold text-[11px]">esc</span>
              <div>
                <span className="font-bold text-gray-200 block">End Video Chat</span>
                <span className="text-[10px] text-gray-500">Press ESC to end the video chat</span>
              </div>
            </div>

            <button
              onClick={handleNextMatch}
              className="flex items-center space-x-3 hover:text-white transition-colors"
            >
              <div className="text-right">
                <span className="font-bold text-gray-200 block">Skip Video Chat</span>
                <span className="text-[10px] text-gray-500">Press right key to meet others</span>
              </div>
              <div className="p-2 rounded-full bg-white/10 text-white">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
      )}

      {/* User Profile Modal when clicking on a user */}
      {selectedPartnerProfileId && (
        <UserProfileModal
          userId={selectedPartnerProfileId}
          currentUserId={user?.id}
          token={authStorage.getToken() || undefined}
          onClose={() => setSelectedPartnerProfileId(null)}
          onOpenMessageWith={onOpenMessageWith}
        />
      )}

      <GiftSelectionModal 
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSelectGift={handleSelectGift}
        userGems={user?.gems || 0}
      />
      
      <VipSubscriptionModal
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
        userGems={user?.gems || 0}
        onSubscribe={async (planId) => {
          try {
            const res = await subscribeToVip(planId);
            if (res.error) {
              alert(res.error);
              return false;
            }
            if (res.success) {
              // Note: Normally we'd update user context here, but since this relies on page refresh/context
              // we can just alert or close. Real app would update context state.
              alert('VIP Subscription successful! You now have access to exclusive filters.');
              return true;
            }
            return false;
          } catch (err: any) {
            alert(err.message || 'Failed to subscribe');
            return false;
          }
        }}
      />
    </div>
  );
};
