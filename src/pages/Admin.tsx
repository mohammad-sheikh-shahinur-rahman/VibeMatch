import { SettingsTab } from './admin/SettingsTab';
import { PagesTab } from './admin/PagesTab';
import { OverviewTab } from './admin/OverviewTab';
import { UsersTab } from './admin/UsersTab';
import { ReportsTab } from './admin/ReportsTab';
import { MailboxTab } from './admin/MailboxTab';
import { DemoUsersTab } from './admin/DemoUsersTab';
import { GiftsTab } from './admin/GiftsTab';
import { PurchasesTab } from './admin/PurchasesTab';
import { MonetizationTab } from './admin/MonetizationTab';
import { WithdrawalsTab } from './admin/WithdrawalsTab';
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users as UsersIcon, Video, Shield, DollarSign, 
  Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, 
  XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone,
  Mail, Zap, FileText, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server, CreditCard
} from 'lucide-react';
import { FreeFireDiamond } from '../components/FreeFireDiamond';
import { User, AdminSettings, ModerationReport, Gift, Purchase, Pack } from '../types';
import { COUNTRIES } from '../lib/countries';
import { 
  loginUser, getAdminUsers, addAdminUserGems, toggleBanUser, 
  getAdminReports, updateReportStatus, getAdminSettings, saveAdminSettings,
  uploadAdminFile, getHistory, getCurrentUser, deleteAdminUser, updateAdminUser,
  getAdminMailbox, deleteMailboxMessage, getAdminDemoUsers, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser,
  getAdminGifts, addAdminGift, updateAdminGift, deleteAdminGift, getAdminPurchases,
  getAdminPacks, addAdminPack, updateAdminPack, deleteAdminPack, authStorage,
  getAdminVipPlans, addAdminVipPlan, updateAdminVipPlan, deleteAdminVipPlan, apiFetch
} from '../lib/auth';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { HistoryItem, VipPlan } from '../types';
import { AdminProfileView } from '../components/AdminProfileView';

