"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/actions/notifications";
import type { NotificationPreference } from "@/lib/actions/notifications";

export function NotificationSettings() {
    const [prefs, setPrefs] = useState<Partial<NotificationPreference>>({
        email_notifications: true,
        sms_notifications: false,
        whatsapp_notifications: false,
        notify_payments: true,
        notify_attendance: true,
        notify_assessments: true,
        notify_enrollments: true,
        notify_announcements: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const data = await getNotificationPreferences();
            if (data) {
                setPrefs(data);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load notification preferences",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateNotificationPreferences(prefs);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Notification preferences updated successfully",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to update preferences",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                    Manage how and when you receive notifications about system events
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Notification Channels */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Notification Channels</h4>
                    
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email Notifications
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Receive email notifications for important updates
                            </span>
                        </div>
                        <Switch
                            checked={prefs.email_notifications}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, email_notifications: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> SMS Notifications
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Receive text messages for urgent alerts
                            </span>
                        </div>
                        <Switch
                            checked={prefs.sms_notifications}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, sms_notifications: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-green-600" /> WhatsApp Notifications
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Receive WhatsApp messages for selected events
                            </span>
                        </div>
                        <Switch
                            checked={prefs.whatsapp_notifications}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, whatsapp_notifications: checked }))
                            }
                        />
                    </div>
                </div>

                <Separator />

                {/* Notification Types */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Notification Types</h4>
                    
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base">Payment Notifications</Label>
                            <span className="text-sm text-muted-foreground">
                                Alerts about payments, overdue fees, and revenue
                            </span>
                        </div>
                        <Switch
                            checked={prefs.notify_payments}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, notify_payments: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base">Attendance Alerts</Label>
                            <span className="text-sm text-muted-foreground">
                                Notifications about attendance issues and absences
                            </span>
                        </div>
                        <Switch
                            checked={prefs.notify_attendance}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, notify_attendance: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base">Assessment Updates</Label>
                            <span className="text-sm text-muted-foreground">
                                Alerts about new assessments and grade submissions
                            </span>
                        </div>
                        <Switch
                            checked={prefs.notify_assessments}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, notify_assessments: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base">Enrollment Notifications</Label>
                            <span className="text-sm text-muted-foreground">
                                Updates about new student enrollments
                            </span>
                        </div>
                        <Switch
                            checked={prefs.notify_enrollments}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, notify_enrollments: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label className="text-base">Announcements</Label>
                            <span className="text-sm text-muted-foreground">
                                System-wide announcements and updates
                            </span>
                        </div>
                        <Switch
                            checked={prefs.notify_announcements}
                            onCheckedChange={(checked) => 
                                setPrefs(p => ({ ...p, notify_announcements: checked }))
                            }
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Preferences"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
