import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieDetails, getImageUrl } from '../services/tmdb';
import { setMovieStatus, removeMovieStatus, getMovieStatus, cacheMovie, getUserCollabLists, addMovieToCollabList } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Star, Clock, Calendar, Check, Plus, Heart, LayoutList, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [collabLists, setCollabLists] = useState([]);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [addingToCollab, setAddingToCollab] = useState(null);

  useEffect(() => {
    fetchMovieDetails(id).then(data => {
      setMovie(data);
      if (user) {
        getMovieStatus(user.id, id).then(status => setActiveAction(status));
      }
      setLoading(false);
    });
  }, [id, user]);

  const handleAction = async (actionKey) => {
    if (!user) {
      alert('Please log in to track movies');
      return;
    }

    setActionLoading(true);
    try {
      // Cache the movie first
      await cacheMovie(movie);

      if (activeAction === actionKey) {
        // Remove the status
        await removeMovieStatus(user.id, movie.id);
        setActiveAction(null);
      } else {
        // Set new status
        await setMovieStatus(user.id, movie.id, actionKey, movie);
        setActiveAction(actionKey);
      }
    } catch (error) {
      console.error('Error updating movie status:', error);
      alert('Failed to update movie status');
    }
    setActionLoading(false);
  };

  const handleAddToCollab = async (listId) => {
    setAddingToCollab(listId);
    try {
      await addMovieToCollabList(listId, movie.id, user.id, movie);
      alert('Movie added to collaborative list!');
      setShowCollabModal(false);
    } catch (error) {
      alert('Failed to add to list');
    }
    setAddingToCollab(null);
  };

  const openCollabModal = async () => {
    if (!user) return alert('Please log in');
    setActionLoading(true);
    const lists = await getUserCollabLists(user.id);
    setCollabLists(lists);
    setShowCollabModal(true);
    setActionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--color-primary)]"></div>
    </div>
  );

  if (!movie) return (
    <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Movie not found</div>
  );

  const actions = [
    { key: 'finished', label: 'Finished', Icon: Check, gradient: 'from-green-500 to-emerald-600' },
    { key: 'watching', label: 'Currently Watching', Icon: Plus, gradient: 'from-purple-500 to-indigo-600' },
    { key: 'wishlist', label: 'Wishlist', Icon: Heart, gradient: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="min-h-screen relative pb-20">
      {/* Backdrop — semi-transparent so live particles show through */}
      <div className="absolute top-0 left-0 w-full h-[55vh] z-0 overflow-hidden pointer-events-none">
        <img
          src={getImageUrl(movie.backdrop_path, 'original')}
          alt={movie.title}
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, var(--color-background) 100%)` }}></div>
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, var(--color-background), transparent 60%)`, opacity: 0.6 }}></div>
      </div>

      <div className="relative z-10 px-8 pt-10 max-w-6xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-1/3 max-w-[300px] shrink-0"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl relative" style={{ border: '1px solid var(--color-card-border)' }}>
              <img src={getImageUrl(movie.poster_path)} alt={movie.title} className="w-full h-auto" />
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              {actions.map(({ key, label, Icon, gradient }) => {
                const isActive = activeAction === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleAction(key)}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                        : ''
                    }`}
                    style={!isActive ? {
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-card-border)',
                      color: 'var(--color-text-muted)',
                    } : {}}
                    disabled={actionLoading}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive ? `Added to ${label}` : label}
                  </button>
                );
              })}
              
              <button
                onClick={openCollabModal}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer mt-2"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-card-border)',
                  color: 'var(--color-primary)',
                }}
                disabled={actionLoading}
              >
                <LayoutList className="w-5 h-5" />
                Add to Collab List
              </button>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 pt-4"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--color-text)' }}>{movie.title}</h1>
            {movie.tagline && <p className="text-xl italic mb-6" style={{ color: 'var(--color-text-muted)' }}>{movie.tagline}</p>}

            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm font-medium">
              <div className="flex items-center gap-2 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-lg">{Number(movie.vote_average || 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Calendar className="w-4 h-4" />
                <span>{movie.release_date?.split('-')[0] || 'Unknown'}</span>
              </div>
              {movie.runtime && (
                <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <Clock className="w-4 h-4" />
                  <span>{movie.runtime} min</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {movie.genres?.map(g => (
                <span
                  key={g.id || g.name}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}
                >
                  {g.name}
                </span>
              ))}
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Overview</h2>
              <p className="leading-relaxed max-w-3xl" style={{ color: 'var(--color-text-muted)' }}>
                {movie.overview || 'No overview available.'}
              </p>
            </div>

            {/* Cast Preview */}
            {movie.credits?.cast?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Cast</h2>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                  {movie.credits.cast.slice(0, 8).map(person => (
                    <div key={person.id} className="shrink-0 w-24 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>
                        {person.profile_path ? (
                          <img src={getImageUrl(person.profile_path, 'w185')} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--color-text-muted)' }}>?</div>
                        )}
                      </div>
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{person.name}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showCollabModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCollabModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-card-border)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Select a List</h3>
                <button onClick={() => setShowCollabModal(false)} className="p-2 hover:bg-[var(--color-card)] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {collabLists.length > 0 ? (
                <div className="space-y-3">
                  {collabLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => handleAddToCollab(list.id)}
                      disabled={addingToCollab === list.id}
                      className="w-full p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-card-border)] text-left hover:border-[var(--color-primary)] transition-all flex items-center justify-between group"
                    >
                      <span className="font-bold" style={{ color: 'var(--color-text)' }}>{list.name}</span>
                      <Plus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--color-text-muted)' }}>You don't have any collab lists yet.</p>
                  <button onClick={() => navigate('/collab')} className="mt-4 text-[var(--color-primary)] font-bold">Create one now</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
