import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function checkLikes() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Checking for 'likes' table...");
    const { error } = await supabase.from('likes').select('id').limit(1);
    if (error) console.log("'likes' error:", error.message);
    else console.log("'likes' table exists!");
}

checkLikes();
