'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Mail, UserRoundPlus, X } from 'lucide-react';
import { revokeTeacherInvite, type PendingTeacherInvite } from '@/lib/actions/teachers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export function PendingInvites({ invites }: { invites: PendingTeacherInvite[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (invites.length === 0) return null;

  const revoke = (invite: PendingTeacherInvite) => {
    setPendingId(invite.id);
    startTransition(async () => {
      try {
        const result = await revokeTeacherInvite(invite.id);
        if (!result.success) {
          toast({
            variant: 'destructive',
            title: 'Could not revoke invitation',
            description: result.error || 'Please try again.',
          });
          return;
        }

        toast({
          title: 'Invitation revoked',
          description: `${invite.email} can no longer use that invitation.`,
        });
        router.refresh();
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRoundPlus className="h-4 w-4" />
              Pending invitations
            </CardTitle>
            <CardDescription className="mt-1">
              Invitation links expire automatically after seven days.
            </CardDescription>
          </div>
          <Badge variant="secondary">{invites.length} pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {invites.map((invite) => {
          const expires = new Date(invite.expires_at);
          const loading = isPending && pendingId === invite.id;

          return (
            <div
              key={invite.id}
              className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{invite.email}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Expires {expires.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span>{invite.class_count} class{invite.class_count === 1 ? '' : 'es'} assigned</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => revoke(invite)}
                className="self-start text-muted-foreground hover:text-destructive sm:self-auto"
              >
                <X className="mr-1.5 h-4 w-4" />
                {loading ? 'Revoking...' : 'Revoke'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
