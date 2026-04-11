// Note: In production, store the API Key in .env. 
// For demo purposes and immediate functionality, using an example generic bearer or requiring one.
const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_KEY || ''; // Provide your own TMDB API key in .env file
const BASE_URL = 'https://api.themoviedb.org/3';

export const fetchMovies = async (endpoint) => {
  if(!TMDB_ACCESS_TOKEN) {
    console.warn("TMDB API key is missing. Using fallback fake data.");
    return fetchMockData(endpoint);
  }
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json;charset=utf-8',
    },
  });
  const data = await response.json();
  return data.results || [];
};

export const fetchMovieDetails = async (id) => {
  if(!TMDB_ACCESS_TOKEN) return getMockDetail(id);
  const response = await fetch(`${BASE_URL}/movie/${id}?append_to_response=credits,videos`, {
    headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }
  });
  return response.json();
};

export const searchMovies = async (query) => {
  if(!TMDB_ACCESS_TOKEN) return fetchMockData();
  const response = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }
  });
  const data = await response.json();
  return data.results || [];
};

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Fallback logic for when the user hasn't setup TMDB key yet
const genericMovies = [
  { id: 1, title: 'Your Name', release_date: '2016-08-26', vote_average: 8.5, poster_path: 'https://images.unsplash.com/photo-1541295988188-f2b7428f6f57?q=80&w=400' },
  { id: 2, title: 'Spirited Away', release_date: '2001-07-20', vote_average: 8.5, poster_path: 'https://images.unsplash.com/photo-1555580058-297da53fec9a?q=80&w=400' },
  { id: 3, title: 'A Silent Voice', release_date: '2016-09-17', vote_average: 8.2, poster_path: 'https://images.unsplash.com/photo-1620078028710-53ee5c56c28f?q=80&w=400' },
  { id: 4, title: 'Neon Genesis Evangelion: The End of Evangelion', release_date: '1997-07-19', vote_average: 8.4, poster_path: 'https://images.unsplash.com/photo-1578632767115-351597fd24e5?q=80&w=400' },
];

function fetchMockData(endpoint) {
  return Promise.resolve(genericMovies);
}
function getMockDetail(id) {
  return Promise.resolve({
    id, title: 'Mock Movie Detail', 
    overview: 'This is a mocked detail since TMDB is not configured.',
    release_date: '2023-01-01', vote_average: 8.0,
    poster_path: null, backdrop_path: null,
    genres: [{name: 'Animation'}, {name: 'Drama'}]
  });
}