export const AdminDashboard: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string>('');
  
  // Login State
  const [usernameInput, setUsernameInput] = useState<string>('demo');
  const [passwordInput, setPasswordInput] = useState<string>('demo123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = pathParts[1] || 'overview';
  const settingsSubTab = activeTab === 'settings' ? (pathParts[2] || 'general') : 'general';

  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<ModerationReport[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [mailboxList, setMailboxList] = useState<any[]>([]);
  const [demoUsersList, setDemoUsersList] = useState<User[]>([]);
  const [giftsList, setGiftsList] = useState<Gift[]>([]);
  const [purchasesList, setPurchasesList] = useState<Purchase[]>([]);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [editGiftData, setEditGiftData] = useState<Partial<Gift> & { file?: File | null }>({});

  const [packsList, setPacksList] = useState<Pack[]>([]);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [editPackData, setEditPackData] = useState<Partial<Pack>>({});

  const [vipPlansList, setVipPlansList] = useState<VipPlan[]>([]);
  const [isVipPlanModalOpen, setIsVipPlanModalOpen] = useState(false);
  const [editVipPlanData, setEditVipPlanData] = useState<Partial<VipPlan>>({});
  const [monetizationTab, setMonetizationTab] = useState<'packs' | 'vip'>('packs');

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update document title dynamically
  useEffect(() => {
    let tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    if (activeTab === 'seo') tabName = 'SEO & Metadata';
    document.title = `${tabName} - ${settings?.siteName || 'AdminPanel'}`;
  }, [activeTab, settings?.siteName]);

  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [selectedUserGemsModal, setSelectedUserGemsModal] = useState<User | null>(null);
  const [gemsToAddInput, setGemsToAddInput] = useState<number>(100);

  const [selectedEditUserModal, setSelectedEditUserModal] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<Partial<User>>({});

  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  // Check login status on mount
  useEffect(() => {
    checkHealthAndSettings();
    restoreSession();
  }, []);

  const restoreSession = async () => {
    const user = await getCurrentUser();
    if (user && (user.role === 'admin' || user.username === 'demo')) {
      setIsAdminAuthenticated(true);
      loadAdminData();
    }
  };

  const checkHealthAndSettings = async () => {
    try {
      const hRes = await fetch('/api/health');
      const hData = await hRes.json();
      setServerHealth(hData);

      const sData = await getAdminSettings();
      setSettings(sData);
    } catch (err) {
      console.error(err);
        toast.error(err.message || 'Error saving settings');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const data = await loginUser(usernameInput, passwordInput);
      if (data.user && (data.user.role === 'admin' || data.user.username === 'demo')) {
        setIsAdminAuthenticated(true);
        setAdminToken(data.token);
        loadAdminData();
      } else {
        setLoginError('Access Denied: Demo account must be used for admin access');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const users = await getAdminUsers();
      setUsersList(users);

      const reps = await getAdminReports();
      setReportsList(reps);

      const st = await getAdminSettings();
      setSettings(st);

      const hist = await getHistory();
      setHistoryList(hist);

      const mail = await getAdminMailbox();
      if (mail && mail.messages) setMailboxList(mail.messages);

      const demos = await getAdminDemoUsers();
      if (demos && demos.users) setDemoUsersList(demos.users);

      const gifts = await getAdminGifts();
      if (gifts && gifts.gifts) setGiftsList(gifts.gifts);

      const purchases = await getAdminPurchases();
      if (purchases && Array.isArray(purchases)) setPurchasesList(purchases);

      const packs = await getAdminPacks();
      if (packs && Array.isArray(packs)) setPacksList(packs);

      const vipPlans = await getAdminVipPlans();
      if (vipPlans && Array.isArray(vipPlans)) setVipPlansList(vipPlans);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logo' | 'favicon') => {
    if (!e.target.files || e.target.files.length === 0 || !settings) return;
    setIsUploadingFile(true);
    try {
      const file = e.target.files[0];
      const res = await uploadAdminFile(file, fieldName);
      setSettings(prev => ({ ...prev, [fieldName + 'Url']: res.url }));
      toast.success(`${fieldName} uploaded successfully!`);
    } catch (e) {
      toast.error(`Upload failed`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const [testingStorage, setTestingStorage] = useState<string | null>(null);
  const handleTestStorage = async (provider: string) => {
    setTestingStorage(provider);
    try {
      const res = await apiFetch('/api/admin/settings/test-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config: settings })
      });
      if (res.success) {
        toast.success(`Connection to ${provider} successful!`);
      } else {
        toast.error(`Connection failed: ${res.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error connecting to storage provider.'); console.error('TEST STORAGE ERROR:', err);
    } finally {
      setTestingStorage(null);
    }
  };

  const handleAddGems = async () => {
    if (!selectedUserGemsModal) return;
    try {
      await addAdminUserGems(selectedUserGemsModal.id, gemsToAddInput);
      setSelectedUserGemsModal(null);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBan = async (userId: string) => {
    try {
      await toggleBanUser(userId);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed', reportedUserId?: string) => {
    try {
      await updateReportStatus(reportId, status);
      if (status === 'resolved' && reportedUserId) {
        const user = usersList.find(u => u.id === reportedUserId);
        if (user && !user.isBanned) {
          await toggleBanUser(reportedUserId);
          toast.success('User has been banned.');
        }
      }
      toast.success('Report updated successfully');
      loadAdminData(); // Refresh both reports and users
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  const confirmDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const isDemo = demoUsersList.some(u => u.id === userToDelete);
      if (isDemo) {
        await deleteAdminDemoUser(userToDelete);
        setDemoUsersList(demoUsersList.filter(u => u.id !== userToDelete));
      } else {
        await deleteAdminUser(userToDelete);
        setUsersList(usersList.filter(u => u.id !== userToDelete));
      }
      toast.success('User deleted successfully');
    } catch (e) {
      toast.error('Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedEditUserModal(user);
    if (user && user.id !== 'new') {
      setEditUserData(user);
    } else {
      setEditUserData({ id: 'new', name: '', email: '', avatar: '/images/avatars/female-1.svg', isDemo: true, role: 'user', username: '', country: '', countryCode: '', age: 18, gems: 0, isOnline: true, createdAt: '', gender: 'female' });
    }
  };
  const handleDeleteGift = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gift?')) return;
    try {
      await deleteAdminGift(id);
      setGiftsList(prev => prev.filter(g => g.id !== id));
      toast.success('Gift deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete gift');
    }
  };

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (editGiftData.name) formData.append('name', editGiftData.name);
      if (editGiftData.price !== undefined) formData.append('price', editGiftData.price.toString());
      if (editGiftData.file) formData.append('giftImage', editGiftData.file);

      if (editGiftData.id === 'new') {
        const res = await addAdminGift(formData);
        if (res.gift) setGiftsList(prev => [res.gift, ...prev]);
        toast.success('Gift created');
      } else if (editGiftData.id) {
        const res = await updateAdminGift(editGiftData.id, formData);
        if (res.gift) setGiftsList(prev => prev.map(g => g.id === res.gift.id ? res.gift : g));
        toast.success('Gift updated');
      }
      setIsGiftModalOpen(false);
      setEditGiftData({});
    } catch (err: any) {
      toast.error(err.message || 'Failed to save gift');
    }
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editPackData.id === 'new') {
        const res = await addAdminPack(editPackData);
        if (res.pack) setPacksList(prev => [...prev, res.pack].sort((a, b) => a.price - b.price));
        toast.success('Pack created');
      } else if (editPackData.id) {
        const res = await updateAdminPack(editPackData.id, editPackData);
        if (res.pack) setPacksList(prev => prev.map(p => p.id === res.pack.id ? res.pack : p).sort((a, b) => a.price - b.price));
        toast.success('Pack updated');
      }
      setIsPackModalOpen(false);
      setEditPackData({});
    } catch (err: any) {
      toast.error(err.message || 'Failed to save pack');
    }
  };

  const handleDeletePack = async (id: string) => {
    if (!window.confirm('Delete this pack?')) return;
    try {
      await deleteAdminPack(id);
      setPacksList(prev => prev.filter(p => p.id !== id));
      toast.success('Pack deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete pack');
    }
  };

  const handleSaveVipPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editVipPlanData.id === 'new') {
        const res = await addAdminVipPlan(editVipPlanData);
        if (res.plan) setVipPlansList(prev => [...prev, res.plan].sort((a, b) => a.priceGems - b.priceGems));
        toast.success('VIP Plan created');
      } else if (editVipPlanData.id) {
        const res = await updateAdminVipPlan(editVipPlanData.id, editVipPlanData);
        if (res.plan) setVipPlansList(prev => prev.map(p => p.id === res.plan.id ? res.plan : p).sort((a, b) => a.priceGems - b.priceGems));
        toast.success('VIP Plan updated');
      }
      setIsVipPlanModalOpen(false);
      setEditVipPlanData({});
    } catch (err: any) {
      toast.error(err.message || 'Failed to save VIP plan');
    }
  };

  const handleDeleteVipPlan = async (id: string) => {
    if (!window.confirm('Delete this VIP plan?')) return;
    try {
      await deleteAdminVipPlan(id);
      setVipPlansList(prev => prev.filter(p => p.id !== id));
      toast.success('VIP Plan deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete VIP plan');
    }
  };

  const handleEditUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUserModal) return;
    try {
      if (selectedEditUserModal.isDemo) {
        if (selectedEditUserModal.id === 'new') {
          const res = await addAdminDemoUser(editUserData);
          if (res.user) setDemoUsersList([res.user, ...demoUsersList]);
          toast.success('Demo User created successfully');
        } else {
          await updateAdminDemoUser(selectedEditUserModal.id, editUserData);
          setDemoUsersList(demoUsersList.map(u => u.id === selectedEditUserModal.id ? { ...u, ...editUserData } : u));
          toast.success('Demo User updated successfully');
        }
      } else {
        await updateAdminUser(selectedEditUserModal.id, editUserData);
        setUsersList(usersList.map(u => u.id === selectedEditUserModal.id ? { ...u, ...editUserData } : u));
        toast.success('User updated successfully');
      }
      setSelectedEditUserModal(null);
    } catch (e) {
      toast.error('Failed to update user');
    }
  };

  const handleEditUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingFile(true);
    try {
      const file = e.target.files[0];
      const res = await uploadAdminFile(file, 'avatar');
      setEditUserData({ ...editUserData, avatar: res.url });
      toast.success('Avatar uploaded successfully!');
    } catch (e) {
      toast.error(`Avatar upload failed`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await saveAdminSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address for testing.');
      return;
    }
    setTestEmailStatus('sending');
    try {
      const res = await apiFetch('/api/admin/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      if (res.success) {
        setTestEmailStatus('success');
        alert('Test email sent successfully! Please check your inbox.');
      }
    } catch (err: any) {
      setTestEmailStatus('error');
      alert('Error sending test email: ' + err.message);
    } finally {
      setTimeout(() => setTestEmailStatus('idle'), 5000);
    }
  };

  // ADMIN LOGIN SCREEN
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 text-white">
        <div className="bg-[#181a20] border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            {settings?.logoUrl && settings.logoUrl !== '?' ? (
              <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 mx-auto object-contain drop-shadow-[0_0_15px_rgba(0,230,118,0.3)] mb-4" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00E676] to-emerald-600 flex items-center justify-center text-3xl font-black text-black mx-auto shadow-xl mb-4">
                ⚡
              </div>
            )}
            <h1 className="text-2xl font-black tracking-tight text-white">VibeMatch Admin</h1>
            <p className="text-xs text-gray-400">Enterprise Control Dashboard Authorization</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold text-center">
              {loginError}
            </div>
          )}

          {settings?.demoMode && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-300 space-y-1">
              <span className="font-bold block">🔐 Default Admin Credentials:</span>
              <div className="flex justify-between text-gray-300 mt-2">
                <span>Username: <strong className="text-white">demo</strong></span>
                <span>Password: <strong className="text-white">demo123</strong></span>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Admin Username
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              Back to Main Web App
            </button>
          </form>
        </div>
      </div>
    );
  }

  const adminState = { serverHealth, usersList, demoUsersList, purchasesList, searchUserQuery, setSearchUserQuery, handleToggleBan, setSelectedUserGemsModal, selectedEditUserModal, setSelectedEditUserModal, userToDelete, setUserToDelete, handleDeleteUser, editUserData, setEditUserData, isCountryDropdownOpen, setIsCountryDropdownOpen, countryDropdownRef, handleEditUserSave, reportsList, mailboxList, isGiftModalOpen, setIsGiftModalOpen, editGiftData, setEditGiftData, handleSaveGift, handleDeleteGift, giftsList, monetizationTab, setMonetizationTab, packsList, isPackModalOpen, setIsPackModalOpen, editPackData, setEditPackData, handleSavePack, handleDeletePack, vipPlansList, isVipPlanModalOpen, setIsVipPlanModalOpen, editVipPlanData, setEditVipPlanData, handleSaveVipPlan, handleDeleteVipPlan, settingsSubTab, settings, setSettings, handleSaveSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, navigate, setUsersList, setReportsList, setDemoUsersList, setGiftsList, setPacksList, setVipPlansList, setPurchasesList, setMailboxList, handleReportAction, deleteMailboxMessage, addAdminDemoUser, updateAdminDemoUser, deleteAdminDemoUser, handleEditUserAvatarUpload, handleOpenEditModal, handleAdminLogin, loadAdminData, checkHealthAndSettings, restoreSession };

  // LOGGED-IN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col md:flex-row font-sans">
      {/* Admin Sidebar */}
      
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#121418] border-b border-gray-800">
         <div className="flex items-center space-x-3">
              {settings?.logoUrl && settings.logoUrl !== '?' ? (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,230,118,0.3)] bg-[#1a1c23]" />
              ) : (
                <img src="/images/logo.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,230,118,0.3)] bg-[#1a1c23]" />
              )}
              <div>
                <h2 className="font-black text-base text-white">{settings?.siteName || 'VibeMatch'}</h2>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">ENTERPRISE ADMIN V1.0.1</span>
              </div>
         </div>
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
         </button>
      </div>

      <aside className={`w-64 bg-[#121418] border-r border-gray-800 flex-col justify-between p-4 flex-shrink-0 fixed md:relative z-40 h-screen transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div>
          {/* Admin Logo */}
          <div className="flex items-center space-x-3 px-2 py-4 mb-6 border-b border-gray-800">
            {settings?.logoUrl && settings.logoUrl !== '?' ? (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,230,118,0.3)] bg-[#1a1c23]" />
            ) : (
              <img src="/images/logo.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(0,230,118,0.3)] bg-[#1a1c23]" />
            )}
            <div>
              <h2 className="font-black text-base text-white">{settings?.siteName || 'VibeMatch'}</h2>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">ENTERPRISE ADMIN V1.0.1</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: UsersIcon },
              { id: 'demo-users', label: 'Demo Users', icon: Smartphone },
              { id: 'gifts', label: 'Gifts System', icon: GiftIcon },
              { id: 'purchases', label: 'Packs History', icon: ShoppingBag },{ id: 'withdrawals', label: 'Withdrawals', icon: CreditCard },
              { id: 'reports', label: 'Reports', icon: Shield },
              { id: 'mailbox', label: 'Mailbox', icon: Mail },
              { id: 'monetization', label: 'Monetization', icon: DollarSign },
              { id: 'pages', label: 'Pages', icon: FileText },
                { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/admin/${item.id}${item.id === 'settings' ? '/general' : ''}`)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin User Info Footer */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-between px-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold flex items-center justify-center text-xs">
              A
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">Admin User</h4>
              <span className="text-[10px] text-gray-500">superadmin</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate('/admin/profile')}
              className={`p-2 rounded-xl transition-colors ${activeTab === 'profile' ? 'text-[#00E676] bg-[#00E676]/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              title="Admin Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                authStorage.removeToken();
                setIsAdminAuthenticated(false);
              }}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      
</aside>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 bg-[#0d0e12] p-4 md:p-8 overflow-y-auto h-[calc(100vh-73px)] md:h-screen w-full">

        {activeTab === 'profile' && (
          <AdminProfileView adminToken={adminToken} />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && <OverviewTab {...adminState} />}

        {/* USERS MANAGEMENT TAB */}
        {activeTab === 'users' && <UsersTab {...adminState} />}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && <ReportsTab {...adminState} />}

        {/* MAILBOX TAB */}
        {activeTab === 'mailbox' && <MailboxTab {...adminState} />}

        {/* DEMO USERS TAB */}
        {activeTab === 'demo-users' && <DemoUsersTab {...adminState} />}

        {/* Gems Modal */}
        {selectedUserGemsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181a20] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-black text-white mb-2">Add Gems to {selectedUserGemsModal.name}</h3>
              <p className="text-xs text-gray-400 mb-6">Current Balance: {selectedUserGemsModal.gems}</p>
              <input
                type="number"
                value={gemsToAddInput}
                onChange={(e) => setGemsToAddInput(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedUserGemsModal(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGems}
                  className="flex-1 bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold py-2.5 rounded-xl transition-colors"
                >
                  Confirm Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-[#181a20] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Delete User?</h3>
              <p className="text-sm text-gray-400 mb-6">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-2.5 rounded-xl transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {selectedEditUserModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-[#181a20] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white">{selectedEditUserModal.id === 'new' ? 'Add Demo User' : 'Edit User Profile'}</h3>
                <button onClick={() => setSelectedEditUserModal(null)} className="text-gray-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditUserSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    value={editUserData.name || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                    required
                  />
                </div>
                {!selectedEditUserModal.isDemo && (
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={editUserData.email || ''}
                      onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                      required
                    />
                  </div>
                )}
                
                {selectedEditUserModal.isDemo && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Gender</label>
                        <select
                          value={editUserData.gender || 'female'}
                          onChange={(e) => setEditUserData({ ...editUserData, gender: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Age</label>
                        <input
                          type="number"
                          value={editUserData.age || 18}
                          onChange={(e) => setEditUserData({ ...editUserData, age: Number(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Likes</label>
                        <input
                          type="number"
                          value={editUserData.likesCount || 0}
                          onChange={(e) => setEditUserData({ ...editUserData, likesCount: Number(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Country</label>
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-3 py-2 flex items-center justify-between focus:outline-none focus:border-[#00E676] transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            {!editUserData.country || editUserData.country === 'All Countries' ? (
                              <span>All Countries</span>
                            ) : (
                              <>
                                <img 
                                  src={`https://flagcdn.com/w20/${(editUserData.countryCode || 'US').toLowerCase()}.png`} 
                                  alt="flag" 
                                  className="w-5 h-auto rounded-sm"
                                />
                                <span>{editUserData.country}</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {isCountryDropdownOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            <button
                              type="button"
                              onClick={() => {
                                setEditUserData({ ...editUserData, country: 'All Countries', countryCode: '' });
                                setIsCountryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 hover:bg-gray-800 transition-colors ${(!editUserData.country || editUserData.country === 'All Countries') ? 'bg-gray-800 text-[#00E676] font-bold' : 'text-gray-200'}`}
                            >
                              <span>All Countries</span>
                            </button>
                            {COUNTRIES.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setEditUserData({ ...editUserData, country: c.name, countryCode: c.code });
                                  setIsCountryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 hover:bg-gray-800 transition-colors ${editUserData.country === c.name ? 'bg-gray-800 text-[#00E676] font-bold' : 'text-gray-200'}`}
                              >
                                <img 
                                  src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                                  alt={c.code} 
                                  className="w-5 h-auto rounded-sm"
                                />
                                <span>{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Video Link (MP4/M3U8)</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={editUserData.videoUrl || ''}
                          placeholder="https://..."
                          onChange={(e) => setEditUserData({ ...editUserData, videoUrl: e.target.value })}
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                        />
                        <label className="flex-none bg-gray-800 hover:bg-gray-700 cursor-pointer text-[#00E676] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center border border-[#00E676]/20 transition-colors">
                          Upload File
                          <input 
                            type="file" 
                            accept="video/*"
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              toast.info('Uploading video...');
                              try {
                                const res = await uploadAdminFile(file, 'video' as any);
                                if (res.url) {
                                  setEditUserData({ ...editUserData, videoUrl: res.url });
                                  toast.success('Video uploaded successfully!');
                                }
                              } catch (err) {
                                console.error('Video upload failed', err);
                                toast.error('Video upload failed');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="text-xs font-bold text-gray-300 uppercase">Status</label>
                      <button
                        type="button"
                        onClick={() => setEditUserData({ ...editUserData, isOnline: !editUserData.isOnline })}
                        className={`px-3 py-1 text-xs rounded-full font-bold transition-colors ${
                          editUserData.isOnline ? 'bg-[#00E676] text-black' : 'bg-gray-700 text-white'
                        }`}
                      >
                        {editUserData.isOnline ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Avatar</label>
                  <div className="flex items-center space-x-3 mb-2">
                    <img src={editUserData.avatar || '/images/avatars/female-1.svg'} alt="Avatar Preview" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditUserAvatarUpload}
                      className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#00E676]/20 file:text-[#00E676] hover:file:bg-[#00E676]/30"
                    />
                  </div>
                </div>

                {!selectedEditUserModal.isDemo && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Phone</label>
                      <input
                        type="text"
                        value={editUserData.phone || ''}
                        onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Address</label>
                      <input
                        type="text"
                        value={editUserData.address || ''}
                        onChange={(e) => setEditUserData({ ...editUserData, address: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E676]"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold py-3 rounded-xl transition-colors mt-4"
                >
                  Save User
                </button>
              </form>
            </div>
          </div>
        )}

        {/* GIFTS TAB */}
        {activeTab === 'gifts' && <GiftsTab {...adminState} />}

        {/* SETTINGS TAB WITH FIREBASE & AUTH CONFIG */}
        {activeTab === 'settings' && settings && <SettingsTab {...adminState} />}
        {activeTab === 'pages' && <PagesTab />}

        {/* PURCHASES TAB */}
        {activeTab === 'purchases' && <PurchasesTab {...adminState} />}

        {/* MONETIZATION TAB */}
        {activeTab === 'monetization' && <MonetizationTab {...adminState} />}
        
        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && <WithdrawalsTab {...adminState} />}
        {/* END TABS */}
      </main>

      {/* PACK MODAL */}
      {isPackModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-gray-800 rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">{editPackData.id === 'new' ? 'Add Pack' : 'Edit Pack'}</h3>
              <button onClick={() => setIsPackModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePack} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Pack Name</label>
                <input
                  type="text"
                  required
                  value={editPackData.name || ''}
                  onChange={(e) => setEditPackData({ ...editPackData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={editPackData.description || ''}
                  onChange={(e) => setEditPackData({ ...editPackData, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPackData.price || ''}
                    onChange={(e) => setEditPackData({ ...editPackData, price: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Gems Amount</label>
                  <input
                    type="number"
                    required
                    value={editPackData.gems || ''}
                    onChange={(e) => setEditPackData({ ...editPackData, gems: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Google Pay Product ID</label>
                <input
                  type="text"
                  value={editPackData.googlePayId || ''}
                  onChange={(e) => setEditPackData({ ...editPackData, googlePayId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                  placeholder="e.g. pack_100_gems"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Apple Pay Product ID</label>
                <input
                  type="text"
                  value={editPackData.applePayId || ''}
                  onChange={(e) => setEditPackData({ ...editPackData, applePayId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                  placeholder="e.g. pack_100_gems"
                />
              </div>
              <div className="flex items-center space-x-3 mt-4">
                <input
                  type="checkbox"
                  id="popular-toggle"
                  checked={editPackData.popular || false}
                  onChange={(e) => setEditPackData({ ...editPackData, popular: e.target.checked })}
                  className="w-5 h-5 accent-[#00E676] rounded"
                />
                <label htmlFor="popular-toggle" className="text-sm font-bold text-white">Mark as Popular</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-bold py-3 rounded-xl transition-all"
              >
                Save Pack
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIP PLAN MODAL */}
      {isVipPlanModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-gray-800 rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">{editVipPlanData.id === 'new' ? 'Add VIP Plan' : 'Edit VIP Plan'}</h3>
              <button onClick={() => setIsVipPlanModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVipPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editVipPlanData.name || ''}
                  onChange={(e) => setEditVipPlanData({ ...editVipPlanData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 1 Month VIP"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={editVipPlanData.description || ''}
                  onChange={(e) => setEditVipPlanData({ ...editVipPlanData, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Access to exclusive filters"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={editVipPlanData.durationDays || ''}
                    onChange={(e) => setEditVipPlanData({ ...editVipPlanData, durationDays: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Price (Gems)</label>
                  <input
                    type="number"
                    required
                    value={editVipPlanData.priceGems || ''}
                    onChange={(e) => setEditVipPlanData({ ...editVipPlanData, priceGems: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4">
                <input
                  type="checkbox"
                  id="vip-popular-toggle"
                  checked={editVipPlanData.popular || false}
                  onChange={(e) => setEditVipPlanData({ ...editVipPlanData, popular: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded"
                />
                <label htmlFor="vip-popular-toggle" className="text-sm font-bold text-white">Mark as Popular</label>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-all"
              >
                Save VIP Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GIFT MODAL */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-gray-800 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">{editGiftData.id === 'new' ? 'Add Gift' : 'Edit Gift'}</h3>
              <button onClick={() => setIsGiftModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Gift Name</label>
                <input
                  type="text"
                  required
                  value={editGiftData.name || ''}
                  onChange={e => setEditGiftData({...editGiftData, name: e.target.value})}
                  className="w-full bg-[#181a20] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] transition-colors"
                  placeholder="e.g. Diamond Ring"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Price (Gems)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editGiftData.price || 0}
                  onChange={e => setEditGiftData({...editGiftData, price: Number(e.target.value)})}
                  className="w-full bg-[#181a20] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Gift Image</label>
                {editGiftData.imagePath && !editGiftData.file && (
                  <div className="mb-2">
                    <img src={editGiftData.imagePath} alt="Current" className="w-16 h-16 object-contain bg-gray-900 rounded-lg p-2" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditGiftData({...editGiftData, file: e.target.files?.[0] || null})}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#00E676]/10 file:text-[#00E676] hover:file:bg-[#00E676]/20 transition-all cursor-pointer"
                  required={editGiftData.id === 'new'}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold py-3 rounded-xl transition-colors mt-2"
              >
                Save Gift
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Gems Modal */}
      {selectedUserGemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#181a20] border border-gray-700 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-extrabold text-base text-white">Add Gems to {selectedUserGemsModal.name}</h3>
            <input
              type="number"
              value={gemsToAddInput}
              onChange={(e) => setGemsToAddInput(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddGems}
                className="flex-1 bg-[#00E676] text-black font-extrabold text-xs py-2.5 rounded-xl"
              >
                Confirm Add
              </button>
              <button
                onClick={() => setSelectedUserGemsModal(null)}
                className="flex-1 bg-gray-800 text-gray-300 font-bold text-xs py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
