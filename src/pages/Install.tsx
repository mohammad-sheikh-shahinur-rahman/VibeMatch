import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Database, Layout, UserPlus, CheckCircle, ChevronRight, Server, Key, Lock, Mail, User, Globe } from 'lucide-react';

export const InstallWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [purchaseCode, setPurchaseCode] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [dbName, setDbName] = useState('Loading...');
  const [dbTested, setDbTested] = useState(false);

  useEffect(() => {
    fetch('/api/install/status')
      .then(res => res.json())
      .then(data => {
        if (data.dbName) setDbName(data.dbName);
        else setDbName('Not Found in .env');
      })
      .catch(() => setDbName('Error reading .env'));
  }, []);
  
  const [siteName, setSiteName] = useState('VibeMatch');
  const [siteUrl, setSiteUrl] = useState(window.location.origin);
  
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleVerifyLicense = async () => {
    if (!purchaseCode) return toast.error('Please enter your purchase code.');
    setLoading(true);
    try {
      const res = await fetch('/api/install/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseCode, domain: window.location.hostname })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'License verified successfully!');
        setLicenseKey(data.licenseKey || purchaseCode);
        setStep(2);
      } else {
        toast.error(data.error || 'Failed to verify license.');
      }
    } catch (err) {
      toast.error('Network error during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/install/test-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setDbTested(true);
        toast.success(data.message || 'Database connected successfully!');
      } else {
        toast.error(data.error || 'Failed to connect to database');
      }
    } catch (err) {
      toast.error('Network error during connection test.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!adminUsername || !adminEmail || !adminPassword || !confirmPassword) {
      return toast.error('Please fill in all admin fields.');
    }
    if (adminPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/install/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          siteUrl,
          licenseKey,
          purchaseCode,
          adminUsername,
          adminEmail,
          adminPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Installation complete! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to finalize installation.');
      }
    } catch (err) {
      toast.error('Network error during finalization.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Activation', icon: <Shield className="w-5 h-5" /> },
    { num: 2, title: 'Database', icon: <Database className="w-5 h-5" /> },
    { num: 3, title: 'Site Info', icon: <Layout className="w-5 h-5" /> },
    { num: 4, title: 'Admin Account', icon: <UserPlus className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex flex-col font-sans selection:bg-[#00E676] selection:text-black">
      {/* Header */}
      <div className="w-full h-20 border-b border-white/5 bg-[#121418] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00E676] flex items-center justify-center shadow-[0_0_15px_rgba(0,230,118,0.3)]">
            <Server className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">VibeMatch Installer</h1>
        </div>
        <div className="text-gray-400 text-sm font-medium">Version 1.0</div>
      </div>

      <div className="flex-1 flex w-full max-w-6xl mx-auto py-12 px-6 gap-12">
        {/* Sidebar Steps */}
        <div className="w-64 shrink-0 hidden md:flex flex-col gap-8">
          {steps.map((s, idx) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="relative flex items-start gap-4">
                {/* Connecting Line */}
                {idx !== steps.length - 1 && (
                  <div className={`absolute left-5 top-10 bottom-[-2rem] w-0.5 ${isCompleted ? 'bg-[#00E676]' : 'bg-gray-800'}`} />
                )}
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                  isCompleted ? 'bg-[#00E676] text-black' :
                  isActive ? 'bg-[#00E676]/20 text-[#00E676] ring-2 ring-[#00E676]' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : s.icon}
                </div>
                <div className="pt-2">
                  <div className={`font-bold ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`}>Step {s.num}</div>
                  <div className={`text-sm ${isActive ? 'text-[#00E676]' : 'text-gray-500'}`}>{s.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#121418] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E676]/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Step 1: Activation */}
          {step === 1 && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h2 className="text-3xl font-black mb-2">Activate License</h2>
              <p className="text-gray-400 mb-8">Enter your Envato purchase code to verify your license.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Purchase Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={purchaseCode}
                      onChange={(e) => setPurchaseCode(e.target.value)}
                      placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleVerifyLicense}
                  disabled={loading || !purchaseCode}
                  className="w-full py-4 bg-[#00E676] hover:bg-[#00c853] text-black font-black text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.2)]"
                >
                  {loading ? 'Verifying...' : 'Verify License'}
                  {!loading && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Database */}
          {step === 2 && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h2 className="text-3xl font-black mb-2">Database Setup</h2>
              <p className="text-gray-400 mb-8">We will use the MongoDB connection provided in your <code className="bg-gray-800 px-1 rounded">.env</code> file.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Configured Database Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Database className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={dbName}
                      readOnly
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleTestDatabase}
                    disabled={loading || dbName === 'Not Found in .env' || dbName === 'Error reading .env' || dbName === 'Loading...'}
                    className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </button>

                  {dbTested && (
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 py-4 bg-[#00E676] hover:bg-[#00c853] text-black font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.2)] animate-[fadeIn_0.3s_ease-out]"
                    >
                      Next Step
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Site Config */}
          {step === 3 && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h2 className="text-3xl font-black mb-2">Site Configuration</h2>
              <p className="text-gray-400 mb-8">Set up your website's basic information.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Website Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Layout className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Site URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="py-4 px-8 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!siteName || !siteUrl}
                    className="flex-1 py-4 bg-[#00E676] hover:bg-[#00c853] text-black font-black rounded-xl transition-all flex justify-center items-center gap-2"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Admin Account */}
          {step === 4 && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <h2 className="text-3xl font-black mb-2">Admin Account</h2>
              <p className="text-gray-400 mb-8">Create the master administrator account for your platform.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-[#00E676]"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-[#00E676]"
                    />
                    <button 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setStep(3)}
                    className="py-4 px-8 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={loading}
                    className="flex-1 py-4 bg-[#00E676] hover:bg-[#00c853] text-black font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.3)]"
                  >
                    {loading ? 'Installing...' : 'Complete Installation'}
                    {!loading && <CheckCircle className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
