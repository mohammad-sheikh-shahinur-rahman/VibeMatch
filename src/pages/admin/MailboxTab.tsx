import React from 'react';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server } from 'lucide-react';
import { FreeFireDiamond } from '../../components/FreeFireDiamond';
import { COUNTRIES } from '../../lib/countries';

export const MailboxTab = (props: any) => {
  const { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleBanUser, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleSaveUserEdit, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession } = props;

  return (
<div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white">Mailbox</h1>
              <p className="text-xs text-gray-400 mt-1">Messages from users via Contact Us</p>
            </div>

            <div className="space-y-4">
              {mailboxList.length === 0 ? (
                <div className="text-center py-10 bg-[#181a20] rounded-3xl border border-gray-800 text-gray-500 font-bold">
                  No messages yet.
                </div>
              ) : (
                mailboxList.map(msg => (
                  <div key={msg.id} className="bg-[#181a20] border border-gray-800 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#00E676]/20 flex items-center justify-center text-[#00E676] font-bold text-lg">
                          {msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{msg.name}</h4>
                          <span className="text-xs text-gray-400">{msg.email}</span>
                        </div>
                        {msg.status === 'unread' && (
                          <span className="bg-[#00E676] text-black text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">NEW</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 bg-gray-900 p-4 rounded-2xl border border-gray-800 mt-2">
                        {msg.message}
                      </p>
                      <div className="text-[10px] text-gray-500">
                        Received: {new Date(msg.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 w-full md:w-auto">
                      <button 
                        onClick={async () => {
                          await deleteMailboxMessage(msg.id);
                          setMailboxList(mailboxList.filter(m => m.id !== msg.id));
                          toast.success('Message deleted');
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs py-2 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
  );
};
