import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function testLikesTable() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Testing 'likes' table with author_id...");
    const { error: insertError } = await supabase.from('likes').insert({
        post_id: '00000000-0000-0000-0000-000000000000',
        author_id: '00000000-0000-0000-0000-000000000000'
    });
    console.log("Insert trial ('likes', author_id) error:", insertError?.message);

    console.log("Testing 'likes' table with user_id...");
    const { error: insertError2 } = await supabase.from('likes').insert({
        post_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000'
    });
    console.log("Insert trial ('likes', user_id) error:", insertError2?.message);
}

testLikesTable();
