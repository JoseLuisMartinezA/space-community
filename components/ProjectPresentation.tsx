import React, { useEffect, useState } from 'react';

const ProjectPresentation: React.FC = () => {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // En un entorno de producción, esto podría ser un fetch a un archivo estático
        // Para este propósito, intentaremos cargar el contenido del archivo HTML generado previamente
        fetch('/Defensa_Proyecto_Space_Community.html')
            .then(res => res.text())
            .then(data => {
                setHtmlContent(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading presentation:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
                <div className="text-primary font-mono animate-pulse">CARGANDO DEFENSA DE MISIÓN...</div>
            </div>
        );
    }

    // Usamos un iframe para aislar los estilos de la presentación del resto de la app
    return (
        <div className="w-full h-screen overflow-hidden bg-[#0B0E14]">
            <iframe
                srcDoc={htmlContent}
                className="w-full h-full border-none"
                title="Defensa de Proyecto Space Community"
            />
        </div>
    );
};

export default ProjectPresentation;
