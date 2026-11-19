import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const SecuritySettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-black text-white mb-4">System Security Policies</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Max Login Attempts</label>
                        <input
                          type="number"
                          value={settings.maxLoginAttempts || 5}
                          onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Session Timeout (Mins)</label>
                        <input
                          type="number"
                          value={settings.sessionTimeoutMins || 60}
                          onChange={(e) => setSettings({ ...settings, sessionTimeoutMins: Number(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                    </div>
                  </div>
  );
};
