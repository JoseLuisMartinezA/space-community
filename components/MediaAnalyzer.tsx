import React, { useState, useRef } from 'react';
import { analyzeMedia } from '../services/gemini';

export const MediaAnalyzer: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check file size (approx 10MB limit for browser robustness)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("Archivo demasiado grande. Por favor selecciona un archivo menor a 10MB para subida inmediata.");
                return;
            }

            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null);
            setError(null);
        }
    };

    const handleAnalysis = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = reader.result as string;
                // Remove data url prefix (e.g. "data:image/jpeg;base64,")
                const base64Data = base64String.split(',')[1];
                
                try {
                   const analysisResult = await analyzeMedia(base64Data, file.type, "");
                   setResult(analysisResult);
                } catch (err: any) {
                   setError(err.message || "Fallo en la subida");
                } finally {
                   setLoading(false);
                }
            };
            reader.onerror = () => {
                setError("Fallo al procesar datos del archivo local.");
                setLoading(false);
            };
        } catch (err) {
            setError("Error inesperado del sistema.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
            <div className="mb-8">
                <h2 className="text-3xl text-white font-serif font-medium mb-2">Análisis de Telemetría Visual</h2>
                <p className="text-slate-400 text-sm max-w-2xl">
                    Sube datos visuales (imágenes o clips de video cortos) de los sitios de lanzamiento o plantas de fabricación.
                    Nexus IA analizará la integridad estructural, identificará componentes o resumirá eventos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="flex flex-col gap-4">
                    <div 
                        className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden
                            ${file ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-surface-dark hover:border-white/30 hover:bg-white/5'}
                        `}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            file?.type.startsWith('video') ? (
                                <video src={previewUrl} className="w-full h-full object-contain" controls />
                            ) : (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                                <span className="text-sm font-medium">Click para subir medios</span>
                                <span className="text-[10px] uppercase tracking-wider opacity-60">Imágenes o Video (Max 10MB)</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*,video/*" 
                            className="hidden" 
                        />
                    </div>

                    <button 
                        onClick={handleAnalysis}
                        disabled={!file || loading}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all
                            ${!file || loading 
                                ? 'bg-surface-dark text-slate-500 cursor-not-allowed' 
                                : 'bg-primary text-[#111117] hover:bg-white shadow-glow'}
                        `}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="size-4 border-2 border-[#111117] border-t-transparent rounded-full animate-spin"></span>
                                Analizando...
                            </span>
                        ) : "Iniciar Escaneo"}
                    </button>
                    
                    {error && (
                        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
                            <span className="material-symbols-outlined">warning</span>
                            {error}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 min-h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Registro de Análisis</h3>
                        <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : result ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                            <span className="text-[10px] font-mono text-slate-500">{loading ? 'PROCESANDO' : result ? 'COMPLETO' : 'EN ESPERA'}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-2 bg-white/10 rounded w-3/4"></div>
                                <div className="h-2 bg-white/10 rounded w-1/2"></div>
                                <div className="h-2 bg-white/10 rounded w-5/6"></div>
                            </div>
                        ) : result ? (
                            <div className="prose prose-invert prose-sm">
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">data_object</span>
                                <span className="text-xs">No hay datos de análisis disponibles</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
