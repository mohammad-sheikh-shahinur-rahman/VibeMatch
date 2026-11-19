import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Edit2, Trash2, Save, Eye, EyeOff, Bold, Italic, Underline, Link as LinkIcon, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export const PagesTab = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/pages', {
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token')) }
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      let contentToSave = editingPage.content;
      if (editorRef.current) {
        contentToSave = editorRef.current.innerHTML;
      }
      
      const payload = { ...editingPage, content: contentToSave };
      
      const method = editingPage._id ? 'PUT' : 'POST';
      const url = editingPage._id ? `/api/admin/pages/${editingPage._id}` : '/api/admin/pages';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token'))
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsEditing(false);
        setEditingPage(null);
        fetchPages();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save page');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('vibematch_admin_jwt_token') || localStorage.getItem('vibematch_jwt_token')) }
      });
      if (res.ok) fetchPages();
    } catch (err) {
      console.error(err);
    }
  };

  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  if (isEditing) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-white">{editingPage._id ? 'Edit Page' : 'Create New Page'}</h2>
          <div className="space-x-3 flex">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-[#00E676] text-black rounded-xl font-bold hover:bg-[#00C853] flex items-center">
              <Save className="w-4 h-4 mr-2" /> Save Page
            </button>
          </div>
        </div>
        
        <div className="bg-[#181a20] border border-gray-800 p-6 rounded-3xl space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Page Title</label>
            <input 
              type="text" 
              value={editingPage.title || ''} 
              onChange={e => {
                const title = e.target.value;
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                setEditingPage({ ...editingPage, title, slug: editingPage._id ? editingPage.slug : slug });
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]"
              placeholder="e.g. About Us"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">URL Slug</label>
            <input 
              type="text" 
              value={editingPage.slug || ''} 
              onChange={e => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E676]"
              placeholder="e.g. about-us"
            />
          </div>
          
          <div className="flex space-x-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={editingPage.isActive !== false} 
                onChange={e => setEditingPage({ ...editingPage, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 text-[#00E676] focus:ring-[#00E676] focus:ring-offset-gray-900" 
              />
              <span className="text-sm font-bold text-white">Active (Published)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={editingPage.showInFooter !== false} 
                onChange={e => setEditingPage({ ...editingPage, showInFooter: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 text-[#00E676] focus:ring-[#00E676] focus:ring-offset-gray-900" 
              />
              <span className="text-sm font-bold text-white">Show in Footer</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Page Content</label>
            <div className="bg-white rounded-xl overflow-hidden flex flex-col border border-gray-300">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 border-b border-gray-300">
                <button type="button" onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bold"><Bold className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Italic"><Italic className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Underline"><Underline className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button type="button" onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('justifyRight')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Right"><AlignRight className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bullet List"><List className="w-4 h-4" /></button>
                <button type="button" onClick={() => {
                  const url = prompt('Enter link URL:');
                  if (url) execCmd('createLink', url);
                }} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Link"><LinkIcon className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('formatBlock', 'H1')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold px-3">H1</button>
                <button type="button" onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold px-3">H2</button>
                <button type="button" onClick={() => execCmd('formatBlock', 'P')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold px-3">P</button>
              </div>
              
              {/* Editor */}
              <div 
                ref={editorRef}
                contentEditable
                className="w-full h-[400px] p-4 bg-white text-black focus:outline-none overflow-y-auto prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: editingPage.content || '' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Custom Pages</h1>
          <p className="text-xs text-gray-400 mt-1">Manage your website's custom pages like Terms, Privacy, About, etc.</p>
        </div>
        <button
          onClick={() => {
            setEditingPage({ title: '', slug: '', content: '', isActive: true, showInFooter: true });
            setIsEditing(true);
          }}
          className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Page</span>
        </button>
      </div>

      <div className="bg-[#181a20] border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="p-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Page Title</th>
              <th className="p-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Slug</th>
              <th className="p-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Footer</th>
              <th className="p-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No pages created yet.</td>
              </tr>
            ) : (
              pages.map(page => (
                <tr key={page._id} className="border-b border-gray-800/30 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[#00E676]" />
                    {page.title}
                  </td>
                  <td className="p-4 text-sm text-gray-400">/{page.slug}</td>
                  <td className="p-4">
                    {page.isActive ? 
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-md">Active</span> : 
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md">Inactive</span>
                    }
                  </td>
                  <td className="p-4">
                    {page.showInFooter ? <Eye className="w-4 h-4 text-gray-300" /> : <EyeOff className="w-4 h-4 text-gray-600" />}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => { setEditingPage(page); setIsEditing(true); }} className="p-2 hover:bg-gray-800 rounded-xl text-blue-400 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(page._id)} className="p-2 hover:bg-gray-800 rounded-xl text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
