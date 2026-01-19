import React from 'react';

const TechSupport: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
            <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Sistemas Nominales
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Centro de Soporte Nexus</h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Asistencia técnica especializada para enlaces de telemetría, problemas de cuenta y consultas sobre la API.
                    Nuestros ingenieros de vuelo están disponibles 24/7.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Channels */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors group">
                        <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl">call</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Línea Prioritaria</h3>
                        <p className="text-slate-400 text-sm mb-6">Para emergencias de misión críticas y fallos de sistema.</p>
                        <a href="tel:+18005550199" className="text-2xl font-mono text-white font-bold hover:text-primary transition-colors block">
                            +1 (800) 555-0199
                        </a>
                        <span className="text-xs text-emerald-500 flex items-center gap-1 mt-2">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span> Tiempo espera: &lt; 2 min
                        </span>
                    </div>

                    <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors group">
                        <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl">mail</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Enlace Subespacial</h3>
                        <p className="text-slate-400 text-sm mb-6">Para consultas generales, logs de errores y feedback.</p>
                        <a href="mailto:soporte@nexus.space" className="text-lg text-white hover:text-primary transition-colors font-medium">
                            soporte@nexus.space
                        </a>
                        <span className="text-xs text-slate-500 block mt-2">Respuesta en 4-6 horas</span>
                    </div>
                </div>

                {/* FAQ / Status */}
                <div className="lg:col-span-2 space-y-6">
                    {/* System Status Grid */}
                    <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Estado del Sistema</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 bg-surface-darker rounded-lg border border-white/5">
                                <span className="text-sm text-white">API de Telemetría</span>
                                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">OPERATIVO</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-surface-darker rounded-lg border border-white/5">
                                <span className="text-sm text-white">Servidor de Video</span>
                                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">OPERATIVO</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-surface-darker rounded-lg border border-white/5">
                                <span className="text-sm text-white">Base de Datos de Usuarios</span>
                                <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">MANTENIMIENTO</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-surface-darker rounded-lg border border-white/5">
                                <span className="text-sm text-white">Nexus IA Core</span>
                                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">OPERATIVO</span>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Preguntas Frecuentes</h3>

                        <details className="group bg-surface-dark border border-white/5 rounded-xl open:border-primary/30 transition-all">
                            <summary className="flex items-center justify-between p-4 cursor-pointer">
                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">¿Cómo vinculo mi cuenta de Starlink?</span>
                                <span className="material-symbols-outlined text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
                            </summary>
                            <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">
                                Navega a tu Perfil &gt; Ajustes &gt; Integraciones. Introduce tu ID de Terminal Starlink. La verificación puede tardar hasta 24 horas.
                            </div>
                        </details>

                        <details className="group bg-surface-dark border border-white/5 rounded-xl open:border-primary/30 transition-all">
                            <summary className="flex items-center justify-between p-4 cursor-pointer">
                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">¿Por qué mi estado de misión no se actualiza?</span>
                                <span className="material-symbols-outlined text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
                            </summary>
                            <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">
                                Los datos de telemetría dependen de la API pública de SpaceX. Durante las ventanas de lanzamiento, puede haber un retraso de 30-60 segundos. Refresca el panel si el retraso persiste.
                            </div>
                        </details>

                        <details className="group bg-surface-dark border border-white/5 rounded-xl open:border-primary/30 transition-all">
                            <summary className="flex items-center justify-between p-4 cursor-pointer">
                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">¿Cómo reporto un comportamiento tóxico en la comunidad?</span>
                                <span className="material-symbols-outlined text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
                            </summary>
                            <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">
                                Usa el botón de "Reportar Anomalía" en la esquina superior derecha de cualquier publicación. Nuestro equipo de moderación revisará el incidente bajo los Protocolos de Refugio Seguro.
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechSupport;
