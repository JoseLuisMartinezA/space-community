import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function simulateApp() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Simulating fetchUserLikes...");
    const { data, error } = await supabase
        .from('post_likes')
        .select('post_id');

    if (error) {
        console.error("fetchUserLikes error:", error.message);
    } else {
        console.log("fetchUserLikes success, rows:", data.length);
    }

    console.log("Simulating handleAddComment...");
    const { error: cError } = await supabase
        .from('comments')
        .insert({
            post_id: '00000000-0000-0000-0000-000000000000',
            user_id: '00000000-0000-0000-0000-000000000000',
            content: 'test'
        });

    if (cError) {
        console.error("handleAddComment error:", cError.message);
    } else {
        console.log("handleAddComment success");
    }
}

simulateApp();
