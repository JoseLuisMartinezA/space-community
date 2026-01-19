import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function checkTables() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Checking for 'post_likes' table...");
    try {
        const { error: likeError } = await supabase.from('post_likes').select('id').limit(1);
        if (likeError) console.log("'post_likes' error:", likeError.message);
        else console.log("'post_likes' table exists!");
    } catch (e) { console.log("'post_likes' check crashed"); }

    console.log("Checking for 'comments' table...");
    try {
        const { error: commError } = await supabase.from('comments').select('id').limit(1);
        if (commError) console.log("'comments' error:", commError.message);
        else console.log("'comments' table exists!");
    } catch (e) { console.log("'comments' check crashed"); }

    console.log("Checking for 'post_comments' table...");
    try {
        const { error: pCommError } = await supabase.from('post_comments').select('id').limit(1);
        if (pCommError) console.log("'post_comments' error:", pCommError.message);
        else console.log("'post_comments' table exists!");
    } catch (e) { console.log("'post_comments' check crashed"); }
}

checkTables();
