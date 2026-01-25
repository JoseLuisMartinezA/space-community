import React, { useEffect, useState } from 'react';
import { getUpcomingLaunches, getPastLaunches } from '../services/spacex';
import { SpaceXLaunch } from '../types';

const Launches: React.FC = () => {
    const [launches, setLaunches] = useState<SpaceXLaunch[]>([]);
    const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLaunches = async () => {
            setLoading(true);
            try {
                const data = view === 'upcoming'
                    ? await getUpcomingLaunches(10)
                    : await getPastLaunches(20);
                setLaunches(data);
            } catch (error) {
                console.error("Error fetching launches", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLaunches();
    }, [view]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-6 space-y-6 animate-slideUp">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Lanzamientos</h1>
                    <p className="text-slate-400">Próximas misiones y archivo histórico de lanzamientos.</p>
                </div>
                <div className="flex bg-surface-dark border border-white/5 rounded-lg p-1 self-start md:self-auto">
                    <button
                        onClick={() => setView('upcoming')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${view === 'upcoming' ? 'bg-primary text-background-dark shadow-glow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Próximos
                    </button>
                    <button
                        onClick={() => setView('past')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${view === 'past' ? 'bg-primary text-background-dark shadow-glow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Pasados
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
            ) : launches.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2">rocket_launch</span>
                    <p>No se encontraron lanzamientos.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {launches.map((launch) => (
                        <div key={launch.id} className="bg-surface-dark border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group relative overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Patch / Image placeholder */}
                                <div className="shrink-0">
                                    {launch.links.patch.small ? (
                                        <img src={launch.links.patch.small} alt={launch.name} className="size-20 md:size-24 object-contain" />
                                    ) : (
                                        <div className="size-20 md:size-24 bg-white/5 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-slate-600">rocket</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-white truncate">{launch.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${view === 'upcoming'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : launch.success
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {view === 'upcoming' ? 'Programado' : launch.success ? 'Éxito' : 'Fallo'}
                                        </span>
                                        <span className="text-slate-500 text-xs font-mono ml-auto md:ml-0">
                                            #{launch.flight_number}
                                        </span>
                                    </div>

                                    <p className="text-slate-300 text-sm mb-4 line-clamp-2 md:line-clamp-none">
                                        {launch.details || "Sin descripción de misión disponible."}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                            {formatDate(launch.date_utc)}
                                        </div>
                                        {/* Since rocket/launchpad are populated, they might be objects or strings depending on populating depth. 
                                            Our service populates them, but typescript interface might treat them as strings if not updated. 
                                            Standard population returns object with 'name'. Let's assume the component receives what the service sends.
                                            However, the types currently say 'string' for IDs. I might need to cast or safely access.
                                            For safety, I'll check if it's an object with name, otherwise show ID or fallback.
                                        */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                            {(launch.rocket as any)?.name || "Cohete"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {(launch.launchpad as any)?.name || "Plataforma"}
                                        </div>
                                    </div>
                                </div>

                                {launch.links.webcast && (
                                    <a
                                        href={launch.links.webcast}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-500 transition-colors self-end md:self-center"
                                        title="Ver Webcast"
                                    >
                                        <span className="material-symbols-outlined">play_arrow</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Launches;
