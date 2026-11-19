import React, { useState } from 'react';
import { X, Camera, Save, Loader2, ChevronDown } from 'lucide-react';
import { User } from '../types';
import { updateProfile, uploadUserAvatar } from '../lib/auth';
import { COUNTRIES } from '../lib/countries';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (user: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    name: user?.name || '',
    bio: user?.bio || '',
    age: user?.age || 18,
    phone: user?.phone || '',
    country: user?.country || '',
    countryCode: user?.countryCode || '',
    gender: user?.gender || 'female'
  });
  
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        bio: user.bio || '',
        age: user.age || 18,
        phone: user.phone || '',
        country: user.country || '',
        countryCode: user.countryCode || '',
        gender: user.gender || 'female'
      });
      setIsCountryDropdownOpen(false);
      setSearchQuery('');
      setUsernameStatus('idle');
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
      setError('');
    }
  }, [user, isOpen]);

  // Debounced username check
  React.useEffect(() => {
    if (!isOpen || !user || formData.username === user.username || !formData.username) {
      setUsernameStatus('idle');
      return;
    }
    
    if (!/^[a-z0-9_]{3,20}$/.test(formData.username)) {
       setUsernameStatus('invalid');
       return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?username=${formData.username}`);
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch (e) {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, user?.username, isOpen, user]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
       setError('Please fix your username before saving.');
       return;
    }
    setLoading(true);
    setError('');
    
    try {
      let finalAvatar = user.avatar;
      
      if (avatarFile) {
        const uploadRes = await uploadUserAvatar(avatarFile);
        finalAvatar = uploadRes.url;
      }
      
      const res = await updateProfile({
        ...formData,
        avatar: finalAvatar
      });
      
      onUpdate(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-[#1a1d24] border border-gray-800 rounded-3xl w-full max-w-md relative z-10 p-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/50">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-white mb-6">Edit Profile</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-[#00E676]" />
              <label className="absolute bottom-0 right-0 p-2 bg-[#00E676] rounded-full text-black cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Username</label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                className={`w-full bg-gray-900 border ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus:border-red-500' : usernameStatus === 'available' ? 'border-[#00E676] focus:border-[#00E676]' : 'border-gray-700 focus:border-[#00E676]'} rounded-xl px-4 py-3 text-white focus:outline-none pr-10`} 
                required
                maxLength={20}
              />
              <div className="absolute right-3 top-3.5">
                {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                {usernameStatus === 'available' && <span className="text-[#00E676] font-bold text-lg">✓</span>}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <span className="text-red-500 font-bold text-lg">✗</span>}
              </div>
            </div>
            {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1">Username is already taken.</p>}
            {usernameStatus === 'invalid' && <p className="text-xs text-red-500 mt-1">Must be 3-20 chars: a-z, 0-9, _</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">About Me</label>
            <textarea 
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676] resize-none h-24" 
              placeholder="Tell others about yourself..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Gender</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, gender: 'male' });
                  if (!avatarFile && avatarPreview && avatarPreview.startsWith('/images/avatars/')) {
                    const num = Math.floor(Math.random() * 10) + 1;
                    setAvatarPreview(`/images/avatars/male-${num}.svg`);
                  }
                }}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${formData.gender === 'male' ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'}`}
              >
                👨 Male
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, gender: 'female' });
                  if (!avatarFile && avatarPreview && avatarPreview.startsWith('/images/avatars/')) {
                    const num = Math.floor(Math.random() * 10) + 1;
                    setAvatarPreview(`/images/avatars/female-${num}.svg`);
                  }
                }}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${formData.gender === 'female' ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50' : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'}`}
              >
                👩 Female
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]" 
                min="18"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Phone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]" 
                placeholder="+123456789"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 mb-1">Country</label>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676] flex items-center justify-between"
            >
              {formData.countryCode ? (
                <div className="flex items-center gap-2">
                  <img src={`https://flagcdn.com/w20/${formData.countryCode.toLowerCase()}.png`} alt={formData.countryCode} className="w-5 h-auto rounded-sm" />
                  <span>{formData.country}</span>
                </div>
              ) : (
                <span className="text-gray-500">Select Country</span>
              )}
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            
            {isCountryDropdownOpen && (
              <div className="absolute z-[100] mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                <div className="p-2 border-b border-gray-700">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00E676] border border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(country => (
                    <button
                      key={country.code}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setFormData({ ...formData, country: country.name, countryCode: country.code });
                        setIsCountryDropdownOpen(false);
                      }}
                    >
                      <img src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} alt={country.name} className="w-5 h-auto rounded-sm" />
                      <span>{country.name}</span>
                    </button>
                  ))}
                  {COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold py-4 rounded-xl mt-4 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Save Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
}
