import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminProfileView: React.FC<{adminToken: string}> = ({ adminToken }) => {
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    email: '',
  });
  
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      
      const res = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      if (data.username) {
        setProfile({
          name: data.name || '',
          username: data.username || '',
          email: data.email || ''
        });
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.oldPassword) {
      return toast.error('You must enter your old password to save changes');
    }
    
    setLoading(true);
    try {
      
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...profile,
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword || undefined,
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Profile updated successfully');
        setPasswords({ oldPassword: '', newPassword: '' });
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Network error during profile update');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-gray-400 p-8 text-center animate-pulse">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Admin Profile Settings</h1>
      </div>

      <div className="bg-[#111216] border border-white/5 rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Display Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Security</h3>
            
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">New Password (leave blank to keep current)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] transition-all"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#00E676] mb-2">Current Password (required to save changes)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#00E676]" />
                </div>
                <input
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                  className="w-full bg-[#0a0b0e] border border-[#00E676]/30 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676] transition-all"
                  placeholder="Enter current password to authorize changes"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !passwords.oldPassword}
              className="px-8 py-3 bg-[#00E676] hover:bg-[#00c853] text-black font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
              {!loading && <Save className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
