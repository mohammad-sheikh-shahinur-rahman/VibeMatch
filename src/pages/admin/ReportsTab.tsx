import React from 'react';
import { Shield, ShieldCheck, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../lib/auth';
import toast from 'react-hot-toast';

export const ReportsTab = (props: any) => {
  const { reportsList, handleReportAction, setReportsList } = props;

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
      if (res.success) {
        setReportsList(reportsList.filter((r: any) => r.id !== reportId));
        toast.success('Report deleted successfully');
      }
    } catch (e: any) {
      toast.error('Failed to delete report');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center space-x-3">
          <Shield className="w-8 h-8 text-red-500" />
          <span>Reports Queue</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">Review live reported video chat matches and content safety</p>
      </div>

      {reportsList.length === 0 ? (
        <div className="bg-[#181a20] border border-gray-800 rounded-3xl p-12 text-center shadow-lg">
          <ShieldCheck className="w-16 h-16 text-[#00E676] mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">No Reports Pending</h2>
          <p className="text-sm text-gray-400">Everything looks safe and clean.</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {reportsList.map((rep: any) => (
            <div key={rep.id} className="bg-[#181a20] border border-gray-800 hover:border-red-500/30 transition-colors rounded-3xl p-6 shadow-lg flex flex-col md:flex-row gap-6">
              
              {/* Users Information */}
              <div className="flex items-center space-x-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-800 pb-4 md:pb-0 md:pr-4">
                
                {/* Reporter (User li dar report) */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 mb-2 border border-gray-700">
                    {rep.reporterName ? rep.reporterName.substring(0, 2).toUpperCase() : 'G'}
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Reporter</span>
                  <span className="text-sm font-bold text-white text-center truncate w-full" title={rep.reporterName}>{rep.reporterName || 'Guest'}</span>
                </div>

                <ArrowRight className="w-6 h-6 text-red-500/50 flex-shrink-0" />

                {/* Reported (User lman dar report) */}
                <div className="flex flex-col items-center flex-1">
                  <img src={rep.reportedUserAvatar || '/default-avatar.png'} alt={rep.reportedUserName} className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-red-500/50" />
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Reported</span>
                  <span className="text-sm font-bold text-white text-center truncate w-full" title={rep.reportedUserName}>{rep.reportedUserName}</span>
                </div>
              </div>

              {/* Report Details & Reason (Saba) */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-red-400 font-black text-sm uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reason: {rep.reason}</span>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${rep.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-400'}`}>
                    {rep.status}
                  </span>
                </div>
                
                <p className="text-xs text-gray-300 bg-gray-900/80 p-4 rounded-2xl border border-gray-800 italic">
                  "{rep.details || 'No additional details provided by the reporter.'}"
                </p>
                <div className="text-[10px] text-gray-500 mt-2 text-right">
                  Reported on: {new Date(rep.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Actions (Buttons) */}
              <div className="flex flex-col space-y-2 md:w-48 justify-center border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-4">
                <button
                  onClick={() => handleReportAction(rep.id, 'resolved', rep.reportedUserId)}
                  disabled={rep.status === 'resolved'}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-extrabold text-xs py-3 rounded-xl transition-colors"
                >
                  Ban Reported User
                </button>
                <button
                  onClick={() => handleReportAction(rep.id, 'dismissed')}
                  disabled={rep.status === 'dismissed'}
                  className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-500 text-gray-300 font-bold text-xs py-3 rounded-xl transition-colors"
                >
                  Dismiss Report
                </button>
                <button
                  onClick={() => handleDelete(rep.id)}
                  className="w-full bg-transparent hover:bg-red-500/10 text-gray-500 hover:text-red-500 border border-transparent hover:border-red-500/30 font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
