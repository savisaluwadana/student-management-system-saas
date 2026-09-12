'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/shared/cn';
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Video,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const workspaceNavigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Teachers', href: '/teachers', icon: UserCog },
  { name: 'Classes', href: '/classes', icon: BookOpen },
  { name: 'Sessions', href: '/sessions', icon: Clock },
  { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { name: 'Assessments', href: '/assessments', icon: GraduationCap },
  { name: 'Tutorials', href: '/tutorials', icon: Video },
];

const operationsNavigation: NavItem[] = [
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Institutes', href: '/institutes', icon: Building2, adminOnly: true },
];

const accountNavigation: NavItem[] = [
  { name: 'Billing & plan', href: '/billing', icon: CreditCard, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Documentation', href: '/docs', icon: FileText },
];

export function Sidebar({ className, user }: { className?: string; user?: any }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const role = user?.user_metadata?.role || 'teacher';
  const isAdmin = role === 'admin';

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      try {
        setCollapsed(JSON.parse(saved));
      } catch {
        localStorage.removeItem('sidebar-collapsed');
      }
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const renderItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;

    const active = isActive(item.href);
    const content = (
      <Link
        href={item.href}
        className={cn(
          'group relative flex min-h-10 items-center rounded-xl text-sm font-medium transition-all duration-200',
          collapsed ? 'justify-center px-2' : 'px-3',
          active
            ? 'bg-foreground text-background shadow-sm'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        )}
      >
        <item.icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105',
            !collapsed && 'mr-3'
          )}
        />
        {!collapsed && <span className="truncate">{item.name}</span>}
        {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-background/70" />}
      </Link>
    );

    return collapsed ? (
      <Tooltip key={item.name}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>{item.name}</TooltipContent>
      </Tooltip>
    ) : (
      <div key={item.name}>{content}</div>
    );
  };

  const renderGroup = (label: string, items: NavItem[]) => (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
          {label}
        </p>
      )}
      {items.map(renderItem)}
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'relative flex h-full flex-col border-r bg-background/92 backdrop-blur-xl transition-[width] duration-300',
          collapsed ? 'w-[72px]' : 'w-[272px]',
          className
        )}
      >
        <div className={cn('border-b p-4', collapsed && 'px-3')}>
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-lg font-bold tracking-tight">Academix</span>
                  <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">SaaS</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">Education operations OS</p>
              </div>
            )}
          </Link>
        </div>

        {!collapsed && (
          <div className="mx-3 mt-3 rounded-xl border bg-muted/35 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">Primary workspace</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Academix Institute</p>
              </div>
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
          {renderGroup('Workspace', workspaceNavigation)}
          {renderGroup('Operations', operationsNavigation)}
          {renderGroup('Account', accountNavigation)}
        </div>

        {!collapsed && isAdmin && (
          <div className="mx-3 mb-3 rounded-2xl border bg-foreground p-3.5 text-background shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">Professional trial</p>
              <Sparkles className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-background/65">
              Unlock automation, multi-branch controls and advanced analytics.
            </p>
            <Link href="/billing" className="mt-3 inline-flex text-[11px] font-bold underline underline-offset-4">
              Review plan
            </Link>
          </div>
        )}

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('mb-2 h-9 w-full text-muted-foreground', collapsed ? 'justify-center px-0' : 'justify-start px-3')}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="mr-2 h-4 w-4" /><span className="text-xs">Collapse navigation</span></>}
          </Button>

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings" className="flex justify-center rounded-xl p-1.5 hover:bg-muted">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata?.full_name || user?.email || 'User'}`} />
                    <AvatarFallback>{(user?.email || 'AD').substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Account settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/settings" className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/70">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata?.full_name || user?.email || 'User'}`} />
                <AvatarFallback>{(user?.email || 'AD').substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="truncate text-[11px] capitalize text-muted-foreground">{role} account</p>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
