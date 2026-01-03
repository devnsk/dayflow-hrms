import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function UserProfile() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return (
        <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
    );
}

export function HeaderUser() {
    return (
        <Suspense fallback={<div className="ml-auto text-sm text-muted-foreground">Loading...</div>}>
            <UserProfile />
        </Suspense>
    )
}
