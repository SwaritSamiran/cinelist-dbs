import React, { useState, useEffect } from 'react';
import { Search, Flame, Popcorn, Clock } from 'lucide-react';
import { fetchMovies, searchMovies } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import { motion } from 'framer-motion';

function Section({ title, icon: Icon, movies }) {
  if (movies.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)' }}>
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMovies('/movie/popular'),
      fetchMovies('/movie/top_rated'),
      fetchMovies('/movie/upcoming')
    ]).then(([pop, tr, up]) => {
      setPopular(pop);
      setTopRated(tr);
      setUpcoming(up);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (query.trim().length > 2) {
      const delay = setTimeout(() => {
        searchMovies(query).then(res => setSearchResults(res));
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--color-primary)]"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-10">
      {/* Sticky Search */}
      <div className="backdrop-blur-2xl sticky top-0 z-30 px-10 py-5" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 60%, transparent)', borderBottom: '1px solid var(--color-card-border)' }}>
        <div className="max-w-3xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full rounded-full pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all shadow-inner"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-card-border)', color: 'var(--color-text)' }}
          />
        </div>
      </div>

      <div className="px-10 py-8">
        {searchResults.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Section title={`Results for "${query}"`} icon={Search} movies={searchResults} />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Section title="Trending Now" icon={Flame} movies={popular} />
            <Section title="Top Rated Classics" icon={Popcorn} movies={topRated} />
            <Section title="Upcoming Releases" icon={Clock} movies={upcoming} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
