import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings } from 'lucide-react';


export const MailSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-8 animate-fadeIn">
                    
                    {/* Mail Configuration */}
                    <div>
                      <h3 className="text-lg font-black text-white mb-4">Mail Configuration</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Mail Driver</label>
                          <select
                            value={settings.mailDriver || 'sendmail'}
                            onChange={(e) => setSettings({ ...settings, mailDriver: e.target.value as any })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] cursor-pointer"
                          >
                            <option value="sendmail">Sendmail (Local Server)</option>
                            <option value="smtp">SMTP (External Server)</option>
                          </select>
                        </div>
                        <div></div>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">From Name</label>
                          <input
                            type="text"
                            value={settings.mailFromName || ''}
                            onChange={(e) => setSettings({ ...settings, mailFromName: e.target.value })}
                            placeholder="e.g. VibeMatch Team"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">From Email</label>
                          <input
                            type="email"
                            value={settings.mailFromEmail || ''}
                            onChange={(e) => setSettings({ ...settings, mailFromEmail: e.target.value })}
                            placeholder="e.g. noreply@vibematch.com"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          />
                        </div>
                      </div>

                      {settings.mailDriver === 'smtp' && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">SMTP Host</label>
                            <input
                              type="text"
                              value={settings.smtpHost || ''}
                              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">SMTP Port</label>
                            <input
                              type="text"
                              value={settings.smtpPort || ''}
                              onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">SMTP User</label>
                            <input
                              type="text"
                              value={settings.smtpUser || ''}
                              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">SMTP Password</label>
                            <input
                              type="password"
                              value={settings.smtpPass || ''}
                              onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Email Templates */}
                    <div className="pt-6 border-t border-gray-800">
                      <h3 className="text-lg font-black text-white mb-4">Email Templates</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Welcome Email (HTML)</label>
                          <p className="text-xs text-gray-500 mb-2">Sent to new users upon registration (except guests). Available tags: <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%nameuser%</span></p>
                          <textarea
                            value={settings.templateWelcome || ''}
                            onChange={(e) => setSettings({ ...settings, templateWelcome: e.target.value })}
                            rows={6}
                            placeholder="<h1>Welcome to VibeMatch, %nameuser%!</h1>"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] font-mono"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Purchase Confirmation Email (HTML)</label>
                          <p className="text-xs text-gray-500 mb-2">Sent when a user purchases a VIP or Diamond pack. Available tags: <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%nameuser%</span>, <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%packname%</span>, <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%price%</span></p>
                          <textarea
                            value={settings.templatePurchase || ''}
                            onChange={(e) => setSettings({ ...settings, templatePurchase: e.target.value })}
                            rows={6}
                            placeholder="<h1>Thank you %nameuser%!</h1><p>You have successfully purchased %packname% for $%price%.</p>"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] font-mono"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Withdrawal Approved Email (HTML)</label>
                          <p className="text-xs text-gray-500 mb-2">Sent when admin approves a withdrawal request. Available tags: <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%nameuser%</span>, <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%amount%</span>, <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%method%</span></p>
                          <textarea
                            value={settings.templateWithdrawalApproved || ''}
                            onChange={(e) => setSettings({ ...settings, templateWithdrawalApproved: e.target.value })}
                            rows={6}
                            placeholder="<h1>Great news, %nameuser%!</h1><p>Your withdrawal of $%amount% via %method% has been approved.</p>"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Withdrawal Rejected Email (HTML)</label>
                          <p className="text-xs text-gray-500 mb-2">Sent when admin rejects a withdrawal request. Available tags: <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%nameuser%</span>, <span className="font-mono text-[#00E676] bg-[#00E676]/10 px-1 rounded">%amount%</span></p>
                          <textarea
                            value={settings.templateWithdrawalRejected || ''}
                            onChange={(e) => setSettings({ ...settings, templateWithdrawalRejected: e.target.value })}
                            rows={6}
                            placeholder="<h1>Hi %nameuser%,</h1><p>Unfortunately, your withdrawal of $%amount% was rejected and gems have been refunded.</p>"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676] font-mono"
                          />
                        </div>

                      </div>
                    </div>

                    {/* Test Email */}
                    <div className="pt-6 border-t border-gray-800">
                      <h3 className="text-lg font-black text-white mb-4">Test Configuration</h3>
                      <div className="flex items-end space-x-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Recipient Email</label>
                          <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="test@example.com"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                          />
                        </div>
                        <button
                          onClick={handleSendTestEmail}
                          disabled={testEmailStatus === 'sending' || !testEmail}
                          className="px-6 py-3 bg-[#00E676] text-black font-bold rounded-xl hover:bg-[#00c565] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {testEmailStatus === 'sending' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <span>Send Test Email</span>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
  );
};
