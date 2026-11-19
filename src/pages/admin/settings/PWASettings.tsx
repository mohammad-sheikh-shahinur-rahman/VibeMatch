import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const PWASettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm">
                      <h3 className="text-lg font-black text-white mb-6">Performance Optimization</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <p className="text-sm font-bold text-white">Image Optimization</p>
                            <p className="text-xs text-gray-400">Automatically compress and convert images to WebP format.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.imageOptimization ?? true} onChange={(e) => setSettings({ ...settings, imageOptimization: e.target.checked })} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <p className="text-sm font-bold text-white">Minify HTML & CSS</p>
                            <p className="text-xs text-gray-400">Enable Gzip/Brotli compression to reduce page size.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.minifyHtmlCss ?? true} onChange={(e) => setSettings({ ...settings, minifyHtmlCss: e.target.checked })} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <p className="text-sm font-bold text-white">Lazy Load Images</p>
                            <p className="text-xs text-gray-400">Defer loading of images until they scroll into view.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.lazyLoadImages ?? true} onChange={(e) => setSettings({ ...settings, lazyLoadImages: e.target.checked })} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <p className="text-sm font-bold text-white">Database Query Caching</p>
                            <p className="text-xs text-gray-400">Cache frequent MongoDB queries (e.g. Discover grid) for faster loads.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.dbQueryCaching ?? false} onChange={(e) => setSettings({ ...settings, dbQueryCaching: e.target.checked })} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm mt-6">
                      <h3 className="text-lg font-black text-white mb-6">Progressive Web App (PWA)</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <p className="text-sm font-bold text-white">Enable PWA</p>
                            <p className="text-xs text-gray-400">Allow users to install VibeMatch as a standalone app on their devices.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.pwaEnabled ?? false} onChange={(e) => setSettings({ ...settings, pwaEnabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                          </label>
                        </div>
                        {settings.pwaEnabled && (
                          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                            <label className="block text-sm font-bold text-white mb-2">Install Prompt Delay (Seconds)</label>
                            <p className="text-xs text-gray-400 mb-3">How many seconds should the user wait before seeing the "Install App" popup? (If already installed, it won't appear).</p>
                            <input
                              type="number"
                              min="0"
                              value={settings.pwaPromptDelay ?? 5}
                              onChange={(e) => setSettings({ ...settings, pwaPromptDelay: Number(e.target.value) })}
                              className="w-full md:w-1/2 bg-[#181a20] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
  );
};
