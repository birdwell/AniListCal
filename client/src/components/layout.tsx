import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Calendar, User, LogOut } from "lucide-react";
import authService from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await authService.logout();
      // The redirect to login will be handled by the protected route component
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="link" className={location === "/" ? "text-primary" : ""}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="link" className={location === "/calendar" ? "text-primary" : ""}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="link" className={location === "/profile" ? "text-primary" : ""}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
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
      <main className="container pt-20 pb-8">
        {children}
      </main>
    </div>
  );
}