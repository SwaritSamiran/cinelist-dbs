import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getUserCollabLists, createCollabList } from '../services/database';
import { Plus, Users, LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CollabListsPage() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  const loadLists = async () => {
    setLoading(true);
    const data = await getUserCollabLists(user.id);
    setLists(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitLoading(true);
    await createCollabList(user.id, name, desc);
    setName('');
    setDesc('');
    setShowCreate(false);
    await loadLists();
    setSubmitLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Collaborative Lists</h1>
          <p className="text-lg mt-2" style={{ color: 'var(--color-text-muted)' }}>Share and build movie lists with friends.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Create New List
        </button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-white rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Create a Collaborative List</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>List Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-[var(--color-background)] border" style={{ borderColor: 'var(--color-card-border)', color: 'var(--color-text)' }} placeholder="e.g. Action Movies 2024" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--color-background)] border" style={{ borderColor: 'var(--color-card-border)', color: 'var(--color-text)' }} placeholder="What is this list about?" />
            </div>
            <button disabled={submitLoading} type="submit" className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50">
              {submitLoading ? 'Creating...' : 'Save List'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map(list => (
          <Link key={list.id} to={`/collab/${list.id}`}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02]" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-tr from-orange-500 to-pink-500 text-white">
                <LayoutList className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-1 truncate" style={{ color: 'var(--color-text)' }}>{list.name}</h3>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{list.description || 'No description'}</p>
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex" style={{ background: 'var(--color-background)', color: 'var(--color-text-muted)' }}>
                <Users className="w-4 h-4" /> Role: {list.role}
              </div>
            </motion.div>
          </Link>
        ))}
        
        {lists.length === 0 && !showCreate && (
           <div className="col-span-full py-20 text-center" style={{ color: 'var(--color-text-muted)' }}>
             <LayoutList className="w-16 h-16 mx-auto mb-4 opacity-50" />
             <p className="text-xl font-semibold">No collaborative lists yet.</p>
             <p className="mt-2">Create one to start adding movies with friends!</p>
           </div>
        )}
      </div>
    </div>
  );
}
