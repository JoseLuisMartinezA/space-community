import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function testRPC() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envMap = {};
    envContent.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
    });

    const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.VITE_SUPABASE_ANON_KEY);

    console.log("Calling increment_likes RPC...");
    const { error } = await supabase.rpc('increment_likes', { post_id: '00000000-0000-0000-0000-000000000000' });

    if (error) {
        console.error("RPC error:", error.message);
    } else {
        console.log("RPC success (probably didn't do anything because ID is invalid, but it exists)");
    }
}

testRPC();
