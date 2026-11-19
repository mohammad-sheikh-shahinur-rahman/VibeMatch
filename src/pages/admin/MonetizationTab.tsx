import React from 'react';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server } from 'lucide-react';
import { FreeFireDiamond } from '../../components/FreeFireDiamond';
import { COUNTRIES } from '../../lib/countries';

export const MonetizationTab = (props: any) => {
  const { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleBanUser, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleSaveUserEdit, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession } = props;

  return (
<div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-black text-white">Monetization Management</h1>
              <div className="flex space-x-2 bg-[#181a20] p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setMonetizationTab('packs')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    monetizationTab === 'packs' ? 'bg-[#00E676]/20 text-[#00E676]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Gems Packs
                </button>
                <button
                  onClick={() => setMonetizationTab('vip')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    monetizationTab === 'vip' ? 'bg-amber-500/20 text-amber-500' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  VIP Subscriptions
                </button>
              </div>
            </div>

            {monetizationTab === 'packs' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-200">Gems Packs</h2>
                  <button
                    onClick={() => {
                      setEditPackData({ id: 'new', name: '', description: '', price: 0, gems: 0, popular: false, googlePayId: '', applePayId: '' });
                      setIsPackModalOpen(true);
                    }}
                    className="bg-[#00E676] hover:bg-[#00C853] text-black px-6 py-2 rounded-xl font-bold transition-all flex items-center space-x-2"
                  >
                    <span>Add Gems Pack</span>
                  </button>
                </div>
                
                <div className="bg-[#181a20] border border-gray-800 rounded-3xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1f232b] text-gray-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Pack Name</th>
                        <th className="py-4 px-6">Price</th>
                        <th className="py-4 px-6">Gems Amount</th>
                        <th className="py-4 px-6">Badge</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {packsList.map(pack => (
                        <tr key={pack.id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">{pack.name}</div>
                            <div className="text-xs text-gray-500">{pack.description}</div>
                          </td>
                          <td className="py-4 px-6 font-mono text-[#00E676] font-bold">${pack.price}</td>
                          <td className="py-4 px-6 font-bold text-white flex items-center space-x-1">
                            <span>{pack.gems.toLocaleString()}</span>
                            <FreeFireDiamond className="w-4 h-4 ml-1" />
                          </td>
                          <td className="py-4 px-6">
                            {pack.popular && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-[10px] font-bold">Most Popular</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => { setEditPackData(pack); setIsPackModalOpen(true); }}
                                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                              >
                                <SettingsIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePack(pack.id)}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {packsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">No packs found. Add one!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {monetizationTab === 'vip' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-200">VIP Subscription Plans</h2>
                  <button
                    onClick={() => {
                      setEditVipPlanData({ id: 'new', name: '', description: '', priceGems: 0, durationDays: 30, popular: false });
                      setIsVipPlanModalOpen(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-xl font-bold transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add VIP Plan</span>
                  </button>
                </div>
                
                <div className="bg-[#181a20] border border-gray-800 rounded-3xl overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1f232b] text-gray-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Plan Name</th>
                        <th className="py-4 px-6">Duration (Days)</th>
                        <th className="py-4 px-6">Price (Gems)</th>
                        <th className="py-4 px-6">Badge</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {vipPlansList.map(plan => (
                        <tr key={plan.id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-white flex items-center space-x-2">
                              <span>{plan.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">{plan.description}</div>
                          </td>
                          <td className="py-4 px-6 font-bold text-white">{plan.durationDays} Days</td>
                          <td className="py-4 px-6 font-bold text-cyan-400 flex items-center space-x-1">
                            <span>{plan.priceGems.toLocaleString()}</span>
                            <FreeFireDiamond className="w-4 h-4 ml-1" />
                          </td>
                          <td className="py-4 px-6">
                            {plan.popular && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-[10px] font-bold">Most Popular</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => { setEditVipPlanData(plan); setIsVipPlanModalOpen(true); }}
                                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                              >
                                <SettingsIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVipPlan(plan.id)}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {vipPlansList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">No VIP plans found. Add one!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
  );
};
