import React, { useEffect, useState } from 'react';
import { getAllRockets } from '../services/spacex';
import { SpaceXRocket } from '../types';

const Rockets: React.FC = () => {
    const [rockets, setRockets] = useState<SpaceXRocket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRockets = async () => {
            try {
                const data = await getAllRockets();
                setRockets(data);
            } catch (error) {
                console.error("Error loading rockets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRockets();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20 animate-slideUp">
                <span className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-slideUp">
            <header className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white mb-2">Flota de Vehículos</h1>
                <p className="text-slate-400">Galería y especificaciones técnicas de los cohetes SpaceX.</p>
            </header>

            {/* Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {rockets.map((rocket) => (
                    <div key={rocket.id} className="relative group overflow-hidden rounded-2xl bg-surface-dark border border-white/5 h-80 cursor-pointer hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/10">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                            style={{ backgroundImage: `url(${rocket.flickr_images[0] || 'https://live.staticflickr.com/65535/49928374477_9e3fa07104_b.jpg'})` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-6">
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-2xl font-bold text-white mb-1">{rocket.name}</h3>
                                <p className="text-slate-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100 duration-300">
                                    {rocket.description}
                                </p>
                                <div className="flex gap-4 text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity delay-200 duration-300">
                                    <span>{rocket.height.meters}m ALTURA</span>
                                    <span>{rocket.stages} ETAPAS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Technical Table */}
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold text-white">Comparativa Técnica</h3>
                </div>
                <div className="overflow-x-auto p-6">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead>
                            <tr className="border-b border-white/10 text-xs uppercase tracking-wider">
                                <th className="pb-4 font-bold text-white">Cohete</th>
                                <th className="pb-4 font-bold text-white">Estado</th>
                                <th className="pb-4 font-bold text-white">Altura</th>
                                <th className="pb-4 font-bold text-white">Diámetro</th>
                                <th className="pb-4 font-bold text-white">Masa</th>
                                <th className="pb-4 font-bold text-white">Etapas</th>
                                <th className="pb-4 font-bold text-white text-right">Costo/Lanzamiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rockets.map((rocket) => (
                                <tr key={rocket.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 text-white font-bold">{rocket.name}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${rocket.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {rocket.active ? 'Activo' : 'Retirado'}
                                        </span>
                                    </td>
                                    <td className="py-4 font-mono">{rocket.height.meters} m</td>
                                    <td className="py-4 font-mono">{rocket.diameter.meters} m</td>
                                    <td className="py-4 font-mono">{rocket.mass.kg.toLocaleString()} kg</td>
                                    <td className="py-4 font-mono">{rocket.stages}</td>
                                    <td className="py-4 font-mono text-right text-primary">
                                        ${(rocket.cost_per_launch / 1000000).toFixed(1)}M
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Rockets;
