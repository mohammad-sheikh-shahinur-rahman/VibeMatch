import React, { useEffect, useState } from 'react';
import { X, Crown, ShieldCheck } from 'lucide-react';
import { VipPlan } from '../types';
import { FreeFireDiamond } from './FreeFireDiamond';

interface VipSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGems: number;
  onSubscribe: (planId: string) => Promise<boolean>;
}

export function VipSubscriptionModal({ isOpen, onClose, userGems, onSubscribe }: VipSubscriptionModalProps) {
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/vip-plans')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPlans(data);
          }
        })
        .catch(err => console.error('Error fetching VIP plans:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = async (plan: VipPlan) => {
    if (userGems < plan.priceGems) {
      alert('You do not have enough gems to purchase this plan. Please buy more gems first.');
      return;
    }
    
    setSubmittingId(plan.id);
    const success = await onSubscribe(plan.id);
    setSubmittingId(null);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#13151a] rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden animate-springUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-900/20 p-6 flex flex-col items-center justify-center relative border-b border-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-3">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">Get VIP Access</h2>
          <p className="text-sm text-amber-200/80 font-bold mt-1 text-center max-w-xs">
            Unlock exclusive filters, premium badges, and stand out in the community!
          </p>
          
          <div className="mt-4 flex items-center space-x-2 bg-black/50 px-4 py-1.5 rounded-full border border-white/10">
            <span className="text-xs text-gray-400 font-bold">Your Balance:</span>
            <span className="text-sm font-black text-cyan-400 flex items-center space-x-1">
              <span>{userGems.toLocaleString()}</span>
              <FreeFireDiamond className="w-4 h-4 ml-1" />
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              No VIP plans available right now.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map(plan => {
                const canAfford = userGems >= plan.priceGems;
                return (
                  <div
                    key={plan.id}
                    className={`relative p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/50' 
                        : 'bg-black/40 border-white/10 hover:border-amber-500/30'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-4 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg font-black text-white flex items-center">
                        {plan.name}
                        <ShieldCheck className="w-4 h-4 text-amber-500 ml-2" />
                      </h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">{plan.description}</p>
                    </div>
                    
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={submittingId === plan.id}
                      className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-sm flex items-center space-x-2 transition-all ${
                        submittingId === plan.id
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      <span>{submittingId === plan.id ? 'Processing...' : plan.priceGems}</span>
                      {submittingId !== plan.id && <FreeFireDiamond className={`w-4 h-4 ${canAfford ? 'text-cyan-800' : ''}`} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
