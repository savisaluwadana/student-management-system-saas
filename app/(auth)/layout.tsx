import Link from 'next/link';
import { Sparkles, GraduationCap, BarChart3, ShieldCheck, Users } from 'lucide-react';

const features = [
  { icon: GraduationCap, text: 'Student & class management' },
  { icon: BarChart3, text: 'Real-time analytics & reports' },
  { icon: ShieldCheck, text: 'Secure payment tracking' },
  { icon: Users, text: 'Multi-role access control' },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding + Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Academix</h1>
              <p className="text-xs text-zinc-400 tracking-wider font-medium">PREMIUM SUITE</p>
            </div>
          </Link>

          {/* Hero content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-extrabold text-white leading-tight">
                Manage your institute <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                  with superpowers
                </span>
              </h2>
              <p className="text-zinc-400 mt-4 text-lg max-w-md leading-relaxed">
                The all-in-one platform for modern education management. Everything you need, beautifully designed.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-zinc-300 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-zinc-500 text-sm">
            © 2026 Academix. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Academix</h1>
              <p className="text-xs text-muted-foreground tracking-wider font-medium">PREMIUM SUITE</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
