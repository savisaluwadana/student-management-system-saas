import { redirect } from 'next/navigation';
import { Check, CreditCard, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const included = [
  'Up to 500 active students',
  'Unlimited classes and sessions',
  'Attendance, assessments and reports',
  'Payment and overdue tracking',
  'Email, SMS and WhatsApp workflows',
  'Multi-branch institute management',
];

export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Account
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & plan</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Understand workspace limits and the capabilities available to your institute.
          </p>
        </div>
        <Badge className="w-fit rounded-full px-3 py-1" variant="secondary">Professional trial</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Professional
                  <Sparkles className="h-4 w-4" />
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Built for growing tuition centres and private institutes.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tracking-tight">LKR 14,900</div>
                <div className="text-xs text-muted-foreground">per workspace / month</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            {included.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="h-3 w-3" />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Workspace usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Usage label="Students" value="86 / 500" percent={17} icon={Users} />
            <Usage label="Team members" value="6 / 20" percent={30} icon={ShieldCheck} />
            <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              Usage metering is ready for subscription enforcement. Connect a payment provider before enabling self-service plan changes in production.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PlanCard name="Starter" price="LKR 5,900" copy="For small classes getting off spreadsheets." features="50 students · 3 team members" />
        <PlanCard name="Professional" price="LKR 14,900" copy="For growing education businesses." features="500 students · 20 team members" current />
        <PlanCard name="Scale" price="Custom" copy="For multi-branch education groups." features="Unlimited scale · SSO · SLA" />
      </div>
    </div>
  );
}

function Usage({
  label,
  value,
  percent,
  icon: Icon,
}: {
  label: string;
  value: string;
  percent: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

function PlanCard({
  name,
  price,
  copy,
  features,
  current = false,
}: {
  name: string;
  price: string;
  copy: string;
  features: string;
  current?: boolean;
}) {
  return (
    <Card className={current ? 'border-foreground shadow-sm' : 'border-border/70 shadow-sm'}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{name}</p>
          {current && <Badge variant="secondary">Current</Badge>}
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{price}</p>
        <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
        <p className="mt-4 border-t pt-4 text-xs font-medium text-muted-foreground">{features}</p>
      </CardContent>
    </Card>
  );
}
