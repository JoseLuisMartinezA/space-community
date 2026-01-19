import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getNextLaunch } from '../services/spacex';
import { NextLaunchData } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
    const { theme, toggleTheme } = useTheme();
    const [nextLaunch, setNextLaunch] = useState<NextLaunchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getNextLaunch();
                setNextLaunch(data);
            } catch (error) {
                console.error("Error cargando lanzamiento:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!nextLaunch) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const launchDate = new Date(nextLaunch.date_utc).getTime();
            const distance = launchDate - now;

            if (distance < 0) {
                setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
            } else {
                setCountdown({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    secs: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextLaunch]);

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
            navigate('/profile'); // In a real app, maybe navigate to specific chat
        } else if (notif.type === 'friend_request' || notif.type === 'request_accepted') {
            navigate('/profile');
        }
    };

    // Format Date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-4 md:p-8 lg:p-10 pb-20 md:pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl md:text-4xl text-white font-serif font-medium tracking-tight">Control de Misión</h2>
                <div className="flex items-center gap-4 relative" ref={notificationRef}>
                    {/* Notification Button */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative size-10 rounded-full border transition-all flex items-center justify-center ${showNotifications ? 'bg-primary border-primary text-background-dark shadow-glow' : 'bg-surface-dark border-white/5 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                        <span className="material-symbols-outlined">notifications</span>
                        {unreadCount > 0 && (
                            <div className="absolute top-0 right-0 size-3 bg-red-500 rounded-full border-2 border-surface-dark"></div>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-80 bg-surface-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">
                                        Limpiar Todo
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

                    {/* Settings Button */}
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`size-10 rounded-full border transition-all flex items-center justify-center ${showSettings ? 'bg-primary border-primary text-background-dark shadow-glow' : 'bg-surface-dark border-white/5 text-slate-400 hover:text-white hover:border-white/20'}`}
                        >
                            <span className="material-symbols-outlined">settings</span>
                        </button>

                        {/* Settings Dropdown */}
                        {showSettings && (
                            <div className="absolute top-12 right-0 w-72 bg-surface-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-glow-lg z-50 overflow-hidden animate-slideUp">
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

                                    {/* Notifications Settings */}
                                    <button
                                        className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left"
                                        onClick={() => {
                                            setShowSettings(false);
                                            navigate('/profile');
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-slate-400">notifications</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">Notificaciones</p>
                                            <p className="text-xs text-slate-400">Gestionar preferencias</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-600 text-[18px]">chevron_right</span>
                                    </button>

                                    {/* Language */}
                                    <button className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left">
                                        <span className="material-symbols-outlined text-slate-400">language</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">Idioma</p>
                                            <p className="text-xs text-slate-400">Español</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-600 text-[18px]">chevron_right</span>
                                    </button>

                                    {/* Privacy */}
                                    <button className="w-full p-3 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3 text-left">
                                        <span className="material-symbols-outlined text-slate-400">shield</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">Privacidad</p>
                                            <p className="text-xs text-slate-400">Seguridad y datos</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-600 text-[18px]">chevron_right</span>
                                    </button>

                                    <div className="border-t border-white/5 my-2"></div>

                                    {/* Account Settings */}
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

                                    {/* Help */}
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
                                    <p className="text-xs text-slate-500">SpaceX Community v2.0.1</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
                {/* Hero Section */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Mission Live Card */}
                    <div className="relative w-full rounded-2xl overflow-hidden group min-h-[400px] flex flex-col justify-end p-8 border border-white/10 shadow-glow">
                        <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'linear-gradient(to top, rgba(17,17,23,0.95) 10%, rgba(17,17,23,0.3) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA2WBd-n8BMU51kzz_d9fMRAJjSxg0GPGELh8HhdROikAPdsDGoUaug7MdaO-h54zZmaiwfjLFES7EGkUgz3x5q1Ee5g5XBjvpU8ZF-kGzySwfdQjco2haJylJE-rgYQUcSXoKBqKDPd1GKBkqtysgx6NPX6y-GEQkKk3k8XZvCIh35axZIVALWxEF8JIjUU1E0d9BSpAionK0z682sF_Ezi4HvfxzGkPn8S9Z-fx_uLJHEhehamsB4Aufi7JOVHF0fcEegxBEKsOI")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>

                        {loading ? (
                            <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[300px]">
                                <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                <span className="mt-2 text-primary font-mono text-sm">Estableciendo enlace...</span>
                            </div>
                        ) : nextLaunch ? (
                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0bda50]/20 border border-[#0bda50]/40 text-[#0bda50] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                        <span className="size-2 rounded-full bg-[#0bda50] live-dot"></span>
                                        Próximo Lanzamiento
                                    </span>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-slate-300 text-sm font-medium">Fecha Programada (Local)</p>
                                        <p className="text-white font-mono text-sm">{formatDate(nextLaunch.date_utc)}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">Misión {nextLaunch.flight_number}</h3>
                                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">{nextLaunch.name}</h1>
                                    <p className="text-primary text-lg mt-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                        {nextLaunch.rocketData?.name || "Cohete Desconocido"}
                                        <span className="w-1 h-1 rounded-full bg-slate-500 mx-1"></span>
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        {nextLaunch.launchpadData?.name || "Plataforma Desconocida"}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[70px]">
                                        <span className="text-2xl font-bold text-white font-mono">{String(countdown.days).padStart(2, '0')}</span>
                                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Días</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[70px]">
                                        <span className="text-2xl font-bold text-white font-mono">{String(countdown.hours).padStart(2, '0')}</span>
                                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Hrs</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[70px]">
                                        <span className="text-2xl font-bold text-white font-mono">{String(countdown.mins).padStart(2, '0')}</span>
                                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Mins</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[70px]">
                                        <span className="text-2xl font-bold text-primary font-mono animate-pulse">{String(countdown.secs).padStart(2, '0')}</span>
                                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Segs</span>
                                    </div>
                                    <button onClick={() => navigate('/milestones')} className="ml-auto mt-auto flex items-center justify-center h-12 px-6 rounded-lg bg-primary hover:bg-primary/90 text-background-dark font-bold text-sm tracking-wide transition-colors">
                                        Ver Historial
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[300px]">
                                <span className="text-slate-400">No hay datos de lanzamiento disponibles.</span>
                            </div>
                        )}
                    </div>
                    {/* Data Visualizations Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Raptor Production */}
                        <div className="bg-surface-dark border border-white/5 rounded-xl p-5 flex flex-col justify-between hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-slate-400 text-sm font-medium">Producción Raptor</h4>
                                <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">precision_manufacturing</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative size-16">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                                        <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="78, 100" strokeLinecap="round" strokeWidth="4"></path>
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">78%</div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">32<span className="text-sm text-slate-500 font-normal ml-1">unids</span></p>
                                    <p className="text-xs text-[#0bda50] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">trending_up</span> +12% vs Objetivo
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Orbit Density Sparkline */}
                        <div className="bg-surface-dark border border-white/5 rounded-xl p-5 flex flex-col hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-slate-400 text-sm font-medium">Densidad Orbital</h4>
                                <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">satellite_alt</span>
                            </div>
                            <p className="text-2xl font-bold text-white mb-4">2,500 <span className="text-sm font-normal text-slate-500">Activos</span></p>
                            <div className="h-10 w-full mt-auto flex items-end gap-1">
                                <div className="w-1/6 bg-white/10 h-[40%] rounded-t-sm"></div>
                                <div className="w-1/6 bg-white/10 h-[50%] rounded-t-sm"></div>
                                <div className="w-1/6 bg-white/20 h-[45%] rounded-t-sm"></div>
                                <div className="w-1/6 bg-white/20 h-[60%] rounded-t-sm"></div>
                                <div className="w-1/6 bg-primary/60 h-[75%] rounded-t-sm"></div>
                                <div className="w-1/6 bg-primary h-[90%] rounded-t-sm animate-pulse"></div>
                            </div>
                        </div>
                        {/* Fleet Status */}
                        <div className="bg-surface-dark border border-white/5 rounded-xl p-5 flex flex-col hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-slate-400 text-sm font-medium">Estado de Flota</h4>
                                <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">rocket</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white">Falcon 9</span>
                                    <span className="text-[#0bda50] font-bold bg-[#0bda50]/10 px-2 py-0.5 rounded">12 Listos</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                    <div className="bg-[#0bda50] h-1.5 rounded-full" style={{ width: '90%' }}></div>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-2">
                                    <span className="text-white">Starship</span>
                                    <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">Pruebas</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Side Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Community Pulse */}
                    <div className="bg-surface-dark border border-white/5 rounded-xl p-6 flex flex-col h-full relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-serif font-bold text-white">Pulso Comunitario</h3>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-bold uppercase tracking-wider">En Vivo</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* Topic 1 */}
                            <div onClick={() => navigate('/community')} className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5 group">
                                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">keyboard_arrow_up</span>
                                    <span className="text-sm font-bold text-white">245</span>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-medium text-sm leading-tight group-hover:text-primary transition-colors">Análisis de Fuego Estático Booster 9: Desglose Detallado</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="size-5 rounded-full bg-slate-600 bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB2B2htDQVsMEGBlmfihKgiDJMeUJ32TvWHqZ6R9t0I2ZvEjmG1JDs1U8EaY3geMpe9CBS1MfF35Fwid_3Q3t9ULuzKNwp6_BNZFlfqFGZ5qvWRYf6bx3-SbAoBenIIzovWyLOY50iRNi_cbnp1iPLpw3LsetPqbFd0gJV4sUiWDL4zI8jDBK1z8dZUUhaZFe6TK3TXgOTNQL6FptSpJu3uoYcS_ok0xTgj3_NqFZhhZnsLtqlluM1WnsFHvd6jQNfYxBoCOzcpj1w")' }}></div>
                                        <span className="text-xs text-slate-400">@RocketFan99 • hace 2h</span>
                                    </div>
                                </div>
                            </div>
                            {/* Topic 2 */}
                            <div onClick={() => navigate('/community')} className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5 group">
                                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">keyboard_arrow_up</span>
                                    <span className="text-sm font-bold text-white">182</span>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-medium text-sm leading-tight group-hover:text-primary transition-colors">Actualizaciones de Starbase - Nuevos segmentos de torre avistados</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="size-5 rounded-full bg-slate-600 bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCIUeU7zPkUaELKNHaTt6utoBB5MeZu2cJ-t7A-nDUvoeERRGzXFTpdFxBeAKdaWbL9f-icdtxOWgrEITgLB_C7Cl9kzsCwyHPPg2hRCQJ0PATuXQ59QE7JLcsu18biEyBCirr5zoIeRTMoRpcBbmc54ir7UD0aKW37VGCDUL3SZGTryhPXcnrDE9qdsqjS2QJA6XcxzUuAWmWhJQgTgKEfeNkyDnST-2WdKjYw7IS5WJ5_k_airfCTxUqAoz3Nbm8ZoCoPK0eCNBQ")' }}></div>
                                        <span className="text-xs text-slate-400">@StarWatcher • hace 4h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Newcomers Pad */}
                        <div className="mt-auto pt-6">
                            <div onClick={() => navigate('/community')} className="rounded-xl bg-gradient-to-r from-yellow-900/40 to-yellow-600/10 border border-yellow-500/30 p-4 relative overflow-hidden group cursor-pointer hover:border-yellow-500/60 transition-colors">
                                <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <span className="material-symbols-outlined text-4xl text-yellow-500">waving_hand</span>
                                </div>
                                <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-wide mb-1">Pad de Novatos</h4>
                                <p className="text-white text-sm font-medium pr-8">Bienvenido a Marte: Guía Intro y Preguntas Frecuentes</p>
                                <div className="mt-3 flex items-center text-xs text-yellow-500 font-bold group-hover:underline">
                                    Comienza Aquí <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Telemetry Data Section (Bottom) */}
            <div className="pb-10">
                <h3 className="text-white font-serif text-2xl font-medium mb-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    Telemetría en Vivo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface-dark border border-white/5 rounded-lg p-4">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Presión Atmosférica</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">101.3 <span className="text-sm text-slate-500 font-normal">kPa</span></p>
                            <span className="text-xs text-slate-500 mb-1">Nominal</span>
                        </div>
                    </div>
                    <div className="bg-surface-dark border border-white/5 rounded-lg p-4">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Velocidad del Viento (KSC)</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">12 <span className="text-sm text-slate-500 font-normal">nudos</span></p>
                            <span className="text-xs text-[#0bda50] mb-1">Dentro de Límites</span>
                        </div>
                    </div>
                    <div className="bg-surface-dark border border-white/5 rounded-lg p-4">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Temp Propulsor (LOX)</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">-207 <span className="text-sm text-slate-500 font-normal">°C</span></p>
                            <span className="text-xs text-blue-400 mb-1">Enfriando</span>
                        </div>
                    </div>
                    <div className="bg-surface-dark border border-white/5 rounded-lg p-4">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Barco de Recuperación</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-white">ASOG <span className="text-sm text-slate-500 font-normal">Dron</span></p>
                            <span className="text-xs text-[#0bda50] mb-1">En Estación</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
