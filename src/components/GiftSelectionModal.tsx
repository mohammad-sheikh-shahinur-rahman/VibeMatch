import React, { useEffect, useState } from 'react';
import { X, Gift as GiftIcon } from 'lucide-react';
import { FreeFireDiamond } from './FreeFireDiamond';

export interface GiftItem {
  id: string;
  name: string;
  price: number;
  imagePath: string;
}

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGift: (gift: GiftItem) => void;
  userGems: number;
}

export function GiftSelectionModal({ isOpen, onClose, onSelectGift, userGems }: GiftSelectionModalProps) {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/gifts')
        .then(res => res.json())
        .then(data => {
          if (data.gifts) {
            setGifts(data.gifts);
          }
        })
        .catch(err => console.error('Error fetching gifts:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#13151a] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-springUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <GiftIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Send a Gift</h2>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-xs text-gray-400 font-bold">Your Balance:</span>
                <span className="text-xs font-black text-cyan-400 flex items-center space-x-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  <span>{userGems.toLocaleString()}</span>
                  <FreeFireDiamond className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              No gifts available right now.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {gifts.map(gift => {
                const canAfford = userGems >= gift.price;
                return (
                  <button
                    key={gift.id}
                    onClick={() => {
                      onSelectGift(gift);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      canAfford
                        ? 'bg-black/40 border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 group'
                        : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <img 
                      src={gift.imagePath} 
                      alt={gift.name} 
                      className={`w-14 h-14 object-contain mb-2 ${canAfford ? 'group-hover:scale-110 transition-transform' : ''}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/gift/default.png'; // Fallback
                      }}
                    />
                    <span className="text-xs font-bold text-gray-200 text-center truncate w-full mb-1">
                      {gift.name}
                    </span>
                    <span className={`text-[10px] font-black flex items-center space-x-1 px-2 py-0.5 rounded-full ${
                      canAfford ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      <span>{gift.price}</span>
                      <FreeFireDiamond className="w-2.5 h-2.5 ml-0.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
