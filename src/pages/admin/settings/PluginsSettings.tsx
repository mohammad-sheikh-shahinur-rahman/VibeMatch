import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const PluginsSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
                    
                    {/* Google Analytics */}
                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-black text-white flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Google Analytics</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">Track user behavior and platform traffic.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings.enableGoogleAnalytics ?? false} onChange={(e) => setSettings({ ...settings, enableGoogleAnalytics: e.target.checked })} />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                        </label>
                      </div>
                      {settings.enableGoogleAnalytics && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tracking ID (G-XXXXXXX)</label>
                          <input
                            type="text"
                            placeholder="G-..."
                            value={settings.googleAnalyticsId || ''}
                            onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                            className="w-full bg-[#181a20] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Google ReCaptcha */}
                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-black text-white flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span>Google reCAPTCHA</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">Protect login and registration from bots.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings.enableRecaptcha ?? false} onChange={(e) => setSettings({ ...settings, enableRecaptcha: e.target.checked })} />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                        </label>
                      </div>
                      {settings.enableRecaptcha && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Site Key</label>
                            <input
                              type="text"
                              value={settings.recaptchaSiteKey || ''}
                              onChange={(e) => setSettings({ ...settings, recaptchaSiteKey: e.target.value })}
                              className="w-full bg-[#181a20] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Secret Key</label>
                            <input
                              type="password"
                              value={settings.recaptchaSecretKey || ''}
                              onChange={(e) => setSettings({ ...settings, recaptchaSecretKey: e.target.value })}
                              className="w-full bg-[#181a20] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">reCAPTCHA Version</label>
                            <select
                              value={settings.recaptchaVersion || 'v3'}
                              onChange={(e) => setSettings({ ...settings, recaptchaVersion: e.target.value })}
                              className="w-full bg-[#181a20] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            >
                              <option value="v2">v2 (I'm not a robot checkbox)</option>
                              <option value="v3">v3 (Invisible)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tawk.to Live Chat */}
                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-black text-white flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Tawk.to Live Chat</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">Provide real-time support to your users.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings.enableTawkto ?? false} onChange={(e) => setSettings({ ...settings, enableTawkto: e.target.checked })} />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E676]"></div>
                        </label>
                      </div>
                      {settings.enableTawkto && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Property ID (Direct Chat Link ID)</label>
                          <input
                            type="text"
                            placeholder="e.g. 64b2c1..."
                            value={settings.tawktoPropertyId || ''}
                            onChange={(e) => setSettings({ ...settings, tawktoPropertyId: e.target.value })}
                            className="w-full bg-[#181a20] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
  );
};
