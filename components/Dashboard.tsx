import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getNextLaunch } from '../services/spacex';
import { NextLaunchData } from '../types';
import { useTheme } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Cleaned up Dashboard
    const [nextLaunch, setNextLaunch] = useState<NextLaunchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

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
                <h2 className="text-3xl md:text-4xl text-white font-serif font-medium tracking-tight">Space Community Dashboard</h2>
            </div>
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
                {/* Hero Section */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Mission Live Card */}
                    <div className="relative w-full rounded-2xl overflow-hidden group min-h-[400px] flex flex-col justify-end p-8 border border-white/10 shadow-glow">
                        <div
                            className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
                            style={{
                                backgroundImage: theme === 'dark'
                                    ? 'linear-gradient(to top, rgba(17,17,23,0.95) 10%, rgba(17,17,23,0.3) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA2WBd-n8BMU51kzz_d9fMRAJjSxg0GPGELh8HhdROikAPdsDGoUaug7MdaO-h54zZmaiwfjLFES7EGkUgz3x5q1Ee5g5XBjvpU8ZF-kGzySwfdQjco2haJylJE-rgYQUcSXoKBqKDPd1GKBkqtysgx6NPX6y-GEQkKk3k8XZvCIh35axZIVALWxEF8JIjUU1E0d9BSpAionK0z682sF_Ezi4HvfxzGkPn8S9Z-fx_uLJHEhehamsB4Aufi7JOVHF0fcEegxBEKsOI")'
                                    : 'linear-gradient(to top, rgba(255,255,255,0.9) 10%, rgba(255,255,255,0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA2WBd-n8BMU51kzz_d9fMRAJjSxg0GPGELh8HhdROikAPdsDGoUaug7MdaO-h54zZmaiwfjLFES7EGkUgz3x5q1Ee5g5XBjvpU8ZF-kGzySwfdQjco2haJylJE-rgYQUcSXoKBqKDPd1GKBkqtysgx6NPX6y-GEQkKk3k8XZvCIh35axZIVALWxEF8JIjUU1E0d9BSpAionK0z682sF_Ezi4HvfxzGkPn8S9Z-fx_uLJHEhehamsB4Aufi7JOVHF0fcEegxBEKsOI")',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        ></div>

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

            {/* Platform Features Section */}
            <div className="py-16 md:py-20 border-t border-white/5">
                <h2 className="text-3xl md:text-4xl font-serif text-white text-center mb-12">Funcionalidades de la Plataforma</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div
                        onClick={() => navigate('/launches')}
                        className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-4xl text-primary mb-6 group-hover:scale-110 transition-transform block w-fit">rocket_launch</span>
                        <h3 className="text-xl font-bold text-white mb-3">Datos en Tiempo Real</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Accede a información actualizada de lanzamientos, cohetes y misiones de SpaceX</p>
                    </div>

                    <div
                        onClick={() => navigate('/community')}
                        className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-4xl text-blue-400 mb-6 group-hover:scale-110 transition-transform block w-fit">forum</span>
                        <h3 className="text-xl font-bold text-white mb-3">Foro de Comunidad</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Participa en discusiones con otros entusiastas del espacio</p>
                    </div>

                    <div
                        onClick={() => navigate('/profile')}
                        className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-4xl text-purple-400 mb-6 group-hover:scale-110 transition-transform block w-fit">groups</span>
                        <h3 className="text-xl font-bold text-white mb-3">Red Social</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Conecta con otros miembros, haz amigos y comparte tu pasión</p>
                    </div>

                    <div
                        onClick={() => navigate('/statistics')}
                        className="bg-surface-dark p-8 rounded-2xl border border-white/5 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-4xl text-[#0bda50] mb-6 group-hover:scale-110 transition-transform block w-fit">monitoring</span>
                        <h3 className="text-xl font-bold text-white mb-3">Estadísticas</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Visualiza datos y gráficos sobre el rendimiento de SpaceX</p>
                    </div>
                </div>
            </div>

            {/* About SpaceX Section */}
            <div className="py-16 md:py-24 bg-surface-dark -mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10 border-y border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-serif text-white mb-12">Acerca de SpaceX</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="p-6">
                            <p className="text-4xl md:text-5xl font-bold text-primary mb-2">9500</p>
                            <p className="text-slate-400 dark:text-slate-500 uppercase tracking-widest text-sm">Empleados</p>
                        </div>
                        <div className="p-6 relative md:after:content-[''] md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:h-12 md:after:w-px md:after:bg-black/10 md:dark:after:bg-white/10 md:before:content-[''] md:before:absolute md:before:left-0 md:before:top-1/2 md:before:-translate-y-1/2 md:before:h-12 md:before:w-px md:before:bg-black/10 md:dark:before:bg-white/10">
                            <p className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">4</p>
                            <p className="text-slate-400 dark:text-slate-500 uppercase tracking-widest text-sm">Vehículos</p>
                        </div>
                        <div className="p-6">
                            <p className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">3</p>
                            <p className="text-slate-400 dark:text-slate-500 uppercase tracking-widest text-sm">Sitios de Lanzamiento</p>
                        </div>
                    </div>

                    <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto font-light">
                        SpaceX designs, manufactures and launches advanced rockets and spacecraft. The company was founded in 2002 to revolutionize space technology, with the ultimate goal of enabling people to live on other planets.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            </div>

            {/* Community CTA Section */}
            <div className="pt-16 md:pt-20">
                <div className="rounded-3xl relative overflow-hidden p-8 md:p-16 text-center shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] transition-all duration-700 group-hover:scale-105"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-serif font-bold !text-white mb-6">Únete a la Comunidad</h2>
                        <p className="text-indigo-100 text-lg mb-10 leading-relaxed !text-white/90">
                            Conecta con miles de entusiastas del espacio, participa en discusiones y mantente actualizado con cada misión de SpaceX.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => navigate('/community')} className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                                Explorar el Foro
                            </button>
                            <button onClick={() => navigate('/community')} className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/25">
                                Ver Comunidad
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
