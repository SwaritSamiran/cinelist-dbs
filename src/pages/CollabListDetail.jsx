import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCollabList, 
  getCollabListMovies, 
  getCollabListMembers, 
  inviteFriendToCollabList, 
  getFriendships,
  getUserProfile,
  removeMovieFromCollabList
} from '../services/database';
import { Users, LayoutList, ArrowLeft, Plus, UserPlus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MovieCard from '../components/MovieCard';

export default function CollabListDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [movies, setMovies] = useState([]);
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadAllData();
    }
  }, [user, id]);

  const loadAllData = async () => {
    setLoading(true);
    const [listData, movieData, memberData, friendshipData] = await Promise.all([
      getCollabList(id),
      getCollabListMovies(id),
      getCollabListMembers(id),
      getFriendships(user.id)
    ]);

    setList(listData);
    setMovies(movieData);
    setMembers(memberData);
    
    // Filter friends who aren't already members
    const memberIds = new Set(memberData.map(m => m.user_id));
    const friendIds = friendshipData
      .filter(f => f.status === 'accepted')
      .map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);

    const friendProfiles = await Promise.all(
      friendIds
        .filter(fid => !memberIds.has(fid))
        .map(fid => getUserProfile(fid))
    );

    setFriends(friendProfiles.filter(Boolean));
    setLoading(false);
  };

  const handleInvite = async (friendId) => {
    setInviteLoading(true);
    await inviteFriendToCollabList(id, friendId);
    await loadAllData();
    setInviteLoading(false);
  };

  const handleRemoveMovie = async (tmdbId) => {
    if (!window.confirm('Remove this movie from the list?')) return;
    await removeMovieFromCollabList(id, tmdbId);
    setMovies(movies.filter(m => m.tmdb_id !== tmdbId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!list) return <div className="p-10 text-center">List not found</div>;

  const isOwner = members.find(m => m.user_id === user.id)?.role === 'owner';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/collab')}
        className="flex items-center gap-2 mb-8 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Lists
      </button>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Info */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-8">
            <div className="p-6 rounded-3xl mb-6" style={{ background: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>
              <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-tr from-orange-500 to-pink-500 text-white">
                <LayoutList className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{list.name}</h1>
              <p className="mb-6 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{list.description || 'No description provided.'}</p>
              
              <div className="pt-6 border-t" style={{ borderColor: 'var(--color-card-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <Users className="w-4 h-4" /> Members ({members.length})
                  </h3>
                  {isOwner && (
                    <button 
                      onClick={() => setShowInvite(true)}
                      className="text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden border border-[var(--color-card-border)]">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-[var(--color-text-muted)]">
                            {member.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{member.username}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-50" style={{ color: 'var(--color-text-muted)' }}>{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Movies in this List</h2>
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{movies.length} titles</div>
          </div>

          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map(movie => (
                <div key={movie.tmdb_id} className="relative group">
                  <MovieCard movie={movie} />
                  <button 
                    onClick={() => handleRemoveMovie(movie.tmdb_id)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center" style={{ color: 'var(--color-text-muted)', background: 'var(--color-card)', border: '1px dashed var(--color-card-border)', borderRadius: '2rem' }}>
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">This list is empty</p>
              <p className="mt-1 text-sm">Add movies from their detail pages</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowInvite(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-card-border)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Invite Friends</h3>
                <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-[var(--color-card)] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {friends.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-1">
                  {friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-card-border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--color-card-border)]">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] font-bold">
                              {friend.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{friend.username}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{friend.full_name || 'Member'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInvite(friend.id)}
                        disabled={inviteLoading}
                        className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No friends available to invite.</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Make sure they've accepted your friend request!</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
