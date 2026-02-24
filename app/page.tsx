import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Zap,
  BarChart3,
  Clock,
  Star,
  GraduationCap,
  Building2,
  Globe,
} from 'lucide-react';
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
                Academix
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
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
            <span className="text-sm font-medium text-muted-foreground">v2.0 — Now with AI-powered insights</span>
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
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem icon={Users} value="10,000+" label="Active Students" />
            <StatItem icon={Building2} value="500+" label="Institutes" />
            <StatItem icon={Globe} value="15+" label="Countries" />
            <StatItem icon={Star} value="4.9/5" label="Average Rating" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to run your institute</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop wrestling with spreadsheets. Academix provides a unified dashboard for all your administrative needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={LayoutDashboard} title="Smart Dashboard" description="Get a bird's eye view of your institute's performance with real-time analytics and insights." />
            <FeatureCard icon={Users} title="Student Management" description="Track student profiles, attendance, and academic progress in one secure place." />
            <FeatureCard icon={ShieldCheck} title="Secure Payments" description="Record fees, generate invoices, and track revenue with bank-grade security." />
            <FeatureCard icon={GraduationCap} title="Assessments & Grades" description="Create exams, enter grades, and generate comprehensive report cards automatically." />
            <FeatureCard icon={Clock} title="Session Scheduling" description="Manage class sessions, tutorials, and generate automated schedules with ease." />
            <FeatureCard icon={BarChart3} title="Advanced Reports" description="Generate financial, attendance, and academic reports with export to PDF and CSV." />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that fits your institute. All plans come with a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Starter"
              price="$19"
              description="Perfect for small tutoring centers"
              features={['Up to 50 students', '3 classes', 'Basic reports', 'Email support', 'Attendance tracking']}
            />
            <PricingCard
              name="Professional"
              price="$49"
              description="For growing institutes"
              features={['Up to 500 students', 'Unlimited classes', 'Advanced analytics', 'Priority support', 'SMS & WhatsApp', 'Custom branding', 'API access']}
              popular
            />
            <PricingCard
              name="Enterprise"
              price="$99"
              description="For large multi-branch institutes"
              features={['Unlimited students', 'Multi-branch support', 'White-label solution', 'Dedicated account manager', 'SLA guarantee', 'Custom integrations', 'On-premise option']}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-slate-50 dark:bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Loved by educators worldwide</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what institute directors and teachers are saying about Academix.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Academix has transformed how we manage our institute. We saved 15 hours per week on administrative tasks."
              name="Sarah Chen"
              role="Director, EduCore Academy"
            />
            <TestimonialCard
              quote="The attendance tracking and payment management features are incredible. Our collection rate improved by 30%."
              name="Rajesh Patel"
              role="Founder, BrightMinds Tutoring"
            />
            <TestimonialCard
              quote="As a teacher, I love how easy it is to manage grades and communicate with students. The interface is beautiful."
              name="Emma Williams"
              role="Senior Teacher, TechEd Institute"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-3xl blur-3xl opacity-10" />
            <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-12 md:p-16 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to transform your institute?</h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                Join 500+ institutes already using Academix. Start your 14-day free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl transition-all hover:scale-105">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                  Academix
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                The all-in-one platform for modern education management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            © 2026 Academix Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="space-y-2">
      <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, description, features, popular }: { name: string; price: string; description: string; features: string[]; popular?: boolean }) {
  return (
    <Card className={`relative ${popular ? 'border-primary shadow-xl shadow-primary/10 scale-105' : 'hover:shadow-lg'} transition-all duration-300`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white shadow-lg">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="pt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
        <Link href="/signup" className="block pt-4">
          <Button className={`w-full ${popular ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20' : ''}`} variant={popular ? 'default' : 'outline'}>
            Start Free Trial
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
