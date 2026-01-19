import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const NavLink = ({ to, icon, label, active }: { to: string; icon: string; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${active
      ? 'bg-primary/10 border border-primary/20 shadow-glow text-white'
      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
  >
    <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${active ? 'text-primary' : ''}`}>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-dark text-white">
      {/* SideNavBar - Desktop */}
      <div className="hidden md:flex w-72 flex-col justify-between border-r border-white/5 bg-surface-dark p-6 overflow-y-auto z-20">
        <div className="flex flex-col gap-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 px-2 group">
            <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary/20 transition-all group-hover:border-primary/50 group-hover:shadow-glow" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCjEPOcV_DT4KdHyDPaMM9ZGScxw2lrpHImi6Y2XBW9kpGT3XxJifqS5Wst3-j8HozLCc-t3VxqUGoQzbDxnBiELnNAP_YrnL1cd7_GGZNJDUJ4NYEkpTjNFg7XbIoFwwhavVBQA9YPtvmus1nnE0UvSkRcR5dLRPTzxjbd-X9UE8xNm096AxHNN9xXDVSfAdlPxgIZc1HjoWKAmWV_XVfAQab9SFkKXzJNxokGkBk1fWfAorW3kdM17e-xFrMLoh1b_LW2U7az9-U")' }}></div>
            <div className="flex flex-col">
              <h1 className="text-white text-lg font-serif font-bold leading-tight">SpaceX Community</h1>
              <p className="text-primary text-xs font-medium tracking-wider uppercase opacity-80">Control de Misión</p>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            <NavLink to="/" icon="dashboard" label="Panel" active={location.pathname === '/'} />
            <NavLink to="/community" icon="groups" label="Comunidad" active={location.pathname === '/community'} />
            <NavLink to="/milestones" icon="rocket_launch" label="Historial" active={location.pathname === '/milestones'} />
            <NavLink to="/analysis" icon="document_scanner" label="Análisis IA" active={location.pathname === '/analysis'} />
          </div>

          {/* Quick Stats in Nav */}
          <div className="flex flex-col gap-4 mt-4 px-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estado de Red</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Actividad Starlink</span>
              <span className="text-xs font-bold text-[#0bda50]">99.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Usuarios Activos</span>
              <span className="text-xs font-bold text-white">14.2k</span>
            </div>
          </div>
        </div>

        {/* User/Settings Footer */}
        <div className="border-t border-white/10 pt-6 mt-4 flex flex-col gap-4">

          <Link to="/profile" className={`flex items-center gap-3 px-2 group cursor-pointer p-2 rounded-lg transition-all ${location.pathname === '/profile' ? 'bg-white/5' : 'hover:bg-white/5'}`}>
            <div className="size-8 rounded-full bg-slate-700 p-0.5 border border-primary/50 overflow-hidden relative">
              <img src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDhf0khbsYWHTkrFpFeDdlBNRfi37lS3Fi1BS3KPpqWJmuvr7rCac8ckcnuFkwGSbBo2Yk9UM_hOu1VqaOrIZtu2nV2VlDuCvo8wQRWEbTEoIMGpMwNlG5fFqIFcXgAss07QHxzTb1_286vyYamLpBzX94LVgzSJuM8KDe_zeH3zrjfYhw9xFlasibj89ITOeWuJIN-b6GUjkaqIhhUXOb7eGI5iE5LkhZXi2fDP3558Lbz7Ng1CwSYKVRb4idD1NAqjN6EGFybpRs"} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className={`text-sm font-medium transition-colors truncate ${location.pathname === '/profile' ? 'text-primary' : 'text-white group-hover:text-primary'}`}>{user?.name || "Visitante"}</span>
              <span className="text-xs text-slate-500 truncate">{user?.role || "Sin Rango"}</span>
            </div>
          </Link>

          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background-dark relative">
        {children}
      </main>

      {/* Mobile Nav (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-dark border-t border-white/10 flex items-center justify-around z-50 px-2">
        <Link to="/" className={`p-2 rounded-full ${location.pathname === '/' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">dashboard</span>
        </Link>
        <Link to="/community" className={`p-2 rounded-full ${location.pathname === '/community' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">groups</span>
        </Link>
        <Link to="/profile" className="relative p-2 rounded-full text-slate-400 h-10 w-10 flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 size-3 bg-red-500 rounded-full border-2 border-surface-dark"></div>
          )}
        </Link>
        <Link to="/analysis" className={`p-2 rounded-full ${location.pathname === '/analysis' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">document_scanner</span>
        </Link>
        <Link to="/profile" className={`p-2 rounded-full ${location.pathname === '/profile' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">person</span>
        </Link>
      </div>
    </div>
  );
};
