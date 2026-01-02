"use client";

import { fixPermissions } from "@/lib/actions/debug";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function DebugPage() {
    const [status, setStatus] = useState("Idle");

    const handleFix = async () => {
        setStatus("Fixing...");
        const result = await fixPermissions();
        if (result.success) {
            setStatus("Success! You are now Admin.");
            toast({ title: "Permissions Fixed", description: "You have been promoted to Admin." });
            window.location.reload();
        } else {
            setStatus("Error: " + result.error);
        }
    };

    return (
        <div className="p-10 space-y-4">
            <h1 className="text-2xl font-bold">Debug / Fix Permissions</h1>
            <p className="text-muted-foreground">
                Click the button below to promote your current account to <strong>Admin</strong>.
            </p>
            <div className="p-4 border rounded bg-muted">
                Status: {status}
            </div>
            <Button onClick={handleFix}>
                Fix My Permissions (Promote to Admin)
            </Button>
        </div>
    );
}
