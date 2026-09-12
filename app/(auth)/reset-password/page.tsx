'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MailCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not request reset',
          description: data.error || 'Please check the email address and try again.',
        });
        return;
      }

      setSent(true);
      toast({
        title: 'Request received',
        description: data.message || 'If the account exists, a reset link will be sent shortly.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Could not request reset',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your account email to request a one-time reset link.</CardDescription>
      </CardHeader>
      {sent ? (
        <>
          <CardContent className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Check your inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                If an account exists for that email and delivery succeeds, the link will arrive shortly and expire after 30 minutes.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Request another link
            </Button>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary">Back to login</Link>
          </CardFooter>
        </>
      ) : (
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting...</> : 'Send reset link'}
            </Button>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary">Back to login</Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
