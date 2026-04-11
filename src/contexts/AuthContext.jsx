import React, { createContext, useContext, useState, useEffect } from 'react';
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
      const data = await sql`
        SELECT id, username, full_name, avatar_url, bio, created_at, email 
        FROM profiles 
        WHERE id = ${userId} 
        LIMIT 1
      `;
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

      const existing = await sql`
        SELECT id, email, username 
        FROM profiles 
        WHERE email = ${cleanEmail} OR username = ${cleanUsername} 
        LIMIT 1
      `;

      if (existing?.length) {
        return { data: null, error: new Error('Email or username already exists') };
      }

      const passwordHash = await hashPassword(cleanPassword);
      const newUserId = crypto.randomUUID();

      await sql`
        INSERT INTO profiles (id, email, password_hash, username, full_name) 
        VALUES (${newUserId}, ${cleanEmail}, ${passwordHash}, ${cleanUsername}, ${cleanUsername})
      `;

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

      const data = await sql`
        SELECT id, email, password_hash 
        FROM profiles 
        WHERE email = ${cleanEmail} 
        LIMIT 1
      `;

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