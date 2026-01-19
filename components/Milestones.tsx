import React, { useEffect, useState } from 'react';
import { getPastLaunches } from '../services/spacex';
import { SpaceXLaunch } from '../types';

const CoinStack = ({ color, count, label }: { color: string; count: number; label: string }) => {
    const coins = Array.from({ length: count });
    return (
            <div className="flex flex-col items-center gap-2 w-24 group coin-stack-container">
            <div className="relative w-16 h-48">
                <div className="absolute bottom-0 w-full flex flex-col-reverse justify-start items-center gap-[2px]">
                    {coins.map((_, i) => (
                        <div key={i} className={`w-16 h-3 rounded-full border shadow-lg ${color} ${i > count - 4 ? 'z-' + (10 * (count-i)) : ''} `}></div>
                    ))}
                </div>
            </div>
            <span className={`text-xs font-mono ${label === 'F9' ? 'text-primary font-bold' : 'text-slate-500'}`}>{label}</span>
        </div>
    );
};

const Milestones: React.FC = () => {
    const [launches, setLaunches] = useState<SpaceXLaunch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLaunches = async () => {
            const data = await getPastLaunches(10);
            setLaunches(data);
            setLoading(false);
        };
        fetchLaunches();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
             year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getLaunchImage = (launch: SpaceXLaunch) => {
        // Prefer Flickr original, then small patch, then fallback to generic placeholder
        if (launch.links.flickr.original.length > 0) return launch.links.flickr.original[0];
        // Generic fallback images based on rocket type if possible, or just a default
        return "https://lh3.googleusercontent.com/aida-public/AB6AXuA2vvDmMYshkBsIpwVaP3TRhhIYEWqWzeXKtkIUZTFTA_xGlGJVkQP-7bdDduZyOv02ouH5BURJ3kZvgn8_PQgNo_nibs42fGHkwhM83cyZd3qNkQbJjAiL5F6gtp3HlM7h3KEDAwwxBsFJn_PPC_TFNdB7Qlvj6AMQWklBwbto3obVC2vnACPRqSP_SS7RlBox-tSAVNiJPOJVMbd-uSpg50aJhrxJarGcplfu7TgoXjgylyaoskZlgRj7bT63ktW-bvdVBBE-9zA";
    };

    return (
        <div className="pb-24">
             {/* Left Sidebar (Sticky) */}
            <div className="flex flex-col lg:flex-row max-w-[1440px] mx-auto">
                <aside className="hidden lg:flex w-64 flex-col gap-6 p-6 sticky top-0 h-screen overflow-y-auto pt-24">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Filtros</h1>
                        <a className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-dark border border-primary/20 hover:border-primary transition-all" href="#">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">schedule</span>
                            <div className="flex flex-col">
                                <span className="text-white text-sm font-medium">Recientes</span>
                                <span className="text-xs text-slate-400">Últimos 10</span>
                            </div>
                        </a>
                        <a className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-dark border border-transparent hover:border-primary/20 transition-all" href="#">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">rocket</span>
                            <div className="flex flex-col">
                                <span className="text-slate-300 group-hover:text-white text-sm font-medium">Starship</span>
                                <span className="text-xs text-slate-500">Programa</span>
                            </div>
                        </a>
                        <a className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-dark border border-transparent hover:border-primary/20 transition-all" href="#">
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">history</span>
                            <div className="flex flex-col">
                                <span className="text-slate-300 group-hover:text-white text-sm font-medium">Históricos</span>
                                <span className="text-xs text-slate-500">Destacados</span>
                            </div>
                        </a>
                    </div>
                </aside>
                
                <main className="flex-1 flex flex-col">
                    {/* Hero */}
                    <div className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center z-0" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDkps8EaHx_S4AmVmMeWq0mOMytCPtfRKSBtGh7dKlGHw8rH8V8_ch2SpY7MKnFDoyDWnWqRbCE0EP4nxOIk_lcKBW5ytP-1fplvC-lOaluPXeOnyodU25T1CQMiC54VttTnCMggS8ajU1rNh4deuklpAJMmYA8EQ3yEZhyiVKXJxKQB_Py3Dz9SEtAZh_Wczu9YCSLI3RD7Cwg4e0FIkSrenDiSgVsQlc-TNvcxQkJmcBvv0xklg80o5HcAoUEfEge8YdL1BoLgVM")'}}></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#111117]/30 via-[#111117]/70 to-[#111117] z-10"></div>
                        <div className="relative z-20 text-center px-6 max-w-3xl mx-auto flex flex-col items-center gap-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                Datos en Vivo
                            </div>
                            <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight font-medium tracking-tight">
                                Archivo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Misiones</span>
                            </h1>
                            <p className="text-slate-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                                Acceso directo a la base de datos de lanzamientos de SpaceX. Visualizando las últimas misiones exitosas y el progreso hacia la reutilización total.
                            </p>
                        </div>
                    </div>
                    
                    {/* Timeline Content */}
                    <div className="relative px-6 md:px-12 lg:px-20 max-w-5xl mx-auto w-full">
                        {/* Spine */}
                        <div className="absolute left-6 md:left-12 lg:left-20 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0 z-0"></div>
                        
                        {loading ? (
                             <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-4">
                                 <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                 Cargando historial de misiones...
                             </div>
                        ) : launches.map((launch) => (
                            <div className="relative pl-12 md:pl-20 py-16 group" key={launch.id}>
                                {/* Timeline Dot */}
                                <div className={`absolute left-6 md:left-12 lg:left-20 top-24 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_currentColor] ${launch.success ? 'bg-[#111117] border-emerald-500 text-emerald-500' : 'bg-[#111117] border-red-500 text-red-500'}`}></div>
                                
                                {/* Date Label */}
                                <div className="absolute -left-2 md:left-2 lg:left-10 top-24 -translate-x-full pr-4 text-right hidden lg:block">
                                    <span className="text-primary font-bold font-mono text-xl block">{new Date(launch.date_utc).getFullYear()}</span>
                                    <span className="text-slate-500 text-xs uppercase tracking-wide">{formatDate(launch.date_utc)}</span>
                                </div>
                                
                                {/* Card */}
                                <div className="bg-surface-dark/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group-hover:-translate-y-1">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-2/5 h-64 md:h-auto bg-cover bg-center relative" style={{backgroundImage: `url("${getLaunchImage(launch)}")`}}>
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent md:bg-gradient-to-r"></div>
                                            {launch.links.patch.small && (
                                                <div className="absolute top-4 left-4 size-16 drop-shadow-lg">
                                                    <img src={launch.links.patch.small} alt="Patch" className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${launch.success ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-red-500/20 text-red-500 border-red-500/20'}`}>
                                                        {launch.success ? 'Misión Exitosa' : 'Fallo/Anomalía'}
                                                    </span>
                                                    <span className="text-slate-500 text-xs font-mono">Vuelo #{launch.flight_number}</span>
                                                </div>
                                                <h3 className="text-2xl md:text-3xl font-serif text-white mb-3">{launch.name}</h3>
                                                <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-4">
                                                    {launch.details || "Sin descripción detallada de la misión disponible para este lanzamiento."}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {launch.links.webcast && (
                                                    <a href={launch.links.webcast} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                                                        Ver Webcast
                                                    </a>
                                                )}
                                                {launch.links.article && (
                                                    <a href={launch.links.article} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors">
                                                        Leer Artículo
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Economics / Coins (Static Info Section preserved) */}
                        <div className="relative py-20 my-8 pl-6 md:pl-12 lg:pl-10">
                            <div className="absolute left-0 right-0 top-0 bottom-0 bg-gradient-to-r from-accent-gold/5 via-transparent to-transparent -mx-6 md:-mx-20 rounded-3xl border-y border-accent-gold/10"></div>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="flex flex-col gap-4">
                                    <div className="inline-flex items-center gap-2 text-accent-gold font-bold uppercase tracking-widest text-xs">
                                        <span className="material-symbols-outlined text-lg">savings</span>
                                        Economía del Espacio
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-serif text-white">Shuttle vs. Falcon</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        La reusabilidad cambió la ecuación. Al aterrizar los propulsores, SpaceX redujo el costo a la Órbita Baja Terrestre (LEO) en más del 95% en comparación con la era del Transbordador Espacial.
                                    </p>
                                </div>
                                {/* Visual Metaphor: Coin Stacks */}
                                <div className="h-64 relative flex items-end justify-around pb-4 border-b border-slate-700">
                                    <CoinStack color="bg-accent-gold border-yellow-600" count={13} label="Shuttle" />
                                    <CoinStack color="bg-primary border-teal-600" count={1} label="F9" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Milestones;
