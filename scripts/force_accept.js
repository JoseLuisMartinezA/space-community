import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function acceptRequest() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.SUPABASE_SERVICE_ROLE_KEY);

    console.log("🔍 Buscando solicitudes pendientes para forzar aceptación...");
    const { data: requests, error: rError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'pending');

    if (rError) {
        console.error("Error al buscar:", rError.message);
        return;
    }

    if (!requests || requests.length === 0) {
        console.log("No hay solicitudes pendientes.");
        return;
    }

    for (const req of requests) {
        console.log(`🚀 Forzando aceptación de solicitud ${req.id}...`);
        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', req.id);

        if (error) {
            console.error(`❌ Error forzando ${req.id}:`, error.message);
        } else {
            console.log(`✅ Solicitud ${req.id} aceptada con éxito (bypass RLS).`);
        }
    }
}

acceptRequest();
