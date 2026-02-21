'use client';

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
  LogOut,
  Sparkles,
  Building2,
  Clock,
  Video,
  FileText
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  return (
    <div className={cn("flex h-full w-72 flex-col border-r bg-background/50 backdrop-blur-xl relative overflow-hidden", className)}>
      {/* Background Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-zinc-500/5 to-transparent pointer-events-none" />

      {/* Logo Area */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-all duration-300">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Academix
            </h1>
            <p className="text-xs text-muted-foreground tracking-wider font-medium">PREMIUM SUITE</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-2">Menu</div>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User / Footer */}
      <div className="p-4 border-t bg-black/5 dark:bg-white/5">
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
      </div>
    </div>
  );
}
