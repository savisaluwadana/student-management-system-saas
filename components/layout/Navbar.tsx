'use client';

import Link from 'next/link';
import { Bell, HelpCircle, LogOut, Menu, Search, Settings, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar({ user }: { user?: any }) {
  const { toast } = useToast();

  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

    if (!response.ok) {
      toast({
        title: 'Could not log out',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    window.location.assign('/login');
  };

  const openCommandMenu = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[288px] p-0">
            <Sidebar className="w-full border-none" user={user} />
          </SheetContent>
        </Sheet>

        <Link href="/dashboard" className="mr-2 flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight">Academix</span>
        </Link>

        <div className="hidden min-w-0 md:block">
          <p className="text-xs font-medium text-muted-foreground">Workspace</p>
          <p className="truncate text-sm font-semibold">Academix Institute</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            className="relative h-9 w-9 justify-center border-border/70 bg-muted/30 p-0 text-muted-foreground shadow-none hover:bg-muted sm:w-64 sm:justify-start sm:px-3"
            onClick={openCommandMenu}
          >
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline-flex">Search students, classes, actions…</span>
            <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium sm:flex">
              <span>⌘</span>K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild>
            <Link href="/docs" aria-label="Help and documentation">
              <HelpCircle className="h-[18px] w-[18px]" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => toast({ title: 'You are all caught up', description: 'No new operational alerts right now.' })}
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-foreground ring-2 ring-background" />
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                <User className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate text-sm">{user?.user_metadata?.full_name || 'Account'}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account settings
                </Link>
              </DropdownMenuItem>
              {user?.user_metadata?.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Billing & plan
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
