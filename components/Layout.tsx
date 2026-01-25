import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const NavItem: React.FC<{ to: string; icon: string; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 group relative ${active
      ? 'text-primary bg-primary/10 dark:text-white dark:bg-white/10 shadow-glow'
      : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
      }`}
  >
    <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>{icon}</span>
    <span className="text-sm font-medium hidden lg:block">{label}</span>
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#00d6cf]"></div>}
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, clearAllNotifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'ahora';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    setShowNotifications(false);
    // Navigate based on type
    if (notif.type === 'message') {
      navigate('/chat');
    } else if (notif.type === 'friend_request' || notif.type === 'request_accepted') {
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', icon: 'dashboard', label: 'Inicio' },
    { to: '/launches', icon: 'rocket_launch', label: 'Lanzamientos' },
    { to: '/rockets', icon: 'flight_takeoff', label: 'Cohetes' },
    { to: '/statistics', icon: 'analytics', label: 'Estadísticas' },
    { to: '/community', icon: 'forum', label: 'Comunidad' },
    { to: '/chat', icon: 'chat', label: 'Chat' },
    { to: '/profile', icon: 'person', label: 'Perfil' },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background-dark text-white overflow-hidden font-display relative selection:bg-primary/30">

      {/* Top Navigation Bar - Hidden on Mobile */}
      <header className="hidden md:flex h-16 border-b border-white/5 bg-surface-dark/80 backdrop-blur-md items-center justify-between px-4 lg:px-8 z-50 fixed top-0 left-0 right-0 shadow-lg shadow-black/20">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group h-full overflow-hidden py-1">
          <img
            src="/isotipo.png"
            alt="Space Community Icon"
            className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-110 dark:brightness-100 brightness-0"
          />
          <img
            src="/logotipo.png"
            alt="Space Community Logo"
            className="h-6 w-auto object-contain hidden lg:block transition-all dark:brightness-100 brightness-0"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="flex items-center gap-1 bg-surface-darker/50 p-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          {navLinks.map((link, index) => (
            <NavItem
              key={index}
              to={link.to}
              icon={link.icon}
              label={link.label}
              active={location.pathname === link.to}
            />
          ))}
        </nav>

        {/* User / Actions (Desktop) */}
        <div className="flex items-center gap-4">

          {/* Notification Button (Desktop) */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-surface-dark"></span>}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-10 right-0 w-80 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Notificaciones</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearAllNotifications} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">
                      Borrar Todo
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl opacity-20">notifications_off</span>
                      <p className="text-sm">No hay actividad reciente</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="relative shrink-0">
                          <img src={notif.source_avatar} className="size-10 rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-xs font-bold text-white truncate pr-2">{notif.title}</p>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">{getRelativeTime(notif.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{notif.content}</p>
                        </div>
                        {!notif.is_read && <div className="size-2 rounded-full bg-primary mt-1 shrink-0"></div>}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 bg-black/20 text-center">
                  <Link to="/profile" onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-tighter">Ver Perfil Completo</Link>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button (Desktop) */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`relative p-2 rounded-full transition-colors ${showSettings ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute top-10 right-0 w-64 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
                <div className="p-3 border-b border-white/5 bg-white/5">
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Ajustes de Sistema
                  </h3>
                </div>

                <div className="p-1.5">
                  {/* Theme Toggle */}
                  <div className="p-2.5 hover:bg-white/5 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white">Tema</p>
                          <p className="text-[10px] text-slate-400">
                            {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className={`relative w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Account / Profile Links */}
                  <div className="border-t border-white/5 my-1.5"></div>

                  <Link
                    to="/profile"
                    onClick={() => setShowSettings(false)}
                    className="w-full p-2.5 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left group"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">person_filled</span>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-tighter">Mi Perfil</p>
                    </div>
                  </Link>

                  {/* Other Settings Links */}
                  {[
                    { icon: 'notifications', label: 'Notificaciones', sub: 'Preferencias' },
                    { icon: 'shield', label: 'Seguridad', sub: 'Cifrado' }
                  ].map((item, idx) => (
                    <button key={idx} className="w-full p-2.5 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left text-slate-300">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.sub}</p>
                      </div>
                    </button>
                  ))}

                  <div className="border-t border-white/5 my-1.5"></div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full p-2.5 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 text-left group"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-red-500 transition-colors text-[20px]">logout</span>
                    <span className="text-xs font-bold text-white group-hover:text-red-500">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Direct Link (Desktop) */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10 relative">
            <div className="text-right hidden lg:block">
              <div className="text-sm font-bold text-white leading-none">{user?.name || 'Invitado'}</div>
              <div className="text-[10px] text-primary">{user?.handle || '@usuario'}</div>
            </div>

            <Link
              to="/profile"
              className="size-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden hover:border-primary transition-all shadow-glow-sm"
              title="Ir a mi perfil"
            >
              <img src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDhf0khbsYWHTkrFpFeDdlBNRfi37lS3Fi1BS3KPpqWJmuvr7rCac8ckcnuFkwGSbBo2Yk9UM_hOu1VqaOrIZtu2nV2VlDuCvo8wQRWEbTEoIMGpMwNlG5fFqIFcXgAss07QHxzTb1_286vyYamLpBzX94LVgzSJuM8KDe_zeH3zrjfYhw9xFlasibj89ITOeWuJIN-b6GUjkaqIhhUXOb7eGI5iE5LkhZXi2fDP3558Lbz7Ng1CwSYKVRb4idD1NAqjN6EGFybpRs"} className="w-full h-full object-cover" />
            </Link>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-dark border-t border-white/10 flex items-center z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] safe-area-bottom">
        {/* Scrollable Main Links */}
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide px-4 gap-8">
          {navLinks.slice(0, -1).map((link, index) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={index}
                to={link.to}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 shrink-0 min-w-[60px] ${isActive ? 'text-primary' : 'text-slate-400'}`}
              >
                <span className="material-symbols-outlined text-[24px]">{link.icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-tighter">{link.label}</span>
                {isActive && <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#00d6cf]"></div>}
              </Link>
            );
          })}
        </div>

        {/* Fixed Profile Link */}
        <div className="h-full flex items-center px-4 bg-surface-dark border-l border-white/10 shadow-[-10px_0_20px_rgba(0,0,0,0.3)]">
          {navLinks.slice(-1).map((link, index) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={index}
                to={link.to}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-slate-400'}`}
              >
                <span className="material-symbols-outlined text-[24px]">{link.icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-tighter">{link.label}</span>
                {isActive && <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#00d6cf]"></div>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-transparent relative pt-0 md:pt-16 pb-20 md:pb-0 scrollbar-hide z-0">
        {children}
      </main>

    </div>
  );
};
