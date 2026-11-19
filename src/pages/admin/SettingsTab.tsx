import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server } from 'lucide-react';
import { FreeFireDiamond } from '../../components/FreeFireDiamond';
import { COUNTRIES } from '../../lib/countries';

import { GeneralSettings } from './settings/GeneralSettings';
import { AuthSettings } from './settings/AuthSettings';
import { SEOSettings } from './settings/SEOSettings';
import { MailSettings } from './settings/MailSettings';
import { PaymentSettings } from './settings/PaymentSettings';
import { SecuritySettings } from './settings/SecuritySettings';
import { StorageSettings } from './settings/StorageSettings';
import { PWASettings } from './settings/PWASettings';
import { PluginsSettings } from './settings/PluginsSettings';
import { LanguagesSettings } from './settings/LanguagesSettings';
import { MobileAppSettings } from './settings/MobileAppSettings';
import { BackupSettings } from './settings/BackupSettings';



export const SettingsTab = (props: any) => {
  const [activeLanguages, setActiveLanguages] = useState<any[]>([]);
  
  useEffect(() => {
    if (props.settingsSubTab === 'languages') {
      fetch('/api/languages')
        .then(res => res.json())
        .then(data => {
          if (data.languages) {
            setActiveLanguages(data.languages);
          }
        });
    }
  }, [props.settingsSubTab]);
  const { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleBanUser, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleSaveUserEdit, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession } = props;

  return (
    <>
  <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-white capitalize">{settingsSubTab} Settings</h1>
                  <p className="text-xs text-gray-400 mt-1">Configure system preferences for {settingsSubTab} module.</p>
                </div>
              <button
                onClick={handleSaveSettings}
                className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Settings Submenu Sidebar matching Image 7 */}
              <div className="w-full md:w-56 space-y-1 bg-[#181a20] border border-gray-800 p-3 rounded-3xl">
                {[
                  { id: 'general', label: 'General', icon: Globe },
                  { id: 'seo', label: 'SEO & Metadata', icon: Globe },
                  { id: 'mail', label: 'Mail config', icon: Mail },
                  { id: 'pwa', label: 'Performance & PWA', icon: Zap },
                  { id: 'plugins', label: 'Plugins', icon: Zap },
                  { id: 'auth', label: 'Authentication', icon: Lock },
                  { id: 'security', label: 'Security', icon: ShieldCheck },
                  { id: 'backup', label: 'Backup & Restore', icon: Database },
                  { id: 'payment', label: 'Payment Gateway', icon: DollarSign },
                  { id: 'webrtc', label: 'WebRTC / Live Config', icon: Video },
                  { id: 'languages', label: 'Languages', icon: Globe },
                  { id: 'mobile', label: 'Mobile App', icon: Smartphone },
                  { id: 'storage', label: 'Storage', icon: Database },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => navigate(`/admin/settings/${sub.id}`)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      settingsSubTab === sub.id
                        ? 'bg-red-500/10 text-red-400 border-l-4 border-red-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Subtab Content */}
              <div className="flex-1 bg-[#181a20] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
                
                {settingsSubTab === 'general' && <GeneralSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {settingsSubTab === 'auth' && <AuthSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {settingsSubTab === 'seo' && <SEOSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {settingsSubTab === 'mail' && <MailSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                { settingsSubTab === 'webrtc' && (
                  <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-black text-white mb-4">WebRTC & Live Video Infrastructure</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Active Provider</label>
                        <select
                          value={settings.activeWebrtcProvider || 'default'}
                          onChange={(e) => setSettings({ ...settings, activeWebrtcProvider: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] cursor-pointer"
                        >
                          <option value="default">Default (Google Free STUN - No API Key required)</option>
                          <option value="twilio">Twilio (Paid TURN & STUN)</option>
                          <option value="metered">Metered Video (TURN & STUN)</option>
                          <option value="xirsys">Xirsys (TURN & STUN)</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">Select the infrastructure provider to handle real-time video connections.</p>
                      </div>

                      {settings.activeWebrtcProvider === 'twilio' && (
                        <div className="p-4 border border-blue-500/30 bg-blue-500/10 rounded-xl space-y-4">
                          <h4 className="text-sm font-bold text-blue-400">Twilio Configuration</h4>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Account SID</label>
                            <input
                              type="text"
                              value={settings.twilioAccountSid || ''}
                              onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Auth Token</label>
                            <input
                              type="password"
                              value={settings.twilioAuthToken || ''}
                              onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                        </div>
                      )}

                      {settings.activeWebrtcProvider === 'metered' && (
                        <div className="p-4 border border-green-500/30 bg-green-500/10 rounded-xl space-y-4">
                          <h4 className="text-sm font-bold text-green-400">Metered Video Configuration</h4>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">API Key</label>
                            <input
                              type="password"
                              value={settings.meteredApiKey || ''}
                              onChange={(e) => setSettings({ ...settings, meteredApiKey: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                        </div>
                      )}

                      {settings.activeWebrtcProvider === 'xirsys' && (
                        <div className="p-4 border border-purple-500/30 bg-purple-500/10 rounded-xl space-y-4">
                          <h4 className="text-sm font-bold text-purple-400">Xirsys Configuration</h4>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Ident / Domain (e.g. username)</label>
                            <input
                              type="text"
                              value={settings.xirsysDomain || ''}
                              onChange={(e) => setSettings({ ...settings, xirsysDomain: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Secret Key</label>
                            <input
                              type="password"
                              value={settings.xirsysSecret || ''}
                              onChange={(e) => setSettings({ ...settings, xirsysSecret: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {settingsSubTab === 'payment' && <PaymentSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {settingsSubTab === 'security' && <SecuritySettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {/* Storage Settings */}
                {settingsSubTab === 'storage' && <StorageSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}
                {/* PWA & Performance Settings */}
                {settingsSubTab === 'pwa' && <PWASettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}
                
                {/* Plugins Settings */}
                {settingsSubTab === 'plugins' && <PluginsSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {/* Placeholder for other sub-tabs */}
                {settingsSubTab === 'languages' && <LanguagesSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}

                {settingsSubTab === 'mobile' && <MobileAppSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}
                {settingsSubTab === 'backup' && <BackupSettings settings={settings} setSettings={setSettings} handleFileUpload={handleFileUpload} isUploadingFile={isUploadingFile} testEmail={testEmail} setTestEmail={setTestEmail} testEmailStatus={testEmailStatus} handleSendTestEmail={handleSendTestEmail} testingStorage={testingStorage} handleTestStorage={handleTestStorage} activeLanguages={activeLanguages} setActiveLanguages={setActiveLanguages} />}
              </div>
            </div>
          </div>
    </>
  );
};
