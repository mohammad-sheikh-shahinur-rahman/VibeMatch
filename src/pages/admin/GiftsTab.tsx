import React from 'react';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server } from 'lucide-react';
import { FreeFireDiamond } from '../../components/FreeFireDiamond';
import { COUNTRIES } from '../../lib/countries';

export const GiftsTab = (props: any) => {
  const { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleBanUser, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleSaveUserEdit, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession } = props;

  return (
<div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-white">Gifts System</h1>
                <p className="text-xs text-gray-400 mt-1">Manage virtual gifts and pricing</p>
              </div>
              <button
                onClick={() => {
                  setEditGiftData({ id: 'new', name: '', price: 10 });
                  setIsGiftModalOpen(true);
                }}
                className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Gift</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {giftsList.map(gift => (
                <div key={gift.id} className="bg-[#181a20] rounded-2xl border border-gray-800 p-4 flex flex-col items-center justify-center relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                      onClick={() => {
                        setEditGiftData(gift);
                        setIsGiftModalOpen(true);
                      }}
                      className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <SettingsIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGift(gift.id)}
                      className="bg-red-500/20 text-red-400 p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <img src={gift.imagePath} alt={gift.name} className="w-16 h-16 object-contain mb-3 drop-shadow-lg" />
                  <h3 className="text-sm font-bold text-white text-center">{gift.name}</h3>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-yellow-400 font-bold">{gift.price}</span>
                    <span className="text-[10px] text-gray-400">Gems</span>
                  </div>
                </div>
              ))}
              {giftsList.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-500 font-bold">
                  No gifts added yet.
                </div>
              )}
            </div>
          </div>
  );
};
