import React, { useState, useEffect } from 'react';
import { CreditCard, Trash2, Settings as SettingsIcon, CheckCircle, XCircle, Search, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/auth';

export const WithdrawalsTab = ({ settings, navigate }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/withdrawals');
      setRequests(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this withdrawal record? This action cannot be undone.')) return;
    try {
      await apiFetch(`/api/admin/withdrawals/${id}`, {
        method: 'DELETE'
      });
      toast.success('Record deleted successfully');
      loadRequests();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete record');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    try {
      await apiFetch(`/api/admin/withdrawals/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      toast.success(`Request marked as ${status}`);
      loadRequests();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update request');
    }
  };

  const filtered = requests.filter(r => 
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalPaid: requests.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0)
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#00E676]" />
            Withdrawal Requests
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage user payout requests</p>
        </div>
        <button
          onClick={() => {
            navigate('/admin/settings/payment'); setTimeout(() => document.getElementById('withdrawals')?.scrollIntoView({behavior:'smooth'}), 200);
          }}
          className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-700 flex items-center space-x-2 transition"
        >
          <SettingsIcon className="w-4 h-4 text-gray-400" />
          <span>Withdrawal Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#13141a] p-4 rounded-2xl border border-white/5">
          <div className="text-sm text-white/50 font-bold mb-1">Pending</div>
          <div className="text-2xl font-black text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-[#13141a] p-4 rounded-2xl border border-white/5">
          <div className="text-sm text-white/50 font-bold mb-1">Approved</div>
          <div className="text-2xl font-black text-[#00E676]">{stats.approved}</div>
        </div>
        <div className="bg-[#13141a] p-4 rounded-2xl border border-white/5">
          <div className="text-sm text-white/50 font-bold mb-1">Rejected</div>
          <div className="text-2xl font-black text-red-400">{stats.rejected}</div>
        </div>
        <div className="bg-[#13141a] p-4 rounded-2xl border border-white/5">
          <div className="text-sm text-white/50 font-bold mb-1">Total Paid</div>
          <div className="text-2xl font-black text-white">${stats.totalPaid.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-[#13141a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, ID, method..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Gems Deducted</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Payment Method</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/50">Loading requests...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/50">No requests found.</td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={req.userAvatar} alt="" className="w-8 h-8 rounded-full bg-white/10" />
                        <div>
                          <div className="font-bold text-white text-sm">{req.userName}</div>
                          <div className="text-xs text-white/40">{req.userId.substring(0, 12)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-[#00E676]">${req.amount.toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-white/70">{req.gemsDeducted}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-white capitalize">{req.paymentMethod}</div>
                      <div className="text-xs text-white/50">{req.paymentDetails}</div>
                    </td>
                    <td className="p-4">
                      {req.status === 'pending' && <span className="text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded-md">Pending</span>}
                      {req.status === 'approved' && <span className="text-[#00E676] text-xs font-bold bg-[#00E676]/10 px-2 py-1 rounded-md">Approved</span>}
                      {req.status === 'rejected' && <span className="text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded-md">Rejected</span>}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-white/60">{new Date(req.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'approved')}
                            className="p-2 hover:bg-[#00E676]/20 text-[#00E676] rounded-xl transition-colors"
                            title="Approve & Mark as Paid"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                            title="Reject & Refund Gems"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                           onClick={() => handleDelete(req.id)}
                           className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-colors"
                           title="Delete Record"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
