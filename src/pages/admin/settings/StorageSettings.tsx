import React from 'react';
import { Save, Globe, Mail, Lock, ShieldCheck, Database, DollarSign, Video, Zap, Smartphone, Upload, Trash2, CheckCircle, Plus, Edit2, PlayCircle, EyeOff, Settings, Server } from 'lucide-react';


export const StorageSettings = ({ settings, setSettings, handleFileUpload, isUploadingFile, testEmail, setTestEmail, testEmailStatus, handleSendTestEmail, testingStorage, handleTestStorage }: any) => {
  return (
    <div className="space-y-6 max-w-4xl">
                    <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center">
                            <Server className="w-5 h-5 mr-2 text-[#00E676]" /> Active Storage Provider
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">Select where user uploads (avatars, attachments) should be stored.</p>
                        </div>
                      </div>
                      <select
                        value={settings.storageType || 'local'}
                        onChange={(e) => setSettings({ ...settings, storageType: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]"
                      >
                        <option value="local">Local Server (Public folder)</option>
                        <option value="digitalocean">DigitalOcean Spaces</option>
                        <option value="s3">Amazon S3</option>
                        <option value="gcp">Google Cloud Storage</option>
                        <option value="backblaze">Backblaze B2</option>
                        <option value="bunny">Bunny.net</option>
                      </select>
                    </div>

                    {/* Local Server */}
                    <div className={`p-6 rounded-2xl border ${settings.storageType === 'local' ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#181a20] border-gray-800'} transition-colors`}>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center">Local Server</h3>
                        <button onClick={() => handleTestStorage('local')} disabled={testingStorage === 'local'} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition">
                          {testingStorage === 'local' ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Files will be stored locally in the <code>/public/uploads</code> directory. No configuration needed.</p>
                    </div>

                    {/* DigitalOcean */}
                    <div className={`p-6 rounded-2xl border ${settings.storageType === 'digitalocean' ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#181a20] border-gray-800'} transition-colors`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">DigitalOcean Spaces</h3>
                        <button onClick={() => handleTestStorage('digitalocean')} disabled={testingStorage === 'digitalocean'} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition">
                          {testingStorage === 'digitalocean' ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endpoint URL</label>
                          <input type="text" value={settings.doEndpoint || ''} onChange={(e) => setSettings({ ...settings, doEndpoint: e.target.value })} placeholder="e.g. sfo3.digitaloceanspaces.com" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Region</label>
                          <input type="text" value={settings.doRegion || ''} onChange={(e) => setSettings({ ...settings, doRegion: e.target.value })} placeholder="e.g. sfo3" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Space Name (Bucket)</label>
                          <input type="text" value={settings.doBucket || ''} onChange={(e) => setSettings({ ...settings, doBucket: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Access Key</label>
                          <input type="text" value={settings.doAccessKey || ''} onChange={(e) => setSettings({ ...settings, doAccessKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Secret Key</label>
                          <input type="password" value={settings.doSecretKey || ''} onChange={(e) => setSettings({ ...settings, doSecretKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                      </div>
                    </div>

                    {/* Amazon S3 */}
                    <div className={`p-6 rounded-2xl border ${settings.storageType === 's3' ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#181a20] border-gray-800'} transition-colors`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Amazon S3</h3>
                        <button onClick={() => handleTestStorage('s3')} disabled={testingStorage === 's3'} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition">
                          {testingStorage === 's3' ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Region</label>
                          <input type="text" value={settings.s3Region || ''} onChange={(e) => setSettings({ ...settings, s3Region: e.target.value })} placeholder="e.g. us-east-1" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bucket Name</label>
                          <input type="text" value={settings.s3Bucket || ''} onChange={(e) => setSettings({ ...settings, s3Bucket: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Access Key ID</label>
                          <input type="text" value={settings.s3AccessKey || ''} onChange={(e) => setSettings({ ...settings, s3AccessKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Secret Access Key</label>
                          <input type="password" value={settings.s3SecretKey || ''} onChange={(e) => setSettings({ ...settings, s3SecretKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                      </div>
                    </div>

                    {/* Google Cloud */}
                    <div className={`p-6 rounded-2xl border ${settings.storageType === 'gcp' ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#181a20] border-gray-800'} transition-colors`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Google Cloud Storage</h3>
                        <button onClick={() => handleTestStorage('gcp')} disabled={testingStorage === 'gcp'} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition">
                          {testingStorage === 'gcp' ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Project ID</label>
                          <input type="text" value={settings.gcpProjectId || ''} onChange={(e) => setSettings({ ...settings, gcpProjectId: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bucket Name</label>
                          <input type="text" value={settings.gcpBucket || ''} onChange={(e) => setSettings({ ...settings, gcpBucket: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Client Email</label>
                          <input type="text" value={settings.gcpClientEmail || ''} onChange={(e) => setSettings({ ...settings, gcpClientEmail: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Private Key</label>
                          <textarea value={settings.gcpPrivateKey || ''} onChange={(e) => setSettings({ ...settings, gcpPrivateKey: e.target.value })} placeholder="-----BEGIN PRIVATE KEY-----
..." rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                      </div>
                    </div>

                    {/* Backblaze B2 */}
                    <div className={`p-6 rounded-2xl border ${settings.storageType === 'backblaze' ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#181a20] border-gray-800'} transition-colors`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Backblaze B2</h3>
                        <button onClick={() => handleTestStorage('backblaze')} disabled={testingStorage === 'backblaze'} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition">
                          {testingStorage === 'backblaze' ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">S3 Endpoint</label>
                          <input type="text" value={settings.b2Endpoint || ''} onChange={(e) => setSettings({ ...settings, b2Endpoint: e.target.value })} placeholder="s3.us-west-004.backblazeb2.com" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bucket Name</label>
                          <input type="text" value={settings.b2Bucket || ''} onChange={(e) => setSettings({ ...settings, b2Bucket: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">keyID</label>
                          <input type="text" value={settings.b2KeyId || ''} onChange={(e) => setSettings({ ...settings, b2KeyId: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">applicationKey</label>
                          <input type="password" value={settings.b2AppKey || ''} onChange={(e) => setSettings({ ...settings, b2AppKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                      </div>
                    </div>

                    {/* Bunny.net */}
                    <div className={`p-6 rounded-2xl border ${settings.storageType === 'bunny' ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#181a20] border-gray-800'} transition-colors`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Bunny.net</h3>
                        <button onClick={() => handleTestStorage('bunny')} disabled={testingStorage === 'bunny'} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition">
                          {testingStorage === 'bunny' ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Storage Zone Name</label>
                          <input type="text" value={settings.bunnyStorageZone || ''} onChange={(e) => setSettings({ ...settings, bunnyStorageZone: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">API Access Key</label>
                          <input type="password" value={settings.bunnyAccessKey || ''} onChange={(e) => setSettings({ ...settings, bunnyAccessKey: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pull Zone URL</label>
                          <input type="text" value={settings.bunnyPullZoneUrl || ''} onChange={(e) => setSettings({ ...settings, bunnyPullZoneUrl: e.target.value })} placeholder="https://cdn.example.com" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E676]" />
                        </div>
                      </div>
                    </div>
                  </div>
  );
};
