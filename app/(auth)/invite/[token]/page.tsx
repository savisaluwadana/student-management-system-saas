'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: params.token,
          full_name: fullName,
          phone: phone || undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not accept invitation',
          description: data.error || 'The invitation may have expired.',
        });
        return;
      }

      setAccepted(true);
      setTimeout(() => window.location.assign('/dashboard'), 450);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Please try accepting the invitation again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">You&apos;re in</h2>
          <p className="text-muted-foreground">Your workspace account is ready. Opening your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-background shadow-sm">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Join the workspace</h2>
          <p className="mt-1 text-muted-foreground">Create your account to accept this Academix team invitation.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your name"
            required
            minLength={2}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+94 77 123 4567"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Choose a password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              className="h-11 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
        </div>

        <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining workspace…</> : 'Accept invitation'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already have an Academix account? <Link href="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
