
import { createClient } from "@supabase/supabase-js";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceRoleKey || !url) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("Fetching profiles...");
    const { data: profiles, error } = await supabase.from("profiles").select("*");

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.table(profiles);
}

main();
