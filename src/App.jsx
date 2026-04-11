import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, User, Settings, Users, Film, LayoutList } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import MovieDetails from './pages/MovieDetails';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FriendsPage from './pages/FriendsPage';
import CollabListsPage from './pages/CollabListsPage';
import CollabListDetail from './pages/CollabListDetail';
import InteractiveBackground from './components/InteractiveBackground';

function Sidebar() {
  const location = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: LayoutList, label: 'Collab Lists', path: '/collab' },
  ];

  return (
    <aside className="w-64 backdrop-blur-3xl border-r h-screen fixed left-0 top-0 flex-col hidden md:flex z-50 shadow-[20px_0_40px_rgba(0,0,0,0.3)]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
        borderColor: 'var(--color-card-border)',
      }}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
          <Film className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>CineList</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-[0_0_25px_rgba(139,92,246,0.3)]'
                  : 'hover:bg-[var(--color-card)]'
              }`}
              style={!isActive ? { color: 'var(--color-text-muted)' } : {}}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mb-4">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold ${
            location.pathname.startsWith('/settings')
              ? 'bg-[var(--color-primary)] text-white shadow-[0_0_25px_rgba(139,92,246,0.3)]'
              : 'hover:bg-[var(--color-card)]'
          }`}
          style={!location.pathname.startsWith('/settings') ? { color: 'var(--color-text-muted)' } : {}}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

function Layout({ theme, setTheme }) {
  return (
    <div className="flex h-screen overflow-hidden font-sans relative" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <InteractiveBackground />
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 overflow-y-auto w-full relative z-10 no-scrollbar">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme} />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/collab" element={<CollabListsPage />} />
          <Route path="/collab/:id" element={<CollabListDetail />} />
          <Route path="*" element={<Navigate to="/profile" />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090b' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/profile" />} />
      <Route path="/*" element={user ? <Layout theme={theme} setTheme={setTheme} /> : <Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
