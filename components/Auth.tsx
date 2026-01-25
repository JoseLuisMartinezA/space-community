import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AVATARS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDhf0khbsYWHTkrFpFeDdlBNRfi37lS3Fi1BS3KPpqWJmuvr7rCac8ckcnuFkwGSbBo2Yk9UM_hOu1VqaOrIZtu2nV2VlDuCvo8wQRWEbTEoIMGpMwNlG5fFqIFcXgAss07QHxzTb1_286vyYamLpBzX94LVgzSJuM8KDe_zeH3zrjfYhw9xFlasibj89ITOeWuJIN-b6GUjkaqIhhUXOb7eGI5iE5LkhZXi2fDP3558Lbz7Ng1CwSYKVRb4idD1NAqjN6EGFybpRs',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIUeU7zPkUaELKNHaTt6utoBB5MeZu2cJ-t7A-nDUvoeERRGzXFTpdFxBeAKdaWbL9f-icdtxOWgrEITgLB_C7Cl9kzsCwyHPPg2hRCQJ0PATuXQ59QE7JLcsu18biEyBCirr5zoIeRTMoRpcBbmc54ir7UD0aKW37VGCDUL3SZGTryhPXcnrDE9qdsqjS2QJA6XcxzUuAWmWhJQgTgKEfeNkyDnST-2WdKjYw7IS5WJ5_k_airfCTxUqAoz3Nbm8ZoCoPK0eCNBQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB2B2htDQVsMEGBlmfihKgiDJMeUJ32TvWHqZ6R9t0I2ZvEjmG1JDs1U8EaY3geMpe9CBS1MfF35Fwid_3Q3t9ULuzKNwp6_BNZFlfqFGZ5qvWRYf6bx3-SbAoBenIIzovWyLOY50iRNi_cbnp1iPLpw3LsetPqbFd0gJV4sUiWDL4zI8jDBK1z8dZUUhaZFe6TK3TXgOTNQL6FptSpJu3uoYcS_ok0xTgj3_NqFZhhZnsLtqlluM1WnsFHvd6jQNfYxBoCOzcpj1w',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfFn0CvYBz6pgLEB6gkVu3iDd7Dz1SRbqOA-O1eF9JEk0W7YD_6xnvneM6CCYOyG5pjh0sr72Lz9f09ij_X0M-H0V3REu1O_1FyajBflCtzK-vhzCPykZNsEeCw8detx3QkxF2AZrRN4uF5zoktVIDWPyuFlLqLeQL7Ra1L01_iZvQ2Z7mxcCLWnEQOfblDM55sqvkVgH74xW3ieIj5_tYIaRNQvfh0ls4ArS2Sp0dXHngs956l1H9XSlkmx-lax2GavohGc1Jfzg'
];

const ROLES = [
    'Cadete Espacial',
    'Ingeniero de Vuelo',
    'Oficial de Comunicaciones',
    'Director de Misión'
];

