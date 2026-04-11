import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Users, MessageCircle, X } from 'lucide-react';
import { getAllUsers, getFriendships, sendFriendRequest, removeFriendship, acceptFriendRequest, getUserMovies } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';

function UserCard({ user, friendshipStatus, onActionClick, loading }) {
  const navigate = useNavigate();
  const getStatusConfig = () => {
    if (friendshipStatus === 'accepted') {
      return { bg: 'transparent', text: '#22c55e', label: 'Friends', icon: UserCheck };
    } else if (friendshipStatus === 'pending') {
      return { bg: 'transparent', text: 'var(--color-text-muted)', label: 'Pending', icon: UserCheck };
    }
    return { bg: 'var(--color-primary)', text: '#fff', label: 'Add Friend', icon: UserPlus };
  };
  
  const s = getStatusConfig();
  const Icon = s.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/profile/${user.id}`)}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer hover:scale-[1.01]"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-2xl shrink-0 border overflow-hidden" style={{ borderColor: 'var(--color-card-border)' }}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <div className="text-2xl">👤</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold truncate" style={{ color: 'var(--color-text)' }}>
          {user.full_name || user.username}
        </h3>
        <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>@{user.username}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{user.movieCount || 0} movies tracked</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onActionClick(user.id, friendshipStatus);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-50"
        style={{
          backgroundColor: friendshipStatus === 'none' ? 'var(--color-primary)' : 'var(--color-card)',
          color: s.text,
          border: friendshipStatus !== 'none' ? '1px solid var(--color-card-border)' : 'none',
        }}
        disabled={loading}
      >
        <Icon className="w-4 h-4" />
        {s.label}
      </button>
    </motion.div>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, userFriendships] = await Promise.all([
        getAllUsers(),
        getFriendships(user.id)
      ]);

      // Get movie counts for each user
      const usersWithCounts = await Promise.all(
        allUsers.map(async (u) => {
          if (u.id === user.id) return { ...u, movieCount: 0 };
          const movies = await getUserMovies(u.id);
          return { ...u, movieCount: movies.length };
        })
      );

      setUsers(usersWithCounts.filter(u => u.id !== user.id));
      setFriendships(userFriendships);
    } catch (error) {
      console.error('Error loading friends page:', error);
    }
    setLoading(false);
  };

  const getFriendshipStatus = (userId) => {
    const friendship = friendships.find(
      f => (f.requester_id === userId && f.addressee_id === user.id) ||
           (f.requester_id === user.id && f.addressee_id === userId)
    );
    return friendship?.status || 'none';
  };

  const handleFriendAction = async (userId, currentStatus) => {
    setActionLoading(true);
    try {
      if (currentStatus === 'none') {
        // Send friend request
        await sendFriendRequest(user.id, userId);
      } else if (currentStatus === 'pending') {
        // Accept or cancel request
        const friendship = friendships.find(
          f => (f.requester_id === userId && f.addressee_id === user.id) ||
               (f.requester_id === user.id && f.addressee_id === userId)
        );
        if (friendship) {
          if (friendship.addressee_id === user.id) {
            await acceptFriendRequest(friendship.id);
          } else {
            await removeFriendship(friendship.id);
          }
        }
      } else if (currentStatus === 'accepted') {
        // Remove friend
        const friendship = friendships.find(
          f => (f.requester_id === userId && f.addressee_id === user.id) ||
               (f.requester_id === user.id && f.addressee_id === userId)
        );
        if (friendship) {
          await removeFriendship(friendship.id);
        }
      }
      // Reload friendships
      const updated = await getFriendships(user.id);
      setFriendships(updated);
    } catch (error) {
      console.error('Error updating friendship:', error);
      alert('Failed to update friendship');
    }
    setActionLoading(false);
  };

  const friendCount = friendships.filter(f => f.status === 'accepted').length;
  const pendingCount = friendships.filter(
    f => f.status === 'pending' && f.addressee_id === user.id
  ).length;

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                         (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()));
    const status = getFriendshipStatus(u.id);
    
    if (tab === 'friends') return matchesSearch && status === 'accepted';
    if (tab === 'pending') return matchesSearch && status === 'pending' && friendships.find(f => f.addressee_id === user.id && f.requester_id === u.id);
    return matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'All Users' },
    { id: 'friends', label: `Friends (${friendCount})` },
    { id: 'pending', label: `Pending (${pendingCount})` },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 px-10 py-10 max-w-4xl mx-auto">
      <div className="mt-6 mb-10">
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: 'var(--color-text)' }}>Friends</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Find and connect with fellow cinephiles.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)', color: 'var(--color-text)' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: tab === t.id ? 'var(--color-primary)' : 'var(--color-card)',
              color: tab === t.id ? '#fff' : 'var(--color-text-muted)',
              border: tab !== t.id ? '1px solid var(--color-card-border)' : 'none',
              boxShadow: tab === t.id ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* User List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredUsers.map(u => (
            <UserCard
              key={u.id}
              user={u}
              friendshipStatus={getFriendshipStatus(u.id)}
              onActionClick={handleFriendAction}
              loading={actionLoading}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-xl font-medium" style={{ color: 'var(--color-text-muted)' }}>No users found</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Try searching with a different name.</p>
        </div>
      )}
    </div>
  );
}
