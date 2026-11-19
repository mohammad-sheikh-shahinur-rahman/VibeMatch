import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const SEOSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-black text-white mb-4">SEO & Metadata Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Meta Title</label>
                        <input
                          type="text"
                          value={settings.seoTitle || ''}
                          onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Meta Description</label>
                        <textarea
                          rows={3}
                          value={settings.seoDescription || ''}
                          onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Keywords</label>
                        <input
                          type="text"
                          value={settings.seoKeywords || ''}
                          onChange={(e) => setSettings({ ...settings, seoKeywords: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          placeholder="dating, video chat, meet people"
                        />
                      </div>
                    </div>
                  </div>
  );
};
