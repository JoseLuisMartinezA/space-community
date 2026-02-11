import React from 'react';

const ProjectPresentation: React.FC = () => {
    // Usamos un iframe con src directo al archivo en /public para mejor compatibilidad
    return (
        <div className="w-full h-screen overflow-hidden bg-[#0B0E14]">
            <iframe
                src="/Defensa_Proyecto_Space_Community.html"
                className="w-full h-full border-none"
                title="Defensa de Proyecto Space Community"
            />
        </div>
    );
};

export default ProjectPresentation;
