import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function inspectSchema() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Checking post_likes...");
    const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('*')
        .limit(1);

    if (likesError) {
        console.error("post_likes error:", likesError.message);
    } else {
        console.log("post_likes sample:", likesData);
    }

    console.log("Testing comments insert with author_id instead of user_id...");
    const { error: insertError } = await supabase.from('comments').insert({
        post_id: '00000000-0000-0000-0000-000000000000',
        author_id: '00000000-0000-0000-0000-000000000000',
        content: 'test'
    });
    console.log("Insert trial (author_id) error:", insertError?.message);

    if (insertError?.message.includes("Could not find the 'author_id' column")) {
        console.log("Result: author_id is ALSO not found.");
    } else if (insertError?.message.includes("new row violates row-level security policy")) {
        console.log("Result: author_id PROBABLY exists (passed schema check, hit RLS).");
    }
}

inspectSchema();
