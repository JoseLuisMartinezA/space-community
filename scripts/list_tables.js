import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function listTables() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("--- START TABLE CHECK ---");
    const commonTables = ['posts', 'comments', 'profiles', 'likes', 'post_likes', 'post_comments', 'user_likes'];
    for (const table of commonTables) {
        try {
            const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
            if (error) {
                console.log(`Table '${table}': [FAIL] ${error.message}`);
            } else {
                console.log(`Table '${table}': [SUCCESS]`);
            }
        } catch (e) {
            console.log(`Table '${table}': [EXCEPTION] ${e.message}`);
        }
    }
    console.log("--- END TABLE CHECK ---");
}

listTables();
