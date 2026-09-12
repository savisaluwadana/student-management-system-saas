import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { getCurrentUser } from '@/lib/auth/auth';

// Every route in this workspace depends on authenticated request state and/or
// live MongoDB data. Explicitly opt the route group out of static generation so
// production builds never need database credentials just to prerender pages.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Middleware is intentionally lightweight. The server layout is the source of
  // truth for protected application routes and verifies the signed JWT.
  if (!user) {
    redirect('/login');
  }

  const userForLayout = {
    id: user.id,
    email: user.email,
    user_metadata: { full_name: user.full_name, role: user.role },
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar user={userForLayout} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden h-full md:flex">
          <Sidebar user={userForLayout} />
        </aside>
        <main className="relative flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.06),transparent_30%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.35))]">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
