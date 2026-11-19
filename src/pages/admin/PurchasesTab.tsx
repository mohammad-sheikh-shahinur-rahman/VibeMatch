import React from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/auth';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server } from 'lucide-react';
import { FreeFireDiamond } from '../../components/FreeFireDiamond';
import { COUNTRIES } from '../../lib/countries';

export const PurchasesTab = (props: any) => {
  const { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleBanUser, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleSaveUserEdit, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession } = props;

  
  const handleDeletePurchase = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase record?')) return;
    try {
      await apiFetch(`/api/admin/purchases/${id}`, { method: 'DELETE' });
      toast.success('Record deleted successfully');
      // Refresh list
      const updatedList = purchasesList.filter((p: any) => p.id !== id);
      setPurchasesList(updatedList);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete record');
    }
  };
  
  return (
<div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Gems Packs Purchase History</h1>
            <p className="text-xs text-gray-400 mt-1">Recent transactions and pack purchases by users.</p>
            
            <div className="bg-[#181a20] border border-gray-800 rounded-3xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f232b] text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Pack Name</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {purchasesList.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center">No purchases found.</td></tr>
                  ) : purchasesList.map(p => (
                    <tr key={p.id} className="hover:bg-gray-800/40">
                      <td className="p-4 font-mono text-gray-500">{p.id.substring(0, 15)}</td>
                      <td className="p-4">{p.username}</td>
                      <td className="p-4 text-amber-400 font-bold">{p.packName}</td>
                      <td className="p-4 font-mono">${(p.price || 0).toFixed(2)}</td>
                      <td className="p-4 uppercase text-[10px] bg-gray-800 px-2 py-1 rounded inline-block mt-2 font-bold tracking-wider">{p.paymentMethod}</td>
                      <td className="p-4">{new Date(p.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeletePurchase(p.id)}
                          className="p-2 hover:bg-white/10 text-white/50 hover:text-red-400 rounded-xl transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
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
