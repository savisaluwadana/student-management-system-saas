'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const benefits = [
  'Professional plan free for 14 days',
  'Up to 500 active students during the trial',
  'Attendance, payments, assessments and multi-branch operations',
];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          workspace_name: workspaceName || undefined,
        }),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw || `Request failed (${res.status})` };
      }

      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not create workspace',
          description: data.error || 'Signup failed',
        });
        return;
      }

      toast({
        title: 'Workspace created',
        description: 'Your Professional trial is ready.',
      });
      window.location.assign('/dashboard');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your workspace</h2>
        <p className="text-muted-foreground">Set up your education operations workspace in minutes.</p>
      </div>

      <div className="space-y-2">
        {benefits.map((benefit) => (
          <div key={benefit} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-zinc-800 flex-shrink-0 dark:text-zinc-200" />
            <span className="text-muted-foreground">{benefit}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">Your name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-11 bg-white dark:bg-zinc-900 border-border/50 focus-visible:ring-primary/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspaceName" className="text-sm font-medium">Institute / workspace name</Label>
          <Input
            id="workspaceName"
            type="text"
            placeholder="Bright Minds Academy"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="h-11 bg-white dark:bg-zinc-900 border-border/50 focus-visible:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground">You can add branches and team members after signup.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-white dark:bg-zinc-900 border-border/50 focus-visible:ring-primary/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-11 pr-10 bg-white dark:bg-zinc-900 border-border/50 focus-visible:ring-primary/30"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating workspace...
            </>
          ) : (
            'Start 14-day trial'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link href="#" className="text-primary hover:underline">Terms</Link>{' '}and{' '}
          <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 dark:bg-zinc-950 px-2 text-muted-foreground">Already have an account?</span>
        </div>
      </div>

      <Link href="/login" className="block">
        <Button variant="outline" className="w-full h-11 text-base font-medium border-border/50 hover:bg-muted/50">
          Sign in
        </Button>
      </Link>
    </div>
  );
}
