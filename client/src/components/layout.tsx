import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Search, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import { ProfileNavAvatar } from "@/components/profile-nav-avatar";

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
      <nav
        className="fixed inset-x-0 top-0 z-50 hidden h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:block"
        aria-label="Desktop navigation"
      >
        <div className="mx-auto flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16">
          <div className="flex h-full items-center gap-8">
            <Link
              href="/"
              className="rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="AniListCal home"
            >
              <BrandMark />
            </Link>
            <div className="flex h-full items-center">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(location, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-full items-center gap-2 px-3 text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
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

      <main className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain pb-8 pt-[calc(1rem_+_env(safe-area-inset-top))] md:overflow-visible md:overscroll-auto md:pb-12 md:pt-24">
        {children}
      </main>

      <nav
        className="shrink-0 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
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
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {href === "/profile" ? (
                  <ProfileNavAvatar active={active} />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden />
                )}
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
