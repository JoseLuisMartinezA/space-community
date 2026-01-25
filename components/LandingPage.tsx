
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="h-screen w-full bg-background-dark text-white font-display relative overflow-x-hidden overflow-y-auto scrollbar-hide">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-space-gradient opacity-80 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-nebula opacity-30 blur-[100px] pointer-events-none"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-3 group h-24 overflow-hidden py-2">
                    <img
                        src="/isotipo.png"
                        alt="Space Community Icon"
                        className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-110 dark:brightness-100 brightness-0"
                    />
                    <img
                        src="/logotipo.png"
                        alt="Space Community Logo"
                        className="h-10 w-auto object-contain hidden lg:block transition-all dark:brightness-100 brightness-0"
                    />
                </Link>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm hover:bg-primary/20 transition-all hover:scale-105 active:scale-95 shadow-glow flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                            Ir al Panel
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Iniciar Sesión
                            </Link>
                            <Link to="/register" className="px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm hover:bg-primary/20 transition-all hover:scale-105 active:scale-95 shadow-glow">
                                Registrarse
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 pt-20 pb-32 px-6 md:px-12 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primary mb-8 animate-slideUp">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    NEXUS LINK ESTABLISHED
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    Explora el Futuro de la <br />
                    <span className="text-primary glow-text">Humanidad Multiplanetaria</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    Únete a la comunidad definitiva para entusiastas del Espacio. Conecta con otros fans, sigue lanzamientos en tiempo real y sé parte de la historia.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="w-full md:w-auto px-8 py-4 rounded-full bg-primary text-background-dark font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-glow-lg flex items-center justify-center gap-2 group">
                            Continuar Misión
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">rocket_launch</span>
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className="w-full md:w-auto px-8 py-4 rounded-full bg-primary text-background-dark font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-glow-lg flex items-center justify-center gap-2 group">
                                Únete a la Misión
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                            <Link to="/login" className="w-full md:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center">
                                Ya tengo cuenta
                            </Link>
                        </>
                    )}
                </div>

                {/* Dashboard Preview / Visual */}
                <div className="mt-20 relative animate-slideUp" style={{ animationDelay: '0.5s' }}>
                    <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative rounded-xl border border-white/10 bg-surface-dark/50 backdrop-blur-md overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-black/20">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="aspect-[16/9] w-full bg-surface-darker flex items-center justify-center relative group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
                            <div className="relative z-10 text-center">
                                <span className="material-symbols-outlined text-6xl text-white/20 mb-4 group-hover:text-primary/50 transition-colors">rocket_launch</span>
                                <p className="text-slate-500 font-mono text-sm">SYSTEM VISUALIZATION</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left">
                    <FeatureCard
                        icon="groups"
                        title="Comunidad Global"
                        description="Conecta con miles de entusiastas de diferentes países. Comparte teorías, noticias y pasión por el espacio."
                    />
                    <FeatureCard
                        icon="satellite_alt"
                        title="Seguimiento en Vivo"
                        description="Datos de telemetría en tiempo real, seguimiento de Starlink y actualizaciones minuto a minuto de cada misión."
                    />
                    <FeatureCard
                        icon="science"
                        title="Análisis Técnico"
                        description="Profundiza en la ingeniería detrás de los cohetes. Debates técnicos moderados por expertos de la comunidad."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm relative z-10">
                <p>&copy; {new Date().getFullYear()} Space Community. No afiliado oficialmente con SpaceX.</p>
                <div className="flex justify-center gap-4 mt-4">
                    <a href="#" className="hover:text-primary transition-colors">Términos</a>
                    <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
                    <a href="#" className="hover:text-primary transition-colors">Contacto</a>
                </div>
            </footer>
        </div >
    );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 group">
        <div className="w-12 h-12 rounded-lg bg-surface-dark border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">{icon}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-slate-400 group-hover:text-slate-300 transition-colors">{description}</p>
    </div>
);
