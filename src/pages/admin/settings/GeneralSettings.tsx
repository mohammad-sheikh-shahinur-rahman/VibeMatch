import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const GeneralSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-black text-white mb-4">General Website Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Site Name</label>
                        <input
                          type="text"
                          value={settings.siteName || ''}
                          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Site URL</label>
                        <input
                          type="text"
                          value={settings.siteUrl || ''}
                          onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Bonus User (Gems for new users)</label>
                        <input
                          type="number"
                          value={settings.bonusGems || 0}
                          onChange={(e) => setSettings({ ...settings, bonusGems: Number(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Discover Grid Users</label>
                        <select
                          value={settings.discoverGridUsers || 'demo_only'}
                          onChange={(e) => setSettings({ ...settings, discoverGridUsers: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        >
                          <option value="demo_only">Demo Users Only</option>
                          <option value="real_only">Real Users Only</option>
                          <option value="real_no_guest">Real Users (Exclude Guests)</option>
                          <option value="all">All Users (Demo + Real)</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Select which users should appear in the Discover Grid.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Terms URL</label>
                        <input
                          type="text"
                          value={settings.termsUrl || ''}
                          onChange={(e) => setSettings({ ...settings, termsUrl: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Privacy Policy URL</label>
                        <input
                          type="text"
                          value={settings.privacyUrl || ''}
                          onChange={(e) => setSettings({ ...settings, privacyUrl: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Footer Description</label>
                        <textarea
                          value={settings.footerDescription || ''}
                          onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] h-24 resize-none"
                          placeholder="e.g. Connect with real people instantly. The most secure, fast, and exciting video chat platform."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Footer Copyright Text</label>
                        <input
                          type="text"
                          value={settings.footerCopyright || ''}
                          onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          placeholder="e.g. © 2026 VibeMatch. All rights reserved."
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-800">
                        <h4 className="text-sm font-bold text-white mb-4">Online Users Counter</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-700">
                            <div>
                              <p className="font-bold text-white">Show Online Users</p>
                              <p className="text-xs text-gray-400">Display the live counter</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.showOnlineUsers !== false}
                                onChange={(e) => setSettings({ ...settings, showOnlineUsers: e.target.checked })}
                              />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                            </label>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Fake Base Count</label>
                            <input
                              type="number"
                              value={settings.fakeOnlineUsersCount || 0}
                              onChange={(e) => setSettings({ ...settings, fakeOnlineUsersCount: parseInt(e.target.value) || 0 })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                              placeholder="e.g. 1000"
                            />
                            <p className="text-xs text-gray-500 mt-1">This number is added to the real connections.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-800">
                        <h4 className="text-sm font-bold text-white mb-4">App Store & Social Media Links</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Play Store URL</label>
                            <input
                              type="text"
                              value={settings.playStoreUrl || ''}
                              onChange={(e) => setSettings({ ...settings, playStoreUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">App Store URL</label>
                            <input
                              type="text"
                              value={settings.appStoreUrl || ''}
                              onChange={(e) => setSettings({ ...settings, appStoreUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Facebook URL</label>
                            <input
                              type="text"
                              value={settings.facebookUrl || ''}
                              onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Instagram URL</label>
                            <input
                              type="text"
                              value={settings.instagramUrl || ''}
                              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Twitter URL</label>
                            <input
                              type="text"
                              value={settings.twitterUrl || ''}
                              onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">TikTok URL</label>
                            <input
                              type="text"
                              value={settings.tiktokUrl || ''}
                              onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Upload Site Logo (PNG/JPG)</label>
                        <div className="flex items-center space-x-4">
                          {settings.logoUrl && (
                            <img src={settings.logoUrl} alt="Logo preview" className="h-10 object-contain bg-gray-800 rounded p-1" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'logo')}
                            disabled={isUploadingFile}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#00E676] file:text-black hover:file:bg-[#00C853]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Upload Favicon (.ICO/.PNG)</label>
                        <div className="flex items-center space-x-4">
                          {settings.faviconUrl && (
                            <img src={settings.faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain bg-gray-800 rounded p-1" />
                          )}
                          <input
                            type="file"
                            accept="image/x-icon,image/png"
                            onChange={(e) => handleFileUpload(e, 'favicon')}
                            disabled={isUploadingFile}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#00E676] file:text-black hover:file:bg-[#00C853]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
  );
};
