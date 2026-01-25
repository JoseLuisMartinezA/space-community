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
    { to: '/community', icon: 'search', label: 'Buscador' }, // Combined conceptual link
    { to: '/community', icon: 'forum', label: 'Comunidad' },
    { to: '/chat', icon: 'chat', label: 'Chat' },
    { to: '/profile', icon: 'person', label: 'Perfil' },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background-dark text-white overflow-hidden font-display relative selection:bg-primary/30">

      {/* Top Navigation Bar */}
      <header className="h-24 border-b border-white/5 bg-surface-dark/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-50 fixed top-0 left-0 right-0 shadow-lg shadow-black/20">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group h-full overflow-hidden py-2">
          <img
            src="/isotipo.png"
            alt="Space Community Icon"
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110 dark:brightness-100 brightness-0"
          />
          <img
            src="/logotipo.png"
            alt="Space Community Logo"
            className="h-8 w-auto object-contain hidden lg:block transition-all dark:brightness-100 brightness-0"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-darker/50 p-1.5 rounded-full border border-white/5 backdrop-blur-sm">
          {navLinks.map((link, index) => (
            <NavItem
              key={index}
              to={link.to}
              icon={link.icon}
              label={link.label}
              active={location.pathname === link.to && link.label !== 'Buscador'} // Simple active check logic
            />
          ))}
        </nav>

        {/* User / Actions */}
        <div className="flex items-center gap-4">
          {/* Notification Button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-surface-dark"></span>}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
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
                          <div className={`absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border border-surface-dark ${notif.type === 'message' ? 'bg-blue-500' :
                            notif.type === 'friend_request' ? 'bg-primary' : 'bg-emerald-500'
                            }`}>
                            <span className="material-symbols-outlined text-[12px] text-white">
                              {notif.type === 'message' ? 'chat' :
                                notif.type === 'friend_request' ? 'person_add' : 'check'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
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
                  <Link to="/profile" onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-white transition-colors">Ver todo mi perfil</Link>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`relative p-2 rounded-full transition-colors ${showSettings ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute top-12 right-0 w-72 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    Ajustes
                  </h3>
                </div>

                <div className="p-2">
                  {/* Theme Toggle */}
                  <div className="p-3 hover:bg-white/5 rounded-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">
                          {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">Tema</p>
                          <p className="text-xs text-slate-400">
                            {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-600'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Other Settings Links */}
                  {[
                    { icon: 'notifications', label: 'Notificaciones', sub: 'Gestionar preferencias' },
                    { icon: 'language', label: 'Idioma', sub: 'Español' },
                    { icon: 'shield', label: 'Privacidad', sub: 'Seguridad y datos' }
                  ].map((item, idx) => (
                    <button key={idx} className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left">
                      <span className="material-symbols-outlined text-slate-400">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.sub}</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-600 text-[18px]">chevron_right</span>
                    </button>
                  ))}

                  <div className="border-t border-white/5 my-2"></div>

                  <button
                    className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left"
                    onClick={() => {
                      setShowSettings(false);
                      navigate('/profile');
                    }}
                  >
                    <span className="material-symbols-outlined text-slate-400">person</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Mi Cuenta</p>
                      <p className="text-xs text-slate-400">Perfil y configuración</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-[18px]">chevron_right</span>
                  </button>

                  <button className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left">
                    <span className="material-symbols-outlined text-slate-400">help</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Ayuda y Soporte</p>
                      <p className="text-xs text-slate-400">Centro de ayuda</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-[18px]">chevron_right</span>
                  </button>
                </div>

                <div className="p-3 bg-black/20 text-center border-t border-white/5">
                  <p className="text-xs text-slate-500">Space Community v2.0.1</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown Trigger */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10 relative" ref={profileRef}>
            <div className="text-right hidden lg:block">
              <div className="text-sm font-bold text-white leading-none">{user?.name || 'Invitado'}</div>
              <div className="text-[10px] text-primary">{user?.handle || '@usuario'}</div>
            </div>
            <div
              className={`size-9 rounded-full bg-slate-800 border overflow-hidden ring-2 ring-transparent transition-all cursor-pointer ${showProfileMenu ? 'border-primary ring-primary/30' : 'border-white/10 hover:border-white/30'}`}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Mi Cuenta"
            >
              <img src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDhf0khbsYWHTkrFpFeDdlBNRfi37lS3Fi1BS3KPpqWJmuvr7rCac8ckcnuFkwGSbBo2Yk9UM_hOu1VqaOrIZtu2nV2VlDuCvo8wQRWEbTEoIMGpMwNlG5fFqIFcXgAss07QHxzTb1_286vyYamLpBzX94LVgzSJuM8KDe_zeH3zrjfYhw9xFlasibj89ITOeWuJIN-b6GUjkaqIhhUXOb7eGI5iE5LkhZXi2fDP3558Lbz7Ng1CwSYKVRb4idD1NAqjN6EGFybpRs"} className="w-full h-full object-cover" />
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute top-12 right-0 w-48 bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
                <div className="p-2">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left group"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">person</span>
                    <span className="text-sm font-medium text-white">Mi Perfil</span>
                  </Link>
                  <div className="border-t border-white/5 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full p-3 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 text-left group"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-red-500 transition-colors">logout</span>
                    <span className="text-sm font-medium text-white group-hover:text-red-500 transition-colors">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background-dark/95 backdrop-blur-xl pt-24 px-6 md:hidden animate-slideUp">
          <div className="flex flex-col gap-4">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-white/5 text-slate-300 hover:bg-white/5 hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span className="text-lg font-medium">{link.label}</span>
              </Link>
            ))}
            <button onClick={handleLogout} className="mt-8 w-full py-4 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-transparent relative pt-24 scrollbar-hide z-0">
        {children}
      </main>

    </div>
  );
};
