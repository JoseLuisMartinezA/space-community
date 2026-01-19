import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function testLikes() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Testing post_likes with author_id...");
    const { error: insertError } = await supabase.from('post_likes').insert({
        post_id: '00000000-0000-0000-0000-000000000000',
        author_id: '00000000-0000-0000-0000-000000000000'
    });
    console.log("Insert trial (author_id) error:", insertError?.message);

    if (insertError?.message.includes("Could not find the 'author_id' column")) {
        console.log("author_id DOES NOT exist in post_likes.");
    } else if (insertError?.message.includes("new row violates row-level security policy")) {
        console.log("author_id PROBABLY exists in post_likes.");
    } else {
        console.log("Unexpected error:", insertError?.message);
    }
}

testLikes();
