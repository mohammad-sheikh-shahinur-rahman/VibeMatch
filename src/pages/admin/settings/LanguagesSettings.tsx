import toast from 'react-hot-toast';
import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const LanguagesSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage, activeLanguages, setActiveLanguages }: any) => {
  const [editingLang, setEditingLang] = React.useState<any>(null);
  const [translations, setTranslations] = React.useState<any>({});
  
  const defaultKeywords = [
    "Home", "Video Chat", "History", "Messages", "Sign In", "Sign Out", "Online", 
    "Gender", "Region", "Start Video Chat", "Settings", "Profile", "Edit Profile", 
    "Save Changes", "Cancel", "Male", "Female", "Both", "Global", "Search",
    "No users found", "Connecting", "Next", "Skip", "Report", "Block", "Add Friend"
  ];

  return (
    <>
    <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-black text-white mb-4">Supported Languages</h3>
                    <p className="text-xs text-gray-400 mb-6">Manage the languages available for users to select.</p>
                    
                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm mb-6">
                      <h4 className="text-sm font-bold text-white mb-4">Add Language</h4>
                      <div className="flex space-x-4 items-end">
                        <div className="flex-1">
                          <select
                            id="add-language-select"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          >
                            <option value="">Select a language...</option>
                            {[
                              { code: 'en', name: 'English', flag: 'us.svg' },
                              { code: 'es', name: 'Spanish', flag: 'es.svg' },
                              { code: 'fr', name: 'French', flag: 'fr.svg' },
                              { code: 'de', name: 'German', flag: 'de.svg' },
                              { code: 'it', name: 'Italian', flag: 'it.svg' },
                              { code: 'pt', name: 'Portuguese', flag: 'pt.svg' },
                              { code: 'ru', name: 'Russian', flag: 'ru.svg' },
                              { code: 'zh', name: 'Chinese', flag: 'cn.svg' },
                              { code: 'ja', name: 'Japanese', flag: 'jp.svg' },
                              { code: 'ko', name: 'Korean', flag: 'kr.svg' },
                              { code: 'ar', name: 'Arabic', flag: 'sa.svg' },
                              { code: 'hi', name: 'Hindi', flag: 'in.svg' },
                              { code: 'tr', name: 'Turkish', flag: 'tr.svg' },
                              { code: 'nl', name: 'Dutch', flag: 'nl.svg' },
                              { code: 'pl', name: 'Polish', flag: 'pl.svg' },
                              { code: 'sv', name: 'Swedish', flag: 'se.svg' },
                              { code: 'id', name: 'Indonesian', flag: 'id.svg' },
                            ]
                                                        .filter(lang => !activeLanguages.some((l: any) => l.code === lang.code))
                            .map(lang => (
                              <option key={lang.code} value={JSON.stringify(lang)}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={async () => {
                            const select = document.getElementById('add-language-select') as HTMLSelectElement;
                            if (select.value) {
                              const lang = JSON.parse(select.value);
                              lang.rtl = ['ar', 'he', 'fa', 'ur'].includes(lang.code);
                              const res = await fetch('/api/admin/languages', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token')) },
                                body: JSON.stringify(lang)
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setActiveLanguages(data.languages);
                                select.value = "";
                              }
                            }
                          }}
                          className="px-6 py-3 bg-[#00E676] text-black font-bold rounded-xl text-sm hover:bg-[#00C853] transition"
                        >
                          <Plus className="w-5 h-5 inline-block mr-1" /> Add
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white mb-4">Active Languages</h4>
                      {(!activeLanguages || activeLanguages.length === 0) ? (
                        <p className="text-xs text-gray-500">No languages added yet. Add one above.</p>
                      ) : (
                        [...activeLanguages].sort((a: any, b: any) => a.code === 'en' ? -1 : b.code === 'en' ? 1 : a.name.localeCompare(b.name)).map((lang: any, index: number) => (
                          <div key={lang.code} className="flex items-center justify-between p-4 bg-gray-900/60 rounded-2xl border border-gray-800">
                            <div className="flex items-center space-x-3">
                              <img src={`/images/flags/${lang.flag}`} alt={lang.name} className="w-6 h-6 rounded-full object-cover" />
                              <h4 className="font-extrabold text-sm text-white">{lang.name}</h4>
                              {lang.rtl && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">RTL</span>}
                              {(settings?.defaultLanguage === lang.code || (!settings?.defaultLanguage && lang.code === 'en')) && (
                                <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] px-2 py-0.5 rounded-md font-bold">Default</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {settings?.defaultLanguage !== lang.code && (lang.code !== 'en' || settings?.defaultLanguage) && (
                                <button
                                  onClick={() => setSettings({...settings, defaultLanguage: lang.code})}
                                  className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg hover:bg-gray-700 transition"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingLang(lang);
                                  const existing = lang.translations || {};
                                  const initial: any = {};
                                  defaultKeywords.forEach(k => {
                                    initial[k] = existing[k] || k;
                                  });
                                  setTranslations(initial);
                                }}
                                className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500/20 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!(settings?.defaultLanguage === lang.code || (!settings?.defaultLanguage && lang.code === 'en')) && (
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/admin/languages/${lang.code}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: 'Bearer ' + ((localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token'))) }
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setActiveLanguages(data.languages);
                                    }
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

      {editingLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181a20] rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] border border-gray-800 shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Edit2 className="w-5 h-5 mr-3 text-[#00E676]" />
                Edit Keywords ({editingLang.name})
              </h3>
              <button onClick={() => setEditingLang(null)} className="text-gray-400 hover:text-white">
                <Trash2 className="w-5 h-5 opacity-0 hidden" />
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-gray-400 mb-4">Translate these keywords into {editingLang.name}. The system will use these values across the site.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(translations).map(key => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{key}</label>
                    <input 
                      type="text" 
                      value={translations[key]} 
                      onChange={(e) => setTranslations({...translations, [key]: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-800 flex justify-end space-x-3">
              <button 
                onClick={() => setEditingLang(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/languages/${editingLang.code}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token')) },
                      body: JSON.stringify({ translations })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setActiveLanguages(data.languages);
                      setEditingLang(null);
                      toast.success('Translations updated!');
                    } else {
                      toast.error('Failed to update translations');
                    }
                  } catch (err) {
                    toast.error('Network error');
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#00E676] text-black hover:bg-[#00C853] transition flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Keywords
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
