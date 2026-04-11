import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Check, Heart } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';
import { setMovieStatus, removeMovieStatus, getMovieStatus, cacheMovie } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load current status from DB on mount
  useEffect(() => {
    if (user && movie.id) {
      getMovieStatus(user.id, movie.id).then(s => setStatus(s));
    }
  }, [user, movie.id]);

  const handleStatusUpdate = async (e, newStatus) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to track movies');
      return;
    }

    setLoading(true);
    try {
      // Cache the movie first
      await cacheMovie(movie);
      
      // Set the status in database
      await setMovieStatus(user.id, movie.id, newStatus, movie);
      setStatus(newStatus);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error updating movie status:', error);
      alert('Failed to update movie status');
    }
    setLoading(false);
  };

  const statusIcon = () => {
    if (status === 'watching') return <Plus className="w-4 h-4 text-blue-400" />;
    if (status === 'finished') return <Check className="w-4 h-4 text-green-400" />;
    if (status === 'wishlist') return <Heart className="w-4 h-4 text-pink-400" />;
    return <Plus className="w-4 h-4" />;
  };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden aspect-[2/3] cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl"
      style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.15)' }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <img
        src={getImageUrl(movie.poster_path)}
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Rating Badge */}
      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded-lg text-sm text-yellow-500 font-semibold z-10">
        <Star fill="currentColor" className="w-3.5 h-3.5" />
        {Number(movie.vote_average || 0).toFixed(1)}
      </div>

      {/* Add Button + Dropdown */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md text-white hover:bg-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: status ? 'rgba(139,92,246,0.8)' : 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
          disabled={loading}
        >
          {statusIcon()}
        </button>

        {showDropdown && (
          <div
            className="absolute top-10 left-0 w-48 rounded-xl shadow-2xl overflow-hidden z-30"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-card-border)' }}
          >
            <button
              onClick={(e) => handleStatusUpdate(e, 'watching')}
              className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              style={{ color: status === 'watching' ? '#60a5fa' : 'var(--color-text)', borderBottom: '1px solid var(--color-card-border)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              disabled={loading}
            >
              <Plus className="w-4 h-4" /> Currently Watching
            </button>
            <button
              onClick={(e) => handleStatusUpdate(e, 'finished')}
              className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              style={{ color: status === 'finished' ? '#34d399' : 'var(--color-text)', borderBottom: '1px solid var(--color-card-border)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              disabled={loading}
            >
              <Check className="w-4 h-4" /> Finished
            </button>
            <button
              onClick={(e) => handleStatusUpdate(e, 'wishlist')}
              className="w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              style={{ color: status === 'wishlist' ? '#f472b6' : 'var(--color-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              disabled={loading}
            >
              <Heart className="w-4 h-4" /> Wishlist
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-bold text-white text-base leading-tight line-clamp-2">{movie.title}</h3>
        <p className="text-white/60 text-sm mt-1">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : ''}
        </p>
      </div>
    </div>
  );
}
