import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Palette, CheckCircle2, ShieldCheck, Zap, Info, 
  Database, Layout, Server, Users, GraduationCap, DollarSign, 
  MessageCircle, BarChart, BookOpen, Clock
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="space-y-4 text-center">
        <Badge variant="secondary" className="px-4 py-1 rounded-full text-zinc-600">v2.1.0 Release</Badge>
        <h1 className="text-5xl font-extrabold tracking-tight">Academix Technical Documentation</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          A comprehensive guide to the architecture, design systems, and core modules of the Student Management System.
        </p>
      </div>

      {/* Architecture Overview */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
          <Server className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold">System Architecture</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-none shadow-sm capitalize group hover:bg-zinc-100 transition-colors duration-300">
            <CardHeader>
              <Layout className="h-8 w-8 mb-2 text-zinc-400 group-hover:text-primary transition-colors" />
              <CardTitle>Frontend Layer</CardTitle>
              <CardDescription>Next.js 14 App Router</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Utilizes React Server Components (RSC) for performance, with Tailwind CSS for high-fidelity monochrome styling.
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900 border-none shadow-sm capitalize group hover:bg-zinc-100 transition-colors duration-300">
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-zinc-400 group-hover:text-primary transition-colors" />
              <CardTitle>Logic Layer</CardTitle>
              <CardDescription>Server Actions & API Routes</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              All business logic is encapsulated in type-safe Server Actions (located in <code>lib/actions</code>) for secure data mutation.
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900 border-none shadow-sm capitalize group hover:bg-zinc-100 transition-colors duration-300">
            <CardHeader>
              <Database className="h-8 w-8 mb-2 text-zinc-400 group-hover:text-primary transition-colors" />
              <CardTitle>Data Layer</CardTitle>
              <CardDescription>MongoDB & Mongoose</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              A document-oriented database architecture using Mongoose ODM for schema validation and optimized aggregation pipelines.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Components Deep Dive */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-2">
          <FileText className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold">Core Modules</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* User & Students */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" /> Student & Teacher Registry
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Manages comprehensive profiles for students and teachers. Includes smart-card generation, 
              enrollment history, and document management. Secure authentication handles role-based 
              access control (RBAC) between Admin and Teacher accounts.
            </p>
          </div>

          {/* Attendance */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" /> Attendance Tracking
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Features a dual-mode tracking system: manual entry and automated Barcode/QR scanning. 
              Real-time dashboards provide "Attendance Risk" alerts for students falling below specific thresholds.
            </p>
          </div>

          {/* Finances */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Financial Management
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automated fee collection, invoice generation, and financial reporting. 
              The system tracks overdue payments and sends automated reminders via WhatsApp and SMS.
            </p>
          </div>

          {/* Academics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Academic Assessment
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Handles exam creation, grade entry, and automated report card generation. 
              Includes academic performance analytics to track progress over multiple sessions and tutorials.
            </p>
          </div>
        </div>
      </section>

      {/* Design System */}
      <section className="p-8 rounded-3xl bg-zinc-900 text-white space-y-6">
        <div className="flex items-center gap-3 border-b border-white/20 pb-2">
          <Palette className="h-7 w-7 text-zinc-400" />
          <h2 className="text-3xl font-bold">Monochrome Design System</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Visual Philosophy</h4>
            <p className="text-zinc-400 text-sm italic">
              "Clarity through constraint."
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              By removing traditional semantic colors (red/green/blue), we force focus onto critical data 
              and structural hierarchy. Typography and spatial layout become the primary signals for urgency and importance.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Key Tokens</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><div className="h-3 w-3 bg-white rounded-full" /> Foreground: White (#FFFFFF)</li>
              <li className="flex items-center gap-2"><div className="h-3 w-3 bg-zinc-400 rounded-full" /> Muted: Zinc-400</li>
              <li className="flex items-center gap-2"><div className="h-3 w-3 bg-zinc-800 rounded-full" /> Border: Zinc-800</li>
              <li className="flex items-center gap-2"><div className="h-3 w-3 bg-black rounded-full" /> Background: Black (#000000)</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="pt-12 border-t text-center space-y-4">
        <div className="flex justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" /> Next.js 14</div>
          <div className="flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" /> MongoDB</div>
          <div className="flex items-center gap-1 text-sm"><CheckCircle2 className="h-4 w-4" /> TypeScript</div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">© 2026 Academix Engineering Team</p>
      </footer>
    </div>
  );
}
