import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const BackupSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 max-w-4xl w-full">
                     <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                       <div>
                         <h3 className="text-lg font-bold text-white mb-2">Export Data</h3>
                         <p className="text-xs text-gray-400">Download a full JSON backup of all users, packs, gifts, and settings.</p>
                       </div>
                       <button onClick={async () => {
                         try {
                           const res = await fetch('/api/admin/backup', { headers: { Authorization: 'Bearer ' + localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token') } });
                           if (!res.ok) throw new Error('Export failed');
                           const blob = await res.blob();
                           const url = window.URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.href = url;
                           a.download = 'vibematch-backup.json';
                           a.click();
                         } catch (e) {}
                       }} className="px-6 py-3 bg-[#00E676] text-black font-bold rounded-xl text-sm hover:bg-[#00C853] transition whitespace-nowrap">
                         Export Backup
                       </button>
                     </div>
                     <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                       <div>
                         <h3 className="text-lg font-bold text-white mb-2">Import Data</h3>
                         <p className="text-xs text-gray-400">Restore your platform data from a JSON backup file.</p>
                       </div>
                       <div>
                         <label className="cursor-pointer px-6 py-3 bg-gray-800 text-white font-bold rounded-xl text-sm hover:bg-gray-700 transition whitespace-nowrap inline-block">
                           Select File to Import
                           <input type="file" className="hidden" accept=".json" onChange={async (e) => {
                             if (!e.target.files || !e.target.files[0]) return;
                             const formData = new FormData();
                             formData.append('backup', e.target.files[0]);
                             try {
                               const res = await fetch('/api/admin/backup', { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token') }, body: formData });
                               if (res.ok) alert('Backup imported successfully! Please refresh.');
                               else alert('Failed to import backup');
                             } catch(err) { alert('Error importing'); }
                           }} />
                         </label>
                       </div>
                     </div>
                   </div>
  );
};
