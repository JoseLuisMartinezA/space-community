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

    const tables = ['post_like', 'comment_likes', 'post_reactions', 'reactions'];
    for (const table of tables) {
        console.log(`Checking '${table}'...`);
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`  ${table} error: ${error.message}`);
        } else {
            console.log(`  ${table} EXISTS!`);
        }
    }
}

findLikesTable();
