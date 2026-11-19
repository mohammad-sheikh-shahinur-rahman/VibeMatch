import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, ChevronRight, Globe, Check, ChevronDown } from 'lucide-react';
import { MatchFilter } from '../types';

interface GenderFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: MatchFilter;
  onSaveFilter: (newFilter: MatchFilter) => void;
  onStartChat: () => void;
  isVip?: boolean;
}

import { COUNTRIES } from '../lib/countries';

export const GenderFilterModal: React.FC<GenderFilterModalProps> = ({
  isOpen,
  onClose,
  filter,
  onSaveFilter,
  onStartChat,
  isVip
}) => {
  const [gender, setGender] = useState<'both' | 'female' | 'male'>(filter.gender);
  const [country, setCountry] = useState<string>(filter.country || 'All Countries');
  const [superMatch, setSuperMatch] = useState<boolean>(filter.superMatch);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveFilter({ gender, country, superMatch });
    onClose();
  };

  const handleStart = () => {
    onSaveFilter({ gender, country, superMatch });
    onClose();
    onStartChat();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1e2128] border border-gray-700/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white relative">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Gender Filter</h2>
            <p className="text-xs text-gray-400 mt-1">Select preferred gender & region for video matching</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Gender Options */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Match with
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Both Option */}
              <button
                type="button"
                onClick={() => setGender('both')}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border-2 transition-all ${
                  gender === 'both'
                    ? 'border-[#00E676] bg-[#00E676]/10 text-white shadow-lg'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl">👥</div>
                <span className="text-xs font-black">Both</span>
              </button>

              {/* Female Option */}
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border-2 transition-all ${
                  gender === 'female'
                    ? 'border-[#00E676] bg-[#00E676]/10 text-white shadow-lg'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl">👩</div>
                <span className="text-xs font-black">Female</span>
              </button>

              {/* Male Option */}
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border-2 transition-all ${
                  gender === 'male'
                    ? 'border-[#00E676] bg-[#00E676]/10 text-white shadow-lg'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl">👨</div>
                <span className="text-xs font-black">Male</span>
              </button>
            </div>
          </div>

          {/* Country Selection */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-[#00E676]" />
              <span>Preferred Region</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-3.5 py-2.5 flex items-center justify-between focus:outline-none focus:border-[#00E676] transition-colors"
            >
              <div className="flex items-center space-x-2">
                {country === 'All Countries' ? (
                  <>
                    <span>🌍</span>
                    <span>All Countries</span>
                  </>
                ) : (
                  <>
                    <img 
                      src={`https://flagcdn.com/w20/${(COUNTRIES.find(c => c.name === country)?.code || 'US').toLowerCase()}.png`} 
                      alt="flag" 
                      className="w-5 h-auto rounded-sm"
                    />
                    <span>{country}</span>
                  </>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isCountryDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <button
                  type="button"
                  onClick={() => {
                    setCountry('All Countries');
                    setIsCountryDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 hover:bg-gray-700 transition-colors ${country === 'All Countries' ? 'bg-gray-700/50 text-[#00E676] font-bold' : 'text-gray-200'}`}
                >
                  <span>🌍</span>
                  <span>All Countries</span>
                </button>
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c.name);
                      setIsCountryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 hover:bg-gray-700 transition-colors ${country === c.name ? 'bg-gray-700/50 text-[#00E676] font-bold' : 'text-gray-200'}`}
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

          {/* Super Match Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-800/50 rounded-2xl border border-gray-700/50">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1">
                  <span>Super Match</span>
                  <span className="bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.2 rounded-full">HOT</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Super Match finds people you're more likely to click with.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuperMatch(!superMatch)}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                superMatch ? 'bg-[#00E676]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                  superMatch ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Exclusive Benefits Banner */}
          {!isVip && (
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-3 flex items-center justify-between text-xs font-semibold text-purple-200">
              <div className="flex items-center space-x-2">
                <span className="text-base">🌸</span>
                <span>Subscribe for exclusive benefits</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleStart}
              className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-sm py-3.5 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <span>Start Video Chat</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
