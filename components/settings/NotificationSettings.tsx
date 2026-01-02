"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function NotificationSettings() {
    // Mock state
    const [prefs, setPrefs] = useState({
        email_new_student: true,
        email_payment: true,
        sms_attendance: false,
        browser_push: true
    });

    const handleSave = () => {
        toast({ title: "Preferences Saved", description: "Notification settings updated." });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive alerts and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label className="text-base flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Email Notifications
                        </Label>
                        <span className="text-sm text-muted-foreground">
                            Receive emails about new student registrations and payments.
                        </span>
                    </div>
                    <Switch
                        checked={prefs.email_new_student}
                        onCheckedChange={(c) => setPrefs(p => ({ ...p, email_new_student: c }))}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label className="text-base flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> SMS Alerts
                        </Label>
                        <span className="text-sm text-muted-foreground">
                            Receive SMS alerts for urgent attendance issues.
                        </span>
                    </div>
                    <Switch
                        checked={prefs.sms_attendance}
                        onCheckedChange={(c) => setPrefs(p => ({ ...p, sms_attendance: c }))}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                        <Label className="text-base flex items-center gap-2">
                            <Bell className="h-4 w-4" /> Browser Push
                        </Label>
                        <span className="text-sm text-muted-foreground">
                            Receive push notifications in the browser.
                        </span>
                    </div>
                    <Switch
                        checked={prefs.browser_push}
                        onCheckedChange={(c) => setPrefs(p => ({ ...p, browser_push: c }))}
                    />
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave}>Save Preferences</Button>
                </div>
            </CardContent>
        </Card>
    );
}
