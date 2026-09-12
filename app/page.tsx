import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  CircleDollarSign,
  GraduationCap,
  Layers3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { icon: Users, title: 'Student CRM', copy: 'Profiles, enrollments, guardian information, barcodes and searchable records.' },
  { icon: CalendarCheck2, title: 'Attendance operations', copy: 'Manual, bulk and barcode attendance with trend reporting.' },
  { icon: CircleDollarSign, title: 'Fees & collections', copy: 'Track paid, pending and overdue fees with printable receipts.' },
  { icon: GraduationCap, title: 'Academic workflows', copy: 'Classes, sessions, assessments, grades and learning resources in one place.' },
  { icon: MessageSquareText, title: 'Communications', copy: 'Coordinate student and guardian outreach without switching systems.' },
  { icon: BarChart3, title: 'Management reporting', copy: 'See operational health, attendance and revenue from a unified dashboard.' },
];

const plans = [
  { name: 'Starter', price: 'LKR 5,900', description: 'For small classes moving off spreadsheets.', items: ['Up to 50 students', '3 team members', 'Attendance & fees', 'Core reporting'] },
  { name: 'Professional', price: 'LKR 14,900', description: 'For growing tuition centres and academies.', items: ['Up to 500 students', '20 team members', 'Multi-branch workflows', 'Advanced operations'], featured: true },
  { name: 'Scale', price: 'Custom', description: 'For larger education groups and multi-site teams.', items: ['Unlimited scale', 'Priority support', 'SSO & governance', 'Custom integrations'] },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold tracking-tight">Academix</p>
              <p className="text-[10px] leading-none text-muted-foreground">Education operations OS</p>
            </div>
          </Link>

          <div className="mx-auto hidden items-center gap-7 md:flex">
            <a href="#product" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Product</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
            <Link href="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Docs</Link>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild><Link href="/login">Log in</Link></Button>
            <Button asChild><Link href="/signup">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </nav>

      <section className="relative border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.09),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <Badge variant="outline" className="mb-6 rounded-full px-3 py-1">Built for modern education operators</Badge>
            <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Run the institute, not the admin chaos.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Academix brings students, attendance, classes, fees, assessments, communications and reporting into one focused operating system.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-6" asChild>
                <Link href="/signup">Create your workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6" asChild>
                <Link href="/login">Open existing workspace</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> No credit card for setup</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Role-aware access</span>
              <span className="flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5" /> Multi-branch ready</span>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">One workspace</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The daily operating layer for an education business.</h2>
          <p className="mt-4 text-muted-foreground">Designed around the workflows staff actually repeat every day, with less jumping between spreadsheets, chat threads and disconnected tools.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/70 shadow-none transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/25">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-3 lg:px-8">
          <Outcome value="1" label="workspace" copy="for students, academics and operations" />
          <Outcome value="3" label="attendance modes" copy="manual, bulk and barcode scanning" />
          <Outcome value="360°" label="operating view" copy="collections, attendance, classes and activity" />
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Start small. Scale when operations demand it.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Plans are structured around workspace scale rather than charging staff for every useful feature.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.featured ? 'border-foreground shadow-lg' : 'border-border/70 shadow-sm'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.featured && <Badge>Best fit</Badge>}
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight">{plan.price}</p>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                <div className="my-5 border-t" />
                <div className="space-y-3">
                  {plan.items.map((item) => <div key={item} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4" />{item}</div>)}
                </div>
                <Button variant={plan.featured ? 'default' : 'outline'} className="mt-6 w-full" asChild>
                  <Link href="/signup">Start with {plan.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-foreground px-6 py-14 text-background sm:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/55">Less admin. Better visibility.</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Build the operating system your institute can grow on.</h2>
              <p className="mt-3 text-sm leading-6 text-background/65">Start with your core student workflows and expand into reporting, multi-branch management and automation as your operation matures.</p>
            </div>
            <Button size="lg" variant="secondary" asChild><Link href="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2 text-foreground"><Sparkles className="h-4 w-4" /><span className="font-semibold">Academix</span></div>
          <p>Student operations, attendance, academics and collections in one workspace.</p>
          <div className="flex gap-4"><Link href="/docs" className="hover:text-foreground">Docs</Link><Link href="/login" className="hover:text-foreground">Login</Link></div>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-full bg-foreground/5 blur-3xl" />
      <div className="overflow-hidden rounded-[26px] border bg-background shadow-2xl shadow-foreground/10">
        <div className="flex h-12 items-center gap-2 border-b px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/15" />
          <span className="ml-2 text-[11px] font-medium text-muted-foreground">Academix Institute · Operations overview</span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <PreviewMetric label="Students" value="248" icon={Users} />
            <PreviewMetric label="Attendance" value="92%" icon={CalendarCheck2} />
            <PreviewMetric label="Collected" value="LKR 1.2M" icon={CircleDollarSign} />
            <PreviewMetric label="Classes" value="18" icon={GraduationCap} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_.7fr]">
            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold">Collections trend</p><BarChart3 className="h-4 w-4 text-muted-foreground" /></div>
              <div className="mt-6 flex h-28 items-end gap-2">
                {[36, 52, 45, 70, 63, 86].map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-foreground/80" style={{ height: `${height}%` }} />)}
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold">Today</p>
              <div className="mt-4 space-y-3">
                {['Mark Grade 10 attendance', 'Review overdue fees', 'Publish assessment'].map((item, index) => (
                  <div key={item} className="flex items-start gap-2 text-[11px]"><span className={`mt-0.5 h-3.5 w-3.5 rounded-full border ${index === 0 ? 'bg-foreground' : ''}`} /><span>{item}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return <div className="rounded-2xl border bg-muted/20 p-3.5"><div className="flex items-center justify-between"><p className="text-[10px] font-medium text-muted-foreground">{label}</p><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div><p className="mt-2 text-lg font-bold tracking-tight">{value}</p></div>;
}

function Outcome({ value, label, copy }: { value: string; label: string; copy: string }) {
  return <div><p className="text-4xl font-bold tracking-tight">{value}</p><p className="mt-1 text-sm font-semibold">{label}</p><p className="mt-2 text-sm text-muted-foreground">{copy}</p></div>;
}
