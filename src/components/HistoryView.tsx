import React, { useState, useEffect } from 'react';
import { Clock, Eye, Video, MessageSquare, UserPlus, Heart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HistoryItem } from '../types';
import { getHistory, toggleFollow } from '../lib/auth';
import toast from 'react-hot-toast';

interface HistoryViewProps {
  onStartChatting: () => void;
  onOpenMessageWith: (partnerId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onStartChatting, onOpenMessageWith }) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'viewed'>('recent');
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getHistory();
        setHistoryList(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFollowToggle = async (partnerId: string) => {
    try {
      await toggleFollow(partnerId);
      setHistoryList(prev => prev.map(item => {
        if (item.partnerId === partnerId) {
          // Flip isFollowing. Mutual follow could theoretically become true/false but without re-fetching we just toggle the local state to look responsive.
          return { ...item, isFollowing: !item.isFollowing };
        }
        return item;
      }));
    } catch (err) {
      console.error('Follow failed', err);
    }
  };

  const filteredItems = historyList.filter(item => {
    if (activeTab === 'recent') return item.type === 'video_chat';
    return item.type === 'viewed_me';
  }).slice(0, 15);

  return (
    <div className="absolute inset-0 bg-[#0d0e12] p-2 md:p-6 flex flex-col overflow-hidden">
      <div className="flex-1 bg-[#16181f] border border-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-10 w-full flex flex-col overflow-y-auto shadow-2xl min-h-0">
        {/* Title */}
        <h1 className="text-3xl font-black tracking-tight mb-6 text-white">History</h1>
  
        {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-800 pb-3 mb-8">
        <button
          onClick={() => setActiveTab('recent')}
          className={`text-sm font-extrabold pb-3 transition-colors relative ${
            activeTab === 'recent'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Recent activity
          {activeTab === 'recent' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#00E676] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('viewed')}
          className={`text-sm font-extrabold pb-3 transition-colors relative ${
            activeTab === 'viewed'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Viewed me
          {activeTab === 'viewed' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#00E676] rounded-full" />
          )}
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 font-semibold">
          Loading history...
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-[#1a1d24] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition-all shadow-md group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <Link to={`/@${item.partnerUsername || item.partnerName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`}>
                  <img
                    src={item.partnerAvatar}
                    alt={item.partnerName}
                    className="w-16 h-16 rounded-full object-cover border border-[#2b2b36]"
                  />
                </Link>
                <div>
                  <Link to={`/@${item.partnerUsername || item.partnerName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`}>
                    <h3 className="font-extrabold text-lg text-white hover:text-[#00E676] hover:underline transition-colors leading-tight">
                      {item.partnerName}{item.partnerAge ? `, ${item.partnerAge}` : ''}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-400 mt-0.5 hidden md:block">
                    @{item.partnerUsername || item.partnerName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block font-medium">
                    {new Date(item.timestamp).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full mt-2">
                <button
                  onClick={() => {
                    if (item.isMutualFollow) {
                      onOpenMessageWith(item.partnerId);
                    } else {
                      toast.error('rah madarx lik follow. Mutual follow is required to send messages!');
                    }
                  }}
                  className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border transition-all ${
                    item.isMutualFollow
                      ? 'border-gray-700 text-white hover:bg-gray-800'
                      : 'border-gray-800 text-gray-600 bg-gray-900 cursor-not-allowed'
                  }`}
                  title={item.isMutualFollow ? "Send Direct Message" : "Mutual follow required to send messages"}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleFollowToggle(item.partnerId)}
                  className={`flex-1 py-3 rounded-full font-bold transition flex items-center justify-center gap-2 ${
                    item.isFollowing 
                      ? 'border border-gray-700 hover:bg-gray-800 text-white' 
                      : 'bg-[#00E676] text-black hover:bg-[#00c968]'
                  }`}
                >
                  {item.isFollowing ? (
                    <>
                      <UserPlus className="w-5 h-5" />
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
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800/80 border border-gray-700/60 flex items-center justify-center mb-6 shadow-inner">
            <Clock className="w-8 h-8 opacity-50 text-gray-500" />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">Your History</h3>
          <p className="text-gray-400 text-sm max-w-[280px] leading-relaxed mx-auto mb-8 font-medium">
            No history yet. Start a video chat and make a new friend!
          </p>
          <button
            onClick={onStartChatting}
            className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-sm px-8 py-3.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Start Chatting
          </button>
        </div>
      )}
      </div>
    </div>
  );
};
