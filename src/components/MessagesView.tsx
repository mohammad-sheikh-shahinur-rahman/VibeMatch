import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, UserCheck, Heart, Search, Sparkles, Trash2, MoreVertical, Gift, X } from 'lucide-react';
import { FreeFireDiamond } from './FreeFireDiamond';
import { Link } from 'react-router-dom';
import { Conversation, Message, User, Gift as GiftType } from '../types';
import { getConversations, getMessages, sendMessage, deleteConversation, getGifts, markMessagesAsRead, apiFetch } from '../lib/auth';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface MessagesViewProps {
  user: User | null;
  selectedPartnerId?: string;
  onMeetSomeoneNew: () => void;
  onOpenShopModal: () => void;
  onUpdateGems?: (gems: number) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user,
  selectedPartnerId,
  onMeetSomeoneNew,
  onOpenShopModal,
  onUpdateGems
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationsRef = React.useRef<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<Conversation | null>(null);
  const activePartnerRef = React.useRef<Conversation | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  // Sync ref with state
  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePartner(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [showGifts, setShowGifts] = useState(false);
  const [availableGifts, setAvailableGifts] = useState<GiftType[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!user) return;
    const socket = io('/');
    
    socket.emit('register_user', user.id);
    
    socket.on('new_message_notification', async (newMsg: Message) => {
      // Play sound notification if it's not from us
      if (newMsg.senderId !== user.id) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play failed', e));
        } catch (e) {
          console.log('Audio init failed', e);
        }
      }

      const partnerId = newMsg.senderId === user.id ? newMsg.receiverId : newMsg.senderId;
      const exists = conversationsRef.current.some(c => c.partnerId === partnerId);

      // Update conversations list latest message and unread count
      if (exists) {
        setConversations(prev => {
          return prev.map(conv => {
            if (conv.partnerId === partnerId) {
              const isCurrentlyActive = activePartnerRef.current?.partnerId === conv.partnerId;
              const newUnreadCount = (newMsg.senderId === conv.partnerId && !isCurrentlyActive) 
                ? (conv.unreadCount || 0) + 1 
                : conv.unreadCount;
              return { ...conv, lastMessage: newMsg.text, lastMessageTime: newMsg.timestamp, unreadCount: newUnreadCount };
            }
            return conv;
          });
        });
      }

      // If conversation doesn't exist, fetch the user profile and add it to the list
      if (!exists && partnerId) {
         // Optimistically mark it as existing in the ref so we don't trigger this again for the same partner
         conversationsRef.current.push({ partnerId, partnerName: 'Loading...' } as any);
         
         try {
           const res = await fetch(`/api/users/${partnerId}/profile`);
           if (res.ok) {
             const data = await res.json();
             if (data.profile) {
                const newConv: Conversation = {
                   partnerId: data.profile.id,
                   partnerName: data.profile.name,
                   partnerUsername: data.profile.username,
                   partnerAvatar: data.profile.avatar,
                   partnerCountry: data.profile.country,
                   isOnline: true,
                   isFollowing: true,
                   lastMessage: newMsg.text,
                   lastMessageTime: newMsg.timestamp,
                   unreadCount: (newMsg.senderId !== user.id) ? 1 : 0
                };
                setConversations(prev => [newConv, ...prev]);
             }
           }
         } catch (e) {
           console.error("Failed to load new conversation profile");
         }
      }

      // Only append to active chat if it matches
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        
        // Ensure the message belongs to the current open chat
        const isActiveChat = activePartnerRef.current && 
          (activePartnerRef.current.partnerId === newMsg.senderId || activePartnerRef.current.partnerId === newMsg.receiverId);
          
        if (isActiveChat) {
          // If the chat is open, immediately mark as read on backend
          if (newMsg.senderId === activePartnerRef.current.partnerId) {
            markMessagesAsRead(newMsg.senderId).catch(() => {});
          }
          setTimeout(scrollToBottom, 50);
          return [...prev, newMsg];
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Clear unread count when a conversation becomes active
  useEffect(() => {
    console.log("activePartner changed:", activePartner);
    if (activePartner && activePartner.unreadCount && activePartner.unreadCount > 0) {
      console.log("Will mark as read for:", activePartner.partnerId);
      setConversations(prev => prev.map(c => 
        c.partnerId === activePartner.partnerId ? { ...c, unreadCount: 0 } : c
      ));
      // Mark as read in the backend
      markMessagesAsRead(activePartner.partnerId)
        .then(data => console.log('Read receipt response:', data))
        .catch(err => console.error('Read receipt error:', err));
    }
  }, [activePartner]);

  useEffect(() => {
    async function loadData() {
      try {
        const convs = await getConversations();

        if (selectedPartnerId) {
          const match = convs.find(c => c.partnerId === selectedPartnerId);
          if (match) {
            setConversations(convs);
            setActivePartner(match);
          } else {
             // New chat with someone not in our recent conversations
             try {
                const res = await fetch(`/api/users/${selectedPartnerId}/profile`);
                const data = await res.json();
                if (data.profile) {
                   const newConv: Conversation = {
                      partnerId: data.profile.id,
                      partnerName: data.profile.name,
                      partnerUsername: data.profile.username,
                      partnerAvatar: data.profile.avatar,
                      partnerCountry: data.profile.country,
                      isOnline: true,
                      isFollowing: true,
                      lastMessage: 'Start chatting now!',
                      lastMessageTime: new Date().toISOString(),
                      unreadCount: 0
                   };
                   setConversations([newConv, ...convs]);
                   setActivePartner(newConv);
                } else {
                   setConversations(convs);
                }
             } catch {
                setConversations(convs);
             }
          }
        } else {
          setConversations(convs);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchGifts() {
      try {
        const res = await getGifts();
        if (res.gifts) {
          setAvailableGifts(res.gifts);
        }
      } catch (err) {
        console.error('Failed to load gifts:', err);
      }
    }
    
    loadData();
    fetchGifts();
  }, [selectedPartnerId]);

  useEffect(() => {
    async function loadMessages() {
      if (activePartner) {
        setHasMore(false);
        const { messages: msgs, hasMore: more } = await getMessages(activePartner.partnerId, 0, 20);
        setMessages(msgs);
        setHasMore(more);
        setTimeout(scrollToBottom, 50);
      } else {
        setMessages([]);
        setHasMore(false);
      }
    }
    loadMessages();
  }, [activePartner]);

  const handleLoadMore = async () => {
    if (!activePartner || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const { messages: olderMsgs, hasMore: more } = await getMessages(activePartner.partnerId, messages.length, 20);
      
      const previousScrollHeight = scrollContainerRef.current?.scrollHeight || 0;
      
      setMessages(prev => [...olderMsgs, ...prev]);
      setHasMore(more);
      
      // Preserve scroll position
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
        }
      }, 50);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || !activePartner) return;

    const text = inputMsg.trim();
    const myId = user ? user.id : 'u_guest';

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: myId,
      receiverId: activePartner.partnerId,
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMsg('');
    setTimeout(scrollToBottom, 50);

    // Update conversation list locally
    setConversations(prev => prev.map(c => 
      c.partnerId === activePartner.partnerId 
        ? { ...c, lastMessage: text, lastMessageTime: new Date().toISOString() } 
        : c
    ));

    // Persist API and notify via socket
    await sendMessage(myId, activePartner.partnerId, text);
    setTimeout(scrollToBottom, 50);
  };

  const handleSendGift = async (giftName: string, cost: number, icon: string) => {
    if (!user || !activePartner) return;
    if (user.gems < cost) {
      setShowGifts(false);
      onOpenShopModal();
      return;
    }
    
    try {
      const data = await apiFetch('/api/gifts/send', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost }) 
      });
      if (data.success && onUpdateGems) {
        onUpdateGems(data.gems);
      }
    } catch (err) {
      toast.error('Failed to send gift. Please try again.');
      return;
    }
    
    setShowGifts(false);

    const giftMessage = `Sent a gift: ${giftName}`;
    const myId = user.id;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: myId,
      receiverId: activePartner.partnerId,
      text: giftMessage,
      timestamp: new Date().toISOString(),
      isGift: true,
      giftType: giftName,
      giftAmount: cost
    };

    setMessages(prev => {
      if (prev.find(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setTimeout(scrollToBottom, 50);

    setConversations(prev => {
      const convs = [...prev];
      const idx = convs.findIndex(c => c.partnerId === activePartner.partnerId);
      if (idx !== -1) {
        convs[idx].lastMessage = giftMessage;
        convs[idx].lastMessageTime = newMsg.timestamp;
      }
      return convs;
    });

    try {
      await sendMessage(myId, activePartner.partnerId, giftMessage, { isGift: true, giftType: giftName, giftAmount: cost });
    } catch (err) {
      console.error('Failed to send gift:', err);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, partnerId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      setConversations(prev => prev.filter(c => c.partnerId !== partnerId));
      if (activePartner?.partnerId === partnerId) {
        setActivePartner(null);
        setMessages([]);
      }
      await deleteConversation(partnerId);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.partnerUsername && c.partnerUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="absolute inset-0 bg-[#0d0e12] text-white p-2 md:p-6 flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Left Column: Messages List */}
      <div 
        className={`w-full md:w-80 bg-[#16181f] border border-gray-800 rounded-2xl md:rounded-3xl p-4 flex flex-col shadow-xl shrink-0 min-h-0 overflow-hidden ${activePartner ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="flex flex-col flex-1 h-full max-h-full overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight">Messages</h2>
            
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1d24] border border-gray-800 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredConversations.length === 0 ? (
               <div className="text-center text-gray-500 text-sm py-10">No chats found.</div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.partnerId}
                  onClick={() => setActivePartner(conv)}
                  className={`relative p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all group ${
                    activePartner?.partnerId === conv.partnerId
                      ? 'bg-[#00E676]/10 border border-[#00E676]/30 shadow-[0_0_15px_rgba(0,230,118,0.05)]'
                      : 'bg-transparent hover:bg-gray-800/60 border border-transparent hover:border-gray-800'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.partnerAvatar}
                      alt={conv.partnerName}
                      className="w-12 h-12 rounded-full object-cover border border-[#2b2b36]"
                    />
                    {conv.isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#00E676] border-2 border-[#16181f] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-bold text-[13px] text-white truncate pr-2">{conv.partnerName}</h4>
                      <div className="flex flex-col items-end shrink-0 space-y-1 group-hover:opacity-0 transition-opacity">
                        <span className="text-[10px] text-gray-500">
                          {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {conv.unreadCount && conv.unreadCount > 0 ? (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {conv.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className={`text-[11px] truncate ${activePartner?.partnerId === conv.partnerId ? 'text-gray-300' : 'text-gray-500'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  
                  {/* Delete chat button (shows on hover) */}
                  <button 
                    onClick={(e) => handleDeleteChat(e, conv.partnerId)}
                    className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Chat Window */}
      <div 
        className={`flex-1 min-w-0 bg-[#16181f] border border-gray-800 rounded-2xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative min-h-0 ${!activePartner ? 'hidden md:flex' : 'flex'}`}
      >
        {activePartner ? (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-800/80 bg-[#1a1d24]/50 backdrop-blur-sm flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center space-x-3.5">
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setActivePartner(null)}
                  className="md:hidden mr-2 p-2 -ml-2 rounded-full bg-gray-800/50 text-white hover:bg-gray-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <Link to={`/@${activePartner.partnerUsername || activePartner.partnerName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`}>
                  <img
                    src={activePartner.partnerAvatar}
                    alt={activePartner.partnerName}
                    className="w-11 h-11 rounded-full object-cover border border-gray-700 hover:border-[#00E676] transition-colors"
                  />
                </Link>
                <div className="flex flex-col">
                  <Link to={`/@${activePartner.partnerUsername || activePartner.partnerName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`}>
                    <h3 className="font-extrabold text-[15px] text-white hover:text-[#00E676] transition-colors">{activePartner.partnerName}</h3>
                  </Link>
                  <span className="text-[11px] text-[#00E676] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                    Online
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                 <button
                   onClick={(e) => handleDeleteChat(e, activePartner.partnerId)}
                   className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                   title="Delete Chat"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-[#0d0e12]/50">
              {hasMore && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-bold rounded-full hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : 'Show older messages'}
                  </button>
                </div>
              )}
              
              {messages.length === 0 && !hasMore ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Say hi to {activePartner.partnerName}!
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === (user ? user.id : 'u_guest');
                  const isGift = msg.isGift || msg.text.startsWith('Sent a gift:');
                  
                  let giftObj = null;
                  if (isGift) {
                     const gName = msg.giftType || msg.text.replace('Sent a gift: ', '').trim();
                     giftObj = availableGifts.find(g => g.name === gName);
                  }

                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <img src={activePartner.partnerAvatar} alt="" className="w-6 h-6 rounded-full mr-2 self-end mb-1 object-cover" />
                      )}
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] flex flex-col ${
                        isGift 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold border border-pink-400 shadow-lg shadow-pink-500/20'
                          : isMe
                          ? 'bg-[#00E676] text-black rounded-br-sm shadow-sm' 
                          : 'bg-[#1a1d24] border border-gray-800 text-gray-200 rounded-bl-sm shadow-sm'
                      }`}>
                        {isGift && giftObj?.imagePath ? (
                          <div className="flex flex-col items-center justify-center py-2 space-y-2">
                             <img src={giftObj.imagePath} alt={giftObj.name} className="w-16 h-16 object-contain drop-shadow-xl" />
                             <span className="text-sm opacity-90 tracking-wide">{isMe ? `You sent ${giftObj.name}` : `Sent you ${giftObj.name}`}</span>
                          </div>
                        ) : (
                          <span>{msg.text}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar or Restriction Notice */}
            {activePartner.isFollowing ? (
              <form onSubmit={handleSend} className="p-3 md:p-4 bg-[#16181f] border-t border-gray-800/80 shrink-0">
                <div className="flex items-center space-x-2 md:space-x-3 relative">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowGifts(!showGifts)}
                      className="p-2.5 text-pink-400 hover:text-pink-300 hover:bg-pink-400/10 rounded-full transition-all shrink-0"
                      title="Send Gift"
                    >
                      <Gift className="w-5 h-5" />
                    </button>
                    {/* Gifts Popover */}
                    {showGifts && (
                      <div className="absolute bottom-12 left-0 bg-[#1a1d24] border border-gray-800 rounded-2xl shadow-2xl p-4 w-64 z-50 animate-fadeIn">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-white font-bold text-sm">Send a Gift</h4>
                          <button onClick={() => setShowGifts(false)} className="text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {availableGifts.length === 0 ? (
                            <div className="col-span-2 text-center text-xs text-gray-500 py-4">No gifts available</div>
                          ) : (
                            availableGifts.map(g => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => handleSendGift(g.name, g.price, '')}
                                className="flex flex-col items-center justify-center p-2 bg-[#16181f] hover:bg-gray-800 border border-gray-800 hover:border-[#00E676] rounded-xl transition-all"
                              >
                                {g.imagePath ? (
                                  <img src={g.imagePath} alt={g.name} className="w-8 h-8 object-contain mb-1" />
                                ) : (
                                  <span className="text-2xl mb-1">🎁</span>
                                )}
                                <span className="text-xs text-white font-bold">{g.name}</span>
                                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                                  <FreeFireDiamond className="w-3 h-3" />
                                  {g.price}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      className="w-full bg-[#0d0e12] border border-gray-800 rounded-full py-3.5 pl-5 pr-12 text-sm text-white focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all placeholder:text-gray-600"
                    />
                    <button
                      type="submit"
                      disabled={!inputMsg.trim()}
                      className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full flex items-center justify-center transition-all ${
                        inputMsg.trim() 
                          ? 'bg-[#00E676] text-black hover:bg-[#00c853] hover:scale-105 shadow-md' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-[#1f232b] border-t border-gray-800 flex flex-col items-center justify-center space-y-2">
                <div className="bg-red-500/20 text-red-400 p-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 font-bold text-center">
                  You can only chat if you both follow each other.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0d0e12]/30">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <MessageSquare className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Your Messages</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">
              Select a conversation from the left to start chatting, or meet someone new!
            </p>
            <button
              onClick={onMeetSomeoneNew}
              className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-sm py-3.5 px-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Meet Someone New
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
