import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage({ theme, setTheme }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen relative z-10 px-10 py-16 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-10" style={{ color: 'var(--color-text)' }}>Settings</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <div
          className="backdrop-blur-2xl rounded-3xl p-8 overflow-hidden relative"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-card-border)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Theme</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                theme === 'dark'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-[var(--color-primary)]' : 'text-zinc-500'}`} />
              <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-500'}`}>Dark</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                theme === 'light'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-[var(--color-primary)]' : 'text-zinc-500'}`} />
              <span className={`font-bold text-sm ${theme === 'light' ? 'text-white' : 'text-zinc-500'}`}>Light</span>
            </button>
          </div>
        </div>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-card-border)',
            color: '#ef4444',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-card)';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
