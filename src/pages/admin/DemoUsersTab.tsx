import React from 'react';
import { Video, Settings as SettingsIcon, Plus, Ban } from 'lucide-react';

export const DemoUsersTab = (props: any) => {
  const { demoUsersList, handleOpenEditModal, setUserToDelete } = props;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Demo Users / Bots</h1>
          <p className="text-xs text-gray-400 mt-1">Manage virtual profiles and uploaded videos</p>
        </div>
        <button
          onClick={() => handleOpenEditModal({ id: 'new', name: '', email: '', avatar: '/images/avatars/female-1.svg', isDemo: true, role: 'user', username: '', country: '', countryCode: '', age: 18, gems: 0, isOnline: true, createdAt: '', gender: 'female' })}
          className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Demo User</span>
        </button>
      </div>

      <div className="bg-[#181a20] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Demo Profile</th>
                <th className="p-4">Gender & Age</th>
                <th className="p-4">Video Link</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-sm">
              {demoUsersList.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img src={user.avatar || '/images/logo.png'} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                      <div>
                        <div className="font-extrabold text-white">{user.name}</div>
                        <div className="text-[10px] text-gray-500">{user.country || 'Global'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 capitalize">{user.gender || 'Female'} • {user.age || 18}</td>
                  <td className="p-4 text-gray-400">
                    {user.videoUrl ? (
                      <a href={user.videoUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs flex items-center space-x-1">
                        <Video className="w-3 h-3" />
                        <span className="truncate w-32 inline-block">{user.videoUrl}</span>
                      </a>
                    ) : 'No Video'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${user.isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                      {user.isOnline ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setUserToDelete(user.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {demoUsersList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-bold">
                    No demo users added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
