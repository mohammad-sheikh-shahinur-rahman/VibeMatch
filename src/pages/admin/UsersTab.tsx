import React from 'react';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server } from 'lucide-react';
import { FreeFireDiamond } from '../../components/FreeFireDiamond';
import { COUNTRIES } from '../../lib/countries';

export const UsersTab = (props: any) => {
  const { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleToggleBan, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleEditUserSave, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession } = props;

  return (
<div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">User Accounts</h1>
                <p className="text-xs text-gray-400 mt-1">Manage user profiles, gems balances, and bans</p>
              </div>

              <button
                onClick={() => {
                  const csv = ['ID,Name,Email,Country,Gems,Status'].concat(
                    usersList.map((u: any) => `"${u.id}","${u.name}","${u.email}","${u.country}","${u.gems}","${u.isBanned ? 'Banned' : 'Active'}"`)
                  ).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'users_export.csv';
                  a.click();
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-700 flex items-center space-x-2 transition"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              
              <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 rounded-2xl px-3.5 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* User Table */}
            <div className="bg-[#181a20] border border-gray-800 rounded-3xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f232b] text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Country</th>
                    <th className="p-4">Gems</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {usersList
                    .filter(u => u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || u.email.toLowerCase().includes(searchUserQuery.toLowerCase()))
                    .map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-gray-700" />
                          <div>
                            <span className="font-extrabold text-white block">{u.name}</span>
                            <span className="text-[10px] text-gray-400">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">{u.country}</td>
                        <td className="p-4 font-black text-amber-400">💎 {u.gems}</td>
                        <td className="p-4">
                          {u.isBanned ? (
                            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">BANNED</span>
                          ) : (
                            <span className="bg-[#00E676]/20 text-[#00E676] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                          )}
                        </td>
                        <td className="p-4 flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedUserGemsModal(u)}
                            className="p-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black rounded-lg transition-colors"
                            title="Add Gems"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <SettingsIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isBanned
                                ? 'bg-[#00E676]/20 text-[#00E676] hover:bg-[#00E676] hover:text-black'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                            }`}
                            title={u.isBanned ? 'Unban User' : 'Ban User'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(u.id)}
                            className="p-1.5 bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
  );
};
