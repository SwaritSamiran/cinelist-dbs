import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Check, Heart, User as UserIcon, Edit2 } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { getUserMovies, getUserProfile } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, profile: currentUserProfile } = useAuth();
  const [targetProfile, setTargetProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('watching');
  const [movies, setMovies] = useState({
    watching: [],
    finished: [],
    wishlist: []
  });
  const [loading, setLoading] = useState(true);

  const displayProfile = userId ? targetProfile : currentUserProfile;
  const targetId = userId || user?.id;

  useEffect(() => {
    if (targetId) {
      loadData();
    }
  }, [targetId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (userId) {
        const fetchedProfile = await getUserProfile(userId);
        setTargetProfile(fetchedProfile);
      } else {
        setTargetProfile(currentUserProfile);
      }

      const watchingMovies = await getUserMovies(targetId, 'watching');
      const finishedMovies = await getUserMovies(targetId, 'finished');
      const wishlistMovies = await getUserMovies(targetId, 'wishlist');
      
      setMovies({
        watching: watchingMovies,
        finished: finishedMovies,
        wishlist: wishlistMovies
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'watching', label: 'Currently Watching', icon: Play, count: movies.watching.length },
    { id: 'finished', label: 'Finished', icon: Check, count: movies.finished.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, count: movies.wishlist.length },
  ];

  const movieList = movies[activeTab] || [];

  return (
    <div className="min-h-screen relative z-10 px-10 py-10">

      {/* Profile Header */}
      <div
        className="backdrop-blur-2xl rounded-3xl p-8 mb-10 mt-6 flex items-center gap-8 shadow-2xl overflow-hidden relative"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-card-border)',
          border: '1px solid var(--color-card-border)',
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-orange-400 p-[3px] shadow-[0_0_40px_rgba(168,85,247,0.3)] shrink-0">
          <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
            {displayProfile?.avatar_url ? (
              <img src={displayProfile.avatar_url} alt={displayProfile.username} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-14 h-14" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
        </div>
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
            {displayProfile?.full_name || displayProfile?.username || 'User'}
          </h1>
          <p className="text-lg mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {displayProfile?.bio || 'Cinephile · Member since ' + new Date(displayProfile?.created_at || Date.now()).toLocaleDateString()}
          </p>
          <div className="flex gap-4">
            {[
              { label: 'Finished', count: movies.finished.length },
              { label: 'Watching', count: movies.watching.length },
              { label: 'Wishlist', count: movies.wishlist.length },
            ].map(s => (
              <div key={s.label} className="px-4 py-2 rounded-xl text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{s.count}</div>
                <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-8 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative cursor-pointer"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className="px-2 py-0.5 rounded-full text-xs ml-1" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)' }}>{tab.count}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                  style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 0 12px var(--color-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          {movieList.map(item => (
            <MovieCard key={item.id} movie={item.movies} />
          ))}
        </motion.div>
      )}

      {!loading && movieList.length === 0 && (
        <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>
          <p className="text-xl font-medium">Nothing here yet</p>
          <p className="mt-2 text-sm">Hit the + button on any movie card to start tracking.</p>
        </div>
      )}
    </div>
  );
}
