import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  FileText,
  GraduationCap,
  Layout,
  Palette,
  Server,
  Users,
  Zap,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 p-6 animate-in fade-in duration-700">
      <div className="space-y-4 text-center">
        <Badge variant="secondary" className="rounded-full px-4 py-1 text-zinc-600">Academix platform</Badge>
        <h1 className="text-5xl font-extrabold tracking-tight">Academix technical documentation</h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Architecture, core modules and implementation notes for the education operations platform.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
          <Server className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold">System architecture</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none bg-zinc-50 shadow-sm transition-colors duration-300 hover:bg-zinc-100 dark:bg-zinc-900">
            <CardHeader>
              <Layout className="mb-2 h-8 w-8 text-zinc-400" />
              <CardTitle>Frontend layer</CardTitle>
              <CardDescription>Next.js 14 App Router</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              React Server Components, client components where interaction is required, Tailwind CSS and reusable Radix-based UI primitives.
            </CardContent>
          </Card>

          <Card className="border-none bg-zinc-50 shadow-sm transition-colors duration-300 hover:bg-zinc-100 dark:bg-zinc-900">
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-zinc-400" />
              <CardTitle>Application layer</CardTitle>
              <CardDescription>Server Actions &amp; API Routes</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Domain operations live under <code>lib/actions</code>, with route handlers used for authentication, receipts and integration-facing endpoints.
            </CardContent>
          </Card>

          <Card className="border-none bg-zinc-50 shadow-sm transition-colors duration-300 hover:bg-zinc-100 dark:bg-zinc-900">
            <CardHeader>
              <Database className="mb-2 h-8 w-8 text-zinc-400" />
              <CardTitle>Data layer</CardTitle>
              <CardDescription>MongoDB &amp; Mongoose</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Mongoose models provide the current persistence layer for students, teachers, classes, attendance, payments and related records.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-2">
          <FileText className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold">Core modules</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <Users className="h-5 w-5" /> Student &amp; teacher registry
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Manages student and teacher profiles, enrollment information and barcode workflows. Authentication currently supports Admin and Teacher roles.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <Clock className="h-5 w-5" /> Attendance tracking
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Supports manual, bulk and barcode-based attendance, with rolling attendance trends and reporting for operational follow-up.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <DollarSign className="h-5 w-5" /> Financial management
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tracks paid, pending and overdue fees, generates printable LKR receipts and exposes communication integration points for reminders.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <GraduationCap className="h-5 w-5" /> Academic assessment
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Supports assessment creation, grade entry and academic progress workflows across classes, sessions and learning resources.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl bg-zinc-900 p-8 text-white">
        <div className="flex items-center gap-3 border-b border-white/20 pb-2">
          <Palette className="h-7 w-7 text-zinc-400" />
          <h2 className="text-3xl font-bold">Product design system</h2>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Visual philosophy</h4>
            <p className="text-sm italic text-zinc-400">Clarity through constraint.</p>
            <p className="text-sm leading-relaxed text-zinc-400">
              The interface uses a restrained neutral system so hierarchy, spacing and typography carry most of the visual meaning while operational states remain easy to scan.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-bold">Key tokens</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-white" /> Foreground: White</li>
              <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-zinc-400" /> Muted: Zinc</li>
              <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-zinc-800" /> Border: Dark zinc</li>
              <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-black" /> Background: Black</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="space-y-4 border-t pt-12 text-center">
        <div className="flex justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" /> Next.js 14</div>
          <div className="flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" /> MongoDB</div>
          <div className="flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" /> TypeScript</div>
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Academix engineering documentation</p>
      </footer>
    </div>
  );
}
