import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function exhaustiveSearch() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    const tables = [
        'likes', 'post_likes', 'posts_likes', 'user_likes', 'like', 'post_like',
        'favorites', 'post_favorites', 'stars', 'post_stars',
        'social_likes', 'community_likes', 'likes_on_posts'
    ];

    for (const table of tables) {
        process.stdout.write(`Checking ${table}... `);
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error && error.message.includes("schema cache")) {
            console.log("NOT FOUND");
        } else if (error) {
            console.log(`FOUND (Error: ${error.message})`);
        } else {
            console.log("EXISTS!");
        }
    }
}

exhaustiveSearch();
