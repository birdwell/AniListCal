import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Search, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function isNavActive(location: string, href: string): boolean {
  if (href === "/") {
    return location === "/";
  }
  return location === href || location.startsWith(`${href}/`);
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const handleLogout = () => {
    // logout() clears local state and redirects to /login itself.
    void logout();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:h-auto md:min-h-screen md:overflow-visible">
      <nav className="fixed top-0 left-0 right-0 z-50 hidden h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
        <div className="mx-auto flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16">
          <div className="flex items-center gap-6">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={
                    isNavActive(location, href) ? "bg-accent text-primary" : ""
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain pt-[calc(1rem_+_env(safe-area-inset-top))] md:overflow-visible md:overscroll-auto md:pb-8 md:pt-20">
        {children}
      </main>

      <nav
        className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="grid h-16 grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(location, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
