import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function inspectComments() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Inspecting 'comments' table...");
    const { data, error } = await supabase.from('comments').select('*').limit(1);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Sample comment data:", data);
        if (data && data.length > 0) {
            console.log("Keys:", Object.keys(data[0]));
        } else {
            console.log("Table is empty.");
        }
    }
}

inspectComments();
