'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/shared/cn';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  DollarSign,
  MessageSquare,
  Settings,
  LayoutDashboard,
  UserCog,
  Sparkles,
  Building2,
  Clock,
  Video,
  FileText,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Institutes', href: '/institutes', icon: Building2 },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Teachers', href: '/teachers', icon: UserCog },
  { name: 'Classes', href: '/classes', icon: BookOpen },
  { name: 'Sessions', href: '/sessions', icon: Clock },
  { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { name: 'Tutorials', href: '/tutorials', icon: Video },
  { name: 'Assessments', href: '/assessments', icon: GraduationCap },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className, user }: { className?: string; user?: any }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex h-full flex-col border-r bg-background/50 backdrop-blur-xl relative overflow-hidden transition-all duration-300",
        collapsed ? "w-[68px]" : "w-72",
        className
      )}>
        {/* Background Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-zinc-500/5 to-transparent pointer-events-none" />

        {/* Logo Area */}
        <div className={cn("p-4", collapsed ? "px-3" : "p-6")}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-all duration-300 flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Academix
                </h1>
                <p className="text-xs text-muted-foreground tracking-wider font-medium">PREMIUM SUITE</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {!collapsed && (
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-3">Menu</div>
          )}
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ease-out',
                  collapsed ? 'justify-center p-3' : 'px-4 py-3',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                    !collapsed && 'mr-3',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!collapsed && (
                  <>
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50 animate-pulse" />
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>

        {/* Collapse Toggle */}
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full justify-center h-8 text-muted-foreground hover:text-foreground", !collapsed && "justify-start px-4")}
            onClick={toggleCollapsed}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : (
              <>
                <ChevronsLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* User / Footer */}
        <div className="p-3 border-t bg-black/5 dark:bg-white/5">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings" className="flex justify-center p-1 rounded-xl hover:bg-background/50 transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-white dark:border-zinc-800 shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata?.full_name || user?.email || 'User'}`} />
                    <AvatarFallback>{(user?.email || 'AD').substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.user_metadata?.full_name || 'Settings'}</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/settings" className="flex items-center gap-3 p-2 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group">
              <Avatar className="h-9 w-9 border-2 border-white dark:border-zinc-800 shadow-sm group-hover:border-zinc-400 transition-colors">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata?.full_name || user?.email || 'User'}`} />
                <AvatarFallback>{(user?.email || 'AD').substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || 'No email'}</p>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
