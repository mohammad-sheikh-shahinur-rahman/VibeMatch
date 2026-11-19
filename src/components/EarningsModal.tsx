import React, { useState, useEffect } from 'react';
import { X, DollarSign, Gem, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/auth';
import { User } from '../types';

export function EarningsModal({ isOpen, onClose, user, siteSettings, setUser }: { isOpen: boolean, onClose: () => void, user: User, siteSettings: any, setUser: (u: any) => void }) {
  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const rate = siteSettings?.withdrawalRate || 100;
  const minAmount = siteSettings?.minWithdrawalAmount || 50;
  const allowedMethods = siteSettings?.withdrawalMethods || ['paypal', 'bank_transfer', 'upi', 'crypto'];

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  const loadHistory = async () => {
    try {
      const data = await apiFetch('/api/withdrawals');
      setHistory(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load history');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !paymentMethod || !paymentDetails) {
      toast.error('Please fill in all fields correctly');
      return;
    }
    const requiredGems = amount * rate;
    if ((user.earnedGems || 0) < requiredGems) {
      toast.error('Insufficient earned gems');
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod, paymentDetails })
      });
      setUser({ ...user, earnedGems: data.newEarnedGems });
      toast.success('Withdrawal request submitted successfully');
      setAmount(0);
      setPaymentMethod('');
      setPaymentDetails('');
      setActiveTab('history');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#13141a] rounded-2xl shadow-2xl border border-white/5 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#00E676]" />
            Earnings & Cashout
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'withdraw' ? 'text-[#00E676] border-b-2 border-[#00E676]' : 'text-white/50 hover:text-white'}`}
          >
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-[#00E676] border-b-2 border-[#00E676]' : 'text-white/50 hover:text-white'}`}
          >
            History
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'withdraw' ? (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/50 font-bold mb-1">Available Balance</div>
                  <div className="text-2xl font-black text-white flex items-center gap-2">
                    {user.earnedGems || 0} <Gem className="w-5 h-5 text-[#00E676]" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/50 font-bold mb-1">Equivalent</div>
                  <div className="text-2xl font-black text-[#00E676]">
                    ${((user.earnedGems || 0) / rate).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/50 bg-[#00E676]/10 p-3 rounded-lg border border-[#00E676]/20">
                <span className="font-bold text-[#00E676]">Rate:</span> {rate} Gems = $1 USD. Only earned gems from gifts can be withdrawn. Minimum withdrawal is ${minAmount}.
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-1.5">Amount to Withdraw (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">$</span>
                    <input
                      type="number"
                      min={minAmount}
                      step="0.01"
                      required
                      value={amount || ''}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#00E676]/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  {amount > 0 && (
                    <div className="text-xs text-white/50 mt-1.5 ml-1">
                      Will deduct {Math.ceil(amount * rate)} Gems
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/70 mb-1.5">Payment Method</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]/50 transition-colors appearance-none"
                  >
                    <option value="" disabled className="bg-[#13141a]">Select method</option>
                    {allowedMethods.map((m: string) => (
                      <option key={m} value={m} className="bg-[#13141a]">{m.toUpperCase().replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/70 mb-1.5">Payment Details (Email / Wallet / IBAN)</label>
                  <input
                    type="text"
                    required
                    value={paymentDetails}
                    onChange={e => setPaymentDetails(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]/50 transition-colors"
                    placeholder="Enter your details"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00C853] text-black font-black hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  {loading ? 'Processing...' : 'Submit Request'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-white/40 font-bold">No withdrawal requests yet.</div>
              ) : (
                history.map(req => (
                  <div key={req.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-white">${req.amount.toFixed(2)}</div>
                      <div className="text-xs text-white/50">{req.paymentMethod.toUpperCase()} &bull; {new Date(req.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {req.status === 'pending' && <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded-md"><Clock className="w-3 h-3"/> Pending</span>}
                      {req.status === 'approved' && <span className="flex items-center gap-1 text-[#00E676] text-xs font-bold bg-[#00E676]/10 px-2 py-1 rounded-md"><CheckCircle className="w-3 h-3"/> Approved</span>}
                      {req.status === 'rejected' && <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded-md"><XCircle className="w-3 h-3"/> Rejected</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