export const Login: React.FC = () => {
    const [handle, setHandle] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // First we need to find the email associated with this handle
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('handle', handle.startsWith('@') ? handle : `@${handle}`)
                .single();

            if (profileError || !profileData) {
                setError("Nombre de usuario no encontrado.");
                setIsLoading(false);
                return;
            }

            const { error } = await login(profileData.email, password);
            if (error) {
                setError("Contraseña incorrecta.");
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError("Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-dark relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkps8EaHx_S4AmVmMeWq0mOMytCPtfRKSBtGh7dKlGHw8rH8V8_ch2SpY7MKnFDoyDWnWqRbCE0EP4nxOIk_lcKBW5ytP-1fplvC-lOaluPXeOnyodU25T1CQMiC54VttTnCMggS8ajU1rNh4deuklpAJMmYA8EQ3yEZhyiVKXJxKQB_Py3Dz9SEtAZh_Wczu9YCSLI3RD7Cwg4e0FIkSrenDiSgVsQlc-TNvcxQkJmcBvv0xklg80o5HcAoUEfEge8YdL1BoLgVM')] bg-cover bg-center opacity-20"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-surface-dark/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-glow-lg">
                <div className="text-center mb-8">
                    <div className="size-20 mx-auto transition-transform duration-500 hover:rotate-12 mb-4">
                        <img src="/isotipo.png" alt="Space Community Isotype" className="w-full h-full object-contain dark:brightness-100 brightness-0" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold !text-white">Space Community</h1>
                    <p className="text-slate-400 text-sm">Identificación de Personal</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Usuario</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-500 font-mono">@</span>
                            <input
                                type="text"
                                required
                                value={handle.startsWith('@') ? handle.slice(1) : handle}
                                onChange={(e) => setHandle(e.target.value)}
                                className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 pl-8 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                                placeholder="usuario"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wide text-sm mt-2 disabled:opacity-50">
                        {isLoading ? 'Verificando...' : 'Acceder'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        ¿Primera vez aquí? <Link to="/register" className="text-primary hover:underline">Solicitar Permisos (Registro)</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export const Register: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', // App name (repetible)
        handle: '', // Unique username (irrepetible)
        email: '', // Unique email
        password: '',
        bio: '',
        role: ROLES[0],
        avatar: AVATARS[0]
    });

    const validateStep = (currentStep: number) => {
        setError('');
        if (currentStep === 1) {
            if (!formData.name.trim() || !formData.handle.trim() || !formData.email.trim() || !formData.password.trim()) {
                setError('Por favor completa todos los campos requeridos.');
                return false;
            }
            if (!formData.email.includes('@')) {
                setError('Por favor introduce un correo válido.');
                return false;
            }
            if (formData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return false;
            }
        }
        if (currentStep === 2) {
            if (!formData.avatar.trim()) {
                setError('Por favor selecciona o introduce un avatar.');
                return false;
            }
        }
        if (currentStep === 3) {
            if (!formData.bio.trim()) {
                setError('Por favor completa tu biografía de misión.');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(step)) {
            setIsLoading(true);
            try {
                const { error } = await register(formData.email, formData.password, {
                    name: formData.name,
                    handle: formData.handle.startsWith('@') ? formData.handle : `@${formData.handle}`,
                    avatar: formData.avatar,
                    bio: formData.bio
                });

                if (error) {
                    setError(error.message || "Error al registrarse");
                    setIsLoading(false);
                } else {
                    navigate('/dashboard');
                }
            } catch (err) {
                setError("Ocurrió un error inesperado");
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-dark relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkps8EaHx_S4AmVmMeWq0mOMytCPtfRKSBtGh7dKlGHw8rH8V8_ch2SpY7MKnFDoyDWnWqRbCE0EP4nxOIk_lcKBW5ytP-1fplvC-lOaluPXeOnyodU25T1CQMiC54VttTnCMggS8ajU1rNh4deuklpAJMmYA8EQ3yEZhyiVKXJxKQB_Py3Dz9SEtAZh_Wczu9YCSLI3RD7Cwg4e0FIkSrenDiSgVsQlc-TNvcxQkJmcBvv0xklg80o5HcAoUEfEge8YdL1BoLgVM')] bg-cover bg-center opacity-20"></div>

            <div className="relative z-10 w-full max-w-2xl p-8 bg-surface-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glow-lg flex flex-col md:flex-row overflow-hidden">

                {/* Progress Sidebar */}
                <div className="hidden md:flex flex-col w-1/3 border-r border-white/5 pr-6 gap-8">
                    <div className="flex items-center gap-3">
                        <div className="size-12 transition-transform duration-500 hover:rotate-12 shrink-0">
                            <img src="/isotipo.png" alt="Space Community Isotype" className="w-full h-full object-contain dark:brightness-100 brightness-0" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold leading-tight !text-white">Registro de Vuelo</h2>
                            <p className="text-xs text-slate-500">Configuración Inicial</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 relative">
                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/10 -z-10"></div>
                        <div className={`flex items-center gap-3 transition-colors ${step >= 1 ? 'text-white' : 'text-slate-500'}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${step >= 1 ? 'bg-primary text-background-dark border-primary' : 'bg-surface-dark border-white/20'}`}>1</div>
                            <span className="text-sm font-medium">Credenciales</span>
                        </div>
                        <div className={`flex items-center gap-3 transition-colors ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${step >= 2 ? 'bg-primary text-background-dark border-primary' : 'bg-surface-dark border-white/20'}`}>2</div>
                            <span className="text-sm font-medium">Personalización</span>
                        </div>
                        <div className={`flex items-center gap-3 transition-colors ${step >= 3 ? 'text-white' : 'text-slate-500'}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${step >= 3 ? 'bg-primary text-background-dark border-primary' : 'bg-surface-dark border-white/20'}`}>3</div>
                            <span className="text-sm font-medium">Biografía</span>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <p className="text-xs text-slate-500">¿Ya tienes cuenta?</p>
                        <Link to="/login" className="text-primary text-sm font-bold hover:underline">Acceder al Sistema</Link>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 md:pl-8 pt-4 md:pt-0">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        {step === 1 && (
                            <div className="flex flex-col gap-4 animate-fadeIn">
                                <h3 className="text-xl font-serif font-bold text-white mb-2">Identificación</h3>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Aplicación (Visible)</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none"
                                            placeholder="Ej: Starman"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Este es el nombre que verán los demás usuarios sobre tu @handle.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Usuario (Único)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-slate-500 font-mono">@</span>
                                            <input
                                                type="text"
                                                required
                                                value={formData.handle.startsWith('@') ? formData.handle.slice(1) : formData.handle}
                                                onChange={(e) => setFormData({ ...formData, handle: e.target.value ? '@' + e.target.value.replace('@', '') : '' })}
                                                className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 pl-8 text-white focus:border-primary outline-none font-mono"
                                                placeholder="starman99"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none"
                                        placeholder="nombre@ejemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="mt-auto pt-6 flex flex-col gap-3">
                                    {error && <p className="text-red-400 text-xs">{error}</p>}
                                    <button type="button" onClick={nextStep} className="w-full py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wide text-sm">
                                        Siguiente Fase
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <h3 className="text-xl font-serif font-bold text-white mb-2">Personalización</h3>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Selecciona Avatar</label>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                        {AVATARS.map((avatar, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setFormData({ ...formData, avatar })}
                                                className={`size-16 rounded-full border-2 cursor-pointer transition-all relative shrink-0 ${formData.avatar === avatar ? 'border-primary shadow-glow scale-110' : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'}`}
                                            >
                                                <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                {formData.avatar === avatar && (
                                                    <div className="absolute -bottom-1 -right-1 size-5 bg-primary rounded-full flex items-center justify-center text-background-dark">
                                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-primary">O introduce una URL personalizada</label>
                                    <input
                                        type="url"
                                        value={AVATARS.includes(formData.avatar) ? '' : formData.avatar}
                                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                        className="w-full bg-surface-darker border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none transition-all"
                                        placeholder="https://ejemplo.com/mi-avatar.jpg"
                                    />
                                </div>

                                <div className="mt-auto pt-4 flex gap-3">
                                    <button type="button" onClick={prevStep} className="w-1/3 py-3 bg-white/5 text-white font-bold rounded-lg hover:bg-white/10 transition-colors uppercase tracking-wide text-sm">
                                        Atrás
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex-1 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wide text-sm">
                                        Siguiente Fase
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col gap-4 animate-fadeIn h-full">
                                <h3 className="text-xl font-serif font-bold text-white mb-2">Perfil de Misión</h3>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Biografía</label>
                                    <textarea
                                        required
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full h-32 bg-surface-darker border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none resize-none leading-relaxed"
                                        placeholder="Describe tu experiencia, intereses y objetivos en la comunidad..."
                                    />
                                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                        <h4 className="text-primary font-bold text-xs mb-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">info</span>
                                            Nota del Sistema
                                        </h4>
                                        <p className="text-[10px] text-slate-400">
                                            Al iniciar el protocolo de ingreso, aceptas los términos de servicio de la red Nexus y los protocolos de comunicación interestelar.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 flex flex-col gap-3">
                                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                    <div className="flex gap-3 w-full">
                                        <button type="button" onClick={prevStep} className="w-1/3 py-3 bg-white/5 text-white font-bold rounded-lg hover:bg-white/10 transition-colors uppercase tracking-wide text-sm">
                                            Atrás
                                        </button>
                                        <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-primary text-background-dark font-bold rounded-lg hover:bg-white transition-colors uppercase tracking-wide text-sm shadow-glow disabled:opacity-50">
                                            {isLoading ? 'Lanzando...' : 'Lanzar Perfil'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
