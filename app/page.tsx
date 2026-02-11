import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, LayoutDashboard, ShieldCheck, Users, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                EduFlow
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">v2.0 is now live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Manage your institute <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-600 to-pink-600">
              with superpowers
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            The all-in-one platform for modern education management. Track attendance, payments, sessions, and tutorials effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full border-2 hover:bg-secondary transition-all">
                Live Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to run your class</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop wrestling with spreadsheets. EduFlow provides a unified dashboard for all your administrative needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={LayoutDashboard}
              title="Smart Dashboard"
              description="Get a bird's eye view of your institute's performance with real-time analytics and insights."
              delay={0}
            />
            <FeatureCard
              icon={Users}
              title="Student Management"
              description="Track student profiles, attendance, and academic progress in one secure place."
              delay={0.1}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Secure Payments"
              description="Record fees, generating invoices, and track revenue with bank-grade security/logging."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Stack Utility Section */}
      <section className="py-24 border-t bg-slate-50 dark:bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for growth</h2>
              <div className="space-y-4">
                {[
                  "Unlimited students and classes",
                  "Role-based access control (Admin, Teacher, Student)",
                  "Automated attendance tracking",
                  "Cloud-based & secure",
                  "Mobile-friendly interface"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-8 border shadow-xl">
                <div className="space-y-4">
                  <div className="h-2 w-1/3 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-24 w-full bg-slate-100 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                    <div className="h-2 w-5/6 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <div className="h-10 w-24 bg-primary/20 rounded animate-pulse" />
                    <div className="h-10 w-24 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
          <div>
            © 2024 EduFlow Inc. All rights reserved.
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: any) {
  return (
    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
