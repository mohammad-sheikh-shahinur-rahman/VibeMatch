import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';

export const PaymentSettings = ({ settings, setSettings }: any) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-black text-white mb-4">Enabled Payment Methods</h3>
      <div className="grid grid-cols-2 gap-4 bg-black/40 p-5 rounded-2xl border border-white/5 mb-6">
        {[
          { id: 'stripeEnabled', label: 'Stripe' },
          { id: 'paypalEnabled', label: 'PayPal' },
          { id: 'razorpayEnabled', label: 'Razorpay' },
          { id: 'flutterwaveEnabled', label: 'Flutterwave' },
          { id: 'cashfreeEnabled', label: 'Cashfree' },
          { id: 'payuEnabled', label: 'PayU' },
          { id: 'phonepeEnabled', label: 'PhonePe' },
          { id: 'googlePayEnabled', label: 'Google Pay' },
          { id: 'applePayEnabled', label: 'Apple Pay' },
        ].map(method => (
          <label key={method.id} className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox"
              checked={settings[method.id as any] as boolean ?? false}
              onChange={(e) => setSettings({ ...settings, [method.id]: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 text-[#00E676] focus:ring-[#00E676] bg-gray-800"
            />
            <span className="text-sm font-bold text-gray-200">{method.label}</span>
          </label>
        ))}
      </div>

      <h3 id="withdrawals" className="text-lg font-black text-white mb-4">Earnings & Withdrawals</h3>
      <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Withdrawal Exchange Rate (Gems per 1 USD)</label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={settings.withdrawalRate || 100}
              onChange={(e) => setSettings({ ...settings, withdrawalRate: Number(e.target.value) })}
              className="w-full max-w-[200px] bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
            />
            <span className="text-sm font-bold text-gray-400">Gems = $1.00</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Minimum Withdrawal Amount (USD)</label>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-gray-400">$</span>
            <input
              type="number"
              value={settings.minWithdrawalAmount || 50}
              onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: Number(e.target.value) })}
              className="w-full max-w-[200px] bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Minimum amount users can request to withdraw.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Gift Commission Fee (%)</label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="0"
              max="100"
              value={settings.giftCommissionPercentage || 0}
              onChange={(e) => setSettings({ ...settings, giftCommissionPercentage: Number(e.target.value) })}
              className="w-full max-w-[200px] bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
            />
            <span className="text-sm font-bold text-gray-400">%</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Percentage of gems deducted from the receiver. E.g., if set to 10, a 100-gem gift gives 90 gems.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-3">Allowed Withdrawal Methods</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['PayPal', 'Bank Transfer', 'UPI', 'Crypto', 'PayTM', 'Skrill', 'WebMoney'].map(method => {
              const currentMethods = settings.withdrawalMethods || ['paypal', 'bank_transfer', 'upi', 'crypto'];
              const methodKey = method.toLowerCase().replace(' ', '_');
              const isChecked = currentMethods.includes(methodKey);
              return (
                <label key={methodKey} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      let newMethods = [...currentMethods];
                      if (e.target.checked) newMethods.push(methodKey);
                      else newMethods = newMethods.filter(m => m !== methodKey);
                      setSettings({ ...settings, withdrawalMethods: newMethods });
                    }}
                    className="w-4 h-4 rounded border-gray-600 text-[#00E676] focus:ring-[#00E676] bg-gray-800"
                  />
                  <span className="text-xs font-bold text-gray-200">{method}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-black text-white mb-4">Payment Gateway API Keys</h3>
      <div className="space-y-4">
        
        {/* Stripe */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">Stripe Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/stripe/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Stripe Public Key</label>
              <input type="text" value={settings.stripePublicKey || ''} onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Stripe Secret Key</label>
              <input type="password" value={settings.stripeSecretKey || ''} onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
          </div>
        </div>

        {/* PayPal */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">PayPal Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/paypal/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">PayPal Client ID</label>
              <input type="text" value={settings.paypalClientId || ''} onChange={(e) => setSettings({ ...settings, paypalClientId: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">PayPal Secret</label>
              <input type="password" value={settings.paypalSecret || ''} onChange={(e) => setSettings({ ...settings, paypalSecret: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
          </div>
        </div>

        {/* Razorpay */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">Razorpay Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/razorpay/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Razorpay Key ID</label>
              <input type="text" value={settings.razorpayKeyId || ''} onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Razorpay Key Secret</label>
              <input type="password" value={settings.razorpayKeySecret || ''} onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
          </div>
        </div>

        {/* Flutterwave */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">Flutterwave Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/flutterwave/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Public Key</label>
              <input type="text" value={settings.flutterwavePublicKey || ''} onChange={(e) => setSettings({ ...settings, flutterwavePublicKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Secret Key</label>
              <input type="password" value={settings.flutterwaveSecretKey || ''} onChange={(e) => setSettings({ ...settings, flutterwaveSecretKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
          </div>
        </div>

        {/* Cashfree */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">Cashfree Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/cashfree/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">App ID</label>
              <input type="text" value={settings.cashfreeAppId || ''} onChange={(e) => setSettings({ ...settings, cashfreeAppId: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Secret Key</label>
              <input type="password" value={settings.cashfreeSecretKey || ''} onChange={(e) => setSettings({ ...settings, cashfreeSecretKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Environment (sandbox / production)</label>
              <input type="text" value={settings.cashfreeEnvironment || 'sandbox'} onChange={(e) => setSettings({ ...settings, cashfreeEnvironment: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
          </div>
        </div>

        {/* PayU */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">PayU Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/payu/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Merchant Key</label>
              <input type="text" value={settings.payuMerchantKey || ''} onChange={(e) => setSettings({ ...settings, payuMerchantKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Merchant Salt</label>
              <input type="password" value={settings.payuMerchantSalt || ''} onChange={(e) => setSettings({ ...settings, payuMerchantSalt: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
          </div>
        </div>

        {/* PhonePe */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#00E676]">PhonePe Settings</h4>
              <div className="text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 font-mono text-gray-300 select-all">
                  Webhook: {window.location.origin}/api/payments/phonepe/webhook
              </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Merchant ID</label>
              <input type="text" value={settings.phonepeMerchantId || ''} onChange={(e) => setSettings({ ...settings, phonepeMerchantId: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Salt Key</label>
              <input type="password" value={settings.phonepeSaltKey || ''} onChange={(e) => setSettings({ ...settings, phonepeSaltKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Salt Index</label>
                <input type="text" value={settings.phonepeSaltIndex || '1'} onChange={(e) => setSettings({ ...settings, phonepeSaltIndex: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E676]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Environment</label>
                <select value={settings.phonepeEnvironment || 'UAT'} onChange={(e) => setSettings({ ...settings, phonepeEnvironment: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]">
                  <option value="UAT">UAT (Sandbox)</option>
                  <option value="PRODUCTION">Production</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
