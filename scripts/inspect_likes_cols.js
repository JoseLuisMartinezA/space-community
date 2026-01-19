import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function inspectColumns() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Testing post_likes columns...");
    // Try to select user_id
    const { error: userError } = await supabase.from('post_likes').select('user_id').limit(1);
    console.log("post_likes.user_id check:", userError ? userError.message : "SUCCESS");

    // Try to select author_id
    const { error: authorError } = await supabase.from('post_likes').select('author_id').limit(1);
    console.log("post_likes.author_id check:", authorError ? authorError.message : "SUCCESS");
}

inspectColumns();
