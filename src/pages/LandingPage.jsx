import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Film, AlertCircle } from 'lucide-react';
import InteractiveBackground from '../components/InteractiveBackground';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = String(email || '').trim().replace(/^['\"]+|['\"]+$/g, '').toLowerCase();
    const cleanPassword = String(password || '');
    const cleanUsername = String(username || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
      if (!emailPattern.test(cleanEmail)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(cleanEmail, cleanPassword);
        if (error) throw error;
        navigate('/profile');
      } else {
        if (!cleanUsername) { setError('Username is required'); setLoading(false); return; }
        const { data, error } = await signUp(cleanEmail, cleanPassword, cleanUsername);
        if (error) throw error;

        if (data?.user) {
          navigate('/profile');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-background)] flex items-center justify-center overflow-hidden">
      <InteractiveBackground />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md p-10 bg-white/[0.04] backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">CineList</h1>
        </div>

        <div className="flex bg-white/[0.04] rounded-xl p-1 mb-8 border border-white/[0.06]">
          <button onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer ${isLogin ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Login
          </button>
          <button onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer ${!isLogin ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Sign Up
          </button>
        </div>

        {error && (
          <div className={`flex items-start gap-2 mb-4 p-3 rounded-xl border text-sm ${
            error.includes('created') 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                placeholder="cinephile42" />
            </motion.div>
          )}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-xl shadow-purple-600/20 transition-all duration-300 active:scale-[0.97] cursor-pointer disabled:opacity-50">
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-zinc-600">
          By continuing, you agree to CineList's Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}
