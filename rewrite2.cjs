const fs = require('fs');

const authCode = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { sql } from '../services/neon';

const AuthContext = createContext({});
const SESSION_KEY = 'cinelist_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');        
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const data = await sql\`
        SELECT id, username, full_name, avatar_url, bio, created_at, email 
        FROM profiles 
        WHERE id = \${userId} 
        LIMIT 1
      \`;
      setProfile(data?.[0] || null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
      fetchProfile(session.user.id).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email, password, username) => {
    try {
      const cleanEmail = String(email || '').trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
      const cleanPassword = String(password || '');
      const cleanUsername = String(username || '').trim();

      if (!cleanEmail || !cleanPassword || !cleanUsername) {
        return { data: null, error: new Error('Email, username and password are required') };
      }

      const existing = await sql\`
        SELECT id, email, username 
        FROM profiles 
        WHERE email = \${cleanEmail} OR username = \${cleanUsername} 
        LIMIT 1
      \`;

      if (existing?.length) {
        return { data: null, error: new Error('Email or username already exists') };
      }

      const passwordHash = await hashPassword(cleanPassword);
      const newUserId = crypto.randomUUID();

      await sql\`
        INSERT INTO profiles (id, email, password_hash, username, full_name) 
        VALUES (\${newUserId}, \${cleanEmail}, \${passwordHash}, \${cleanUsername}, \${cleanUsername})
      \`;

      const nextUser = { id: newUserId, email: cleanEmail };
      const session = { user: nextUser };
      saveSession(session);
      setUser(nextUser);
      await fetchProfile(newUserId);

      return { data: { user: nextUser, session }, error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { data: null, error: err };
    }
  };

  const signIn = async (email, password) => {
    try {
      const cleanEmail = String(email || '').trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
      const cleanPassword = String(password || '');

      const data = await sql\`
        SELECT id, email, password_hash 
        FROM profiles 
        WHERE email = \${cleanEmail} 
        LIMIT 1
      \`;

      const profileRow = data?.[0];
      const passwordHash = await hashPassword(cleanPassword);

      if (!profileRow || profileRow.password_hash !== passwordHash) {
        return { data: null, error: new Error('Invalid email or password') };   
      }

      const nextUser = { id: profileRow.id, email: profileRow.email };
      const session = { user: nextUser };

      saveSession(session);
      setUser(nextUser);
      await fetchProfile(nextUser.id);

      return { data: { user: nextUser, session }, error: null };
    } catch (err) {
      console.error('Signin error:', err);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    clearSession();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
\`;

const dbCode = `import { sql, escapeIlike } from './neon';

// ============================================================
// MOVIES CACHE - Save/get movies from Neon cache
// ============================================================
export async function cacheMovie(movie) {
  try {
    const genres = movie.genres ? movie.genres.map((g) => g.name).join(', ') : '';
    await sql\`
      INSERT INTO movies (tmdb_id, title, poster_path, backdrop_path, overview, release_date, vote_average, genres)
      VALUES (\${movie.id}, \${movie.title}, \${movie.poster_path}, \${movie.backdrop_path}, \${movie.overview}, \${movie.release_date}, \${movie.vote_average}, \${genres})
      ON CONFLICT (tmdb_id) DO NOTHING
    \`;
  } catch (error) {
    console.error('Cache movie error:', error);
  }
}

// ============================================================
// USER MOVIES - Personal lists (watching, finished, wishlist)
// ============================================================
export async function setMovieStatus(userId, tmdbId, status, movieData) {       
  if (movieData) await cacheMovie(movieData);

  try {
    const data = await sql\`
      INSERT INTO user_movies (user_id, tmdb_id, status)
      VALUES (\${userId}, \${Number(tmdbId)}, \${status})
      ON CONFLICT (user_id, tmdb_id) DO UPDATE SET status = EXCLUDED.status
      RETURNING *
    \`;
    return { data, error: null };
  } catch (error) {
    console.error('Set movie status error:', error);
    return { data: null, error };
  }
}

export async function removeMovieStatus(userId, tmdbId) {
  try {
    await sql\`
      DELETE FROM user_movies WHERE user_id = \${userId} AND tmdb_id = \${Number(tmdbId)}
    \`;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getUserMovies(userId, status = null) {
  try {
    let userMovies = [];
    if (status) {
      userMovies = await sql\`
        SELECT * FROM user_movies 
        WHERE user_id = \${userId} AND status = \${status} 
        ORDER BY added_at DESC
      \`;
    } else {
      userMovies = await sql\`
        SELECT * FROM user_movies 
        WHERE user_id = \${userId} 
        ORDER BY added_at DESC
      \`;
    }

    if (!userMovies?.length) return [];

    const tmdbIds = [...new Set(userMovies.map((item) => item.tmdb_id).filter(Boolean))];
    
    // Pass as array
    const movies = await sql\`
      SELECT * FROM movies 
      WHERE tmdb_id = ANY (\${tmdbIds}::int[])
    \`;

    const movieMap = new Map((movies || []).map((m) => [m.tmdb_id, m]));        
    return userMovies.map((item) => ({ ...item, movies: movieMap.get(item.tmdb_id) || null }));
  } catch (error) {
    console.error('Get user movies error:', error);
    return [];
  }
}

export async function getMovieStatus(userId, tmdbId) {
  try {
    const data = await sql\`
      SELECT status FROM user_movies 
      WHERE user_id = \${userId} AND tmdb_id = \${Number(tmdbId)} 
      LIMIT 1
    \`;
    return data?.[0]?.status || null;
  } catch {
    return null;
  }
}

// ============================================================
// FRIENDSHIPS
// ============================================================
export async function sendFriendRequest(requesterId, addresseeId) {
  try {
    const data = await sql\`
      INSERT INTO friendships (requester_id, addressee_id, status)
      VALUES (\${requesterId}, \${addresseeId}, 'pending')
      RETURNING *
    \`;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function acceptFriendRequest(friendshipId) {
  try {
    const data = await sql\`
      UPDATE friendships SET status = 'accepted' WHERE id = \${friendshipId}
      RETURNING *
    \`;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function removeFriendship(friendshipId) {
  try {
    await sql\`
      DELETE FROM friendships WHERE id = \${friendshipId}
    \`;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getFriendships(userId) {
  try {
    const data = await sql\`
      SELECT id, requester_id, addressee_id, status, created_at FROM friendships WHERE requester_id = \${userId} OR addressee_id = \${userId}
    \`;
    return data || [];
  } catch (error) {
    console.error('Get friendships error:', error);
    return [];
  }
}

export async function searchUsers(query) {
  try {
    const safe = escapeIlike(query);
    if (!safe) return [];
    
    const likeVal = '%' + safe + '%';
    const data = await sql\`
      SELECT id, username, full_name, avatar_url, bio, created_at FROM profiles 
      WHERE username ILIKE \${likeVal} OR full_name ILIKE \${likeVal} 
      LIMIT 20
    \`;
    return data || [];
  } catch (error) {
    console.error('Search users error:', error);
    return [];
  }
}

export async function getAllUsers() {
  try {
    const data = await sql\`
      SELECT id, username, full_name, avatar_url, bio, created_at FROM profiles 
      ORDER BY created_at DESC 
      LIMIT 50
    \`;
    return data || [];
  } catch {
    return [];
  }
}
\`;

fs.writeFileSync('src/contexts/AuthContext.jsx', authCode);
fs.writeFileSync('src/services/database.js', dbCode);
console.log('Success');
