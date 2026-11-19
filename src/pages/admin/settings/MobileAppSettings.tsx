import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';

const MobileSettingsView = ({ settings, setSettings }: any) => {
  const [platform, setPlatform] = React.useState('android'); // android | ios
  const [subTab, setSubTab] = React.useState('general'); // general | ads
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const generateKey = () => {
    const newKey = 'vibe_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    setSettings({ ...settings, mobileApiAccessKey: newKey });
  };

  const currentPrefix = platform === 'android' ? 'android' : 'ios';

  return (
    <div className="space-y-6 max-w-4xl w-full">
      {/* API Settings */}
      <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-white">API Settings</h3>
        
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">API Base URL (Site URL)</label>
          <div className="flex gap-2">
            <input type="text" value={settings?.siteUrl + "/api/mobile/v1"} readOnly className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
            <button onClick={() => handleCopy(settings?.siteUrl + "/api/mobile/v1")} className="px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition font-bold text-sm">Copy</button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">API Access Key</label>
          <div className="flex gap-2">
            <input type="text" value={settings?.mobileApiAccessKey || ''} onChange={(e) => setSettings({ ...settings, mobileApiAccessKey: e.target.value })} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
            <button onClick={generateKey} className="px-4 py-3 bg-[#00E676]/20 text-[#00E676] rounded-xl hover:bg-[#00E676]/30 transition font-bold text-sm whitespace-nowrap">Generate</button>
          </div>
        </div>
      </div>

      {/* Platform & SubTab Selection */}
      <div className="bg-[#181a20] rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-800">
          <button onClick={() => setPlatform('android')} className={`flex-1 py-4 font-bold text-sm transition-colors ${platform === 'android' ? 'text-[#00E676] border-b-2 border-[#00E676] bg-[#00E676]/5' : 'text-gray-400 hover:bg-gray-800/50'}`}>Android App Settings</button>
          <button onClick={() => setPlatform('ios')} className={`flex-1 py-4 font-bold text-sm transition-colors ${platform === 'ios' ? 'text-[#00E676] border-b-2 border-[#00E676] bg-[#00E676]/5' : 'text-gray-400 hover:bg-gray-800/50'}`}>iOS App Settings</button>
        </div>
        <div className="flex border-b border-gray-800 bg-gray-900/50">
          <button onClick={() => setSubTab('general')} className={`flex-1 py-3 font-bold text-xs transition-colors ${subTab === 'general' ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}>General</button>
          <button onClick={() => setSubTab('ads')} className={`flex-1 py-3 font-bold text-xs transition-colors ${subTab === 'ads' ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-gray-300'}`}>Ads</button>
        </div>

        <div className="p-6">
          {subTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Privacy Policy Link</label>
                <input type="text" value={settings?.[currentPrefix + 'PrivacyUrl'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'PrivacyUrl']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Terms Of Service Link</label>
                <input type="text" value={settings?.[currentPrefix + 'TermsUrl'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'TermsUrl']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Rate Us Link</label>
                <input type="text" value={settings?.[currentPrefix + 'RateUrl'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'RateUrl']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Update Link</label>
                <input type="text" value={settings?.[currentPrefix + 'UpdateUrl'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'UpdateUrl']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Version Code</label>
                <input type="text" value={settings?.[currentPrefix + 'VersionCode'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'VersionCode']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all" />
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <label className="flex items-center space-x-3 cursor-pointer mt-6">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={!!settings?.[currentPrefix + 'ForceUpdate']} onChange={(e) => setSettings({...settings, [currentPrefix + 'ForceUpdate']: e.target.checked})} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings?.[currentPrefix + 'ForceUpdate'] ? 'bg-[#00E676]' : 'bg-gray-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings?.[currentPrefix + 'ForceUpdate'] ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-bold text-white">Force Update</span>
                </label>
              </div>
            </div>
          )}

          {subTab === 'ads' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Ads Provider</label>
                <select
                  value={settings?.[currentPrefix + 'AdsProvider'] || 'multi'}
                  onChange={(e) => setSettings({...settings, [currentPrefix + 'AdsProvider']: e.target.value})}
                  className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] outline-none transition-all appearance-none"
                >
                  <option value="google">Google AdMob</option>
                  <option value="applovin">AppLovin MAX</option>
                  <option value="facebook">Facebook Audience Network</option>
                  <option value="multi">Multi Ads (Rotation)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={settings?.[currentPrefix + 'AdsEnabled'] !== false} onChange={(e) => setSettings({...settings, [currentPrefix + 'AdsEnabled']: e.target.checked})} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings?.[currentPrefix + 'AdsEnabled'] !== false ? 'bg-[#00E676]' : 'bg-gray-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings?.[currentPrefix + 'AdsEnabled'] !== false ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-bold text-white">Enable Ads</span>
                </label>
              </div>

              {(settings?.[currentPrefix + 'AdsProvider'] === 'google' || settings?.[currentPrefix + 'AdsProvider'] === 'multi') && (
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#00E676] text-sm">Google AdMob Settings</h4>
                    <label className="flex items-center space-x-3 cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only" checked={settings?.[currentPrefix + 'AdmobEnabled'] !== false} onChange={(e) => setSettings({...settings, [currentPrefix + 'AdmobEnabled']: e.target.checked})} /><div className={`block w-8 h-5 rounded-full transition-colors ${settings?.[currentPrefix + 'AdmobEnabled'] !== false ? 'bg-[#00E676]' : 'bg-gray-700'}`}></div><div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${settings?.[currentPrefix + 'AdmobEnabled'] !== false ? 'translate-x-3' : ''}`}></div></div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enable</span></label>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input placeholder="App ID" type="text" value={settings?.[currentPrefix + 'AdmobAppId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'AdmobAppId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] outline-none" />
                    <input placeholder="Banner ID" type="text" value={settings?.[currentPrefix + 'AdmobBannerId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'AdmobBannerId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] outline-none" />
                    <input placeholder="Interstitial ID" type="text" value={settings?.[currentPrefix + 'AdmobInterstitialId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'AdmobInterstitialId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-[#00E676] outline-none" />
                  </div>
                </div>
              )}

              {(settings?.[currentPrefix + 'AdsProvider'] === 'applovin' || settings?.[currentPrefix + 'AdsProvider'] === 'multi') && (
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-blue-400 text-sm">AppLovin MAX Settings</h4>
                    <label className="flex items-center space-x-3 cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only" checked={settings?.[currentPrefix + 'ApplovinEnabled'] !== false} onChange={(e) => setSettings({...settings, [currentPrefix + 'ApplovinEnabled']: e.target.checked})} /><div className={`block w-8 h-5 rounded-full transition-colors ${settings?.[currentPrefix + 'ApplovinEnabled'] !== false ? 'bg-blue-400' : 'bg-gray-700'}`}></div><div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${settings?.[currentPrefix + 'ApplovinEnabled'] !== false ? 'translate-x-3' : ''}`}></div></div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enable</span></label>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input placeholder="SDK Key" type="text" value={settings?.[currentPrefix + 'ApplovinSdkKey'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'ApplovinSdkKey']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-blue-400 outline-none" />
                    <input placeholder="Banner ID" type="text" value={settings?.[currentPrefix + 'ApplovinBannerId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'ApplovinBannerId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-blue-400 outline-none" />
                    <input placeholder="Interstitial ID" type="text" value={settings?.[currentPrefix + 'ApplovinInterstitialId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'ApplovinInterstitialId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-blue-400 outline-none" />
                  </div>
                </div>
              )}

              {(settings?.[currentPrefix + 'AdsProvider'] === 'facebook' || settings?.[currentPrefix + 'AdsProvider'] === 'multi') && (
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-blue-600 text-sm">Facebook Audience Network Settings</h4>
                    <label className="flex items-center space-x-3 cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only" checked={settings?.[currentPrefix + 'FacebookEnabled'] !== false} onChange={(e) => setSettings({...settings, [currentPrefix + 'FacebookEnabled']: e.target.checked})} /><div className={`block w-8 h-5 rounded-full transition-colors ${settings?.[currentPrefix + 'FacebookEnabled'] !== false ? 'bg-blue-600' : 'bg-gray-700'}`}></div><div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${settings?.[currentPrefix + 'FacebookEnabled'] !== false ? 'translate-x-3' : ''}`}></div></div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enable</span></label>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input placeholder="App ID" type="text" value={settings?.[currentPrefix + 'FacebookAppId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'FacebookAppId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-blue-600 outline-none" />
                    <input placeholder="Banner ID" type="text" value={settings?.[currentPrefix + 'FacebookBannerId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'FacebookBannerId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-blue-600 outline-none" />
                    <input placeholder="Interstitial ID" type="text" value={settings?.[currentPrefix + 'FacebookInterstitialId'] || ''} onChange={(e) => setSettings({...settings, [currentPrefix + 'FacebookInterstitialId']: e.target.value})} className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-blue-600 outline-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MobileAppSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <MobileSettingsView settings={settings} setSettings={setSettings} />
  );
};
