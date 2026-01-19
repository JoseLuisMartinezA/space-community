import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function findLikesTable() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    const tables = ['likes', 'post_likes', 'posts_likes', 'user_likes', 'likes_posts'];
    for (const table of tables) {
        console.log(`Checking '${table}'...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`  ${table} error: ${error.message}`);
        } else {
            console.log(`  ${table} EXISTS! data:`, data);
        }
    }
}

findLikesTable();
