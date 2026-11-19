import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { parseFirebaseConfig } from '../../../lib/firebase';

export const AuthSettings = ({ settings, setSettings }: any) => {
  const parsed = parseFirebaseConfig(settings?.firebaseConfig);

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-black text-white mb-4">Login Methods</h3>

      <div className="space-y-3">
        {[
          { key: 'guestLogin', label: 'Guest Login', desc: 'Allow users to log in instantly as a guest without creating an account.' },
          { key: 'phoneLogin', label: 'Phone Login', desc: 'Allow users to sign in with their phone number via SMS.' },
          { key: 'googleLogin', label: 'Google Login', desc: 'Allow users to sign in with their Google accounts.' },
          { key: 'facebookLogin', label: 'Facebook Login', desc: 'Allow users to sign in with their Facebook accounts.' },
          { key: 'appleLogin', label: 'Apple Login', desc: 'Allow users to sign in with their Apple IDs.' },
          { key: 'twitterLogin', label: 'Twitter Login', desc: 'Allow users to sign in with their Twitter (X) accounts.' },
        ].map(method => (
          <div key={method.key} className="flex items-center justify-between p-4 bg-gray-900/60 rounded-2xl border border-gray-800">
            <div>
              <h4 className="font-extrabold text-xs text-white">{method.label}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">{method.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, [method.key]: !(settings as any)[method.key] })}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                (settings as any)[method.key] ? 'bg-red-500' : 'bg-gray-700'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                (settings as any)[method.key] ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Firebase Configuration Box */}
      <div className="pt-6 border-t border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Firebase Configuration</h3>
            <p className="text-xs text-gray-400">Required for Phone Login and Social Auth. Paste your Firebase web configuration.</p>
          </div>
          {parsed && (
            <button
              type="button"
              onClick={() => setSettings({ ...settings, firebaseConfig: JSON.stringify(parsed, null, 2) })}
              className="text-xs bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              Format as Clean JSON
            </button>
          )}
        </div>

        <textarea
          rows={8}
          value={settings?.firebaseConfig || ''}
          onChange={(e) => setSettings({ ...settings, firebaseConfig: e.target.value })}
          placeholder={`Paste your Firebase config here, e.g.:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "vibematch-devsnaplix"\n};`}
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#00E676]"
        />

        {settings?.firebaseConfig && (
          parsed ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Valid Firebase Config: Project <strong>{parsed.projectId}</strong> • Auth Domain <strong>{parsed.authDomain}</strong></span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-2xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Please paste a valid Firebase configuration snippet containing apiKey and projectId.</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
