import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function inspectPosts() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Inspecting 'posts' table columns...");
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error("Error:", error.message);
    } else if (data && data.length > 0) {
        console.log("Posts columns:", Object.keys(data[0]));
    } else {
        console.log("No posts found to inspect columns.");
        // Try to insert one to see columns requested in error or something?
        // No, let's try to query information_schema if possible
    }
}

inspectPosts();
