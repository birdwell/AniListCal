import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { getUser, clearAuthData, AuthError, ANILIST_TOKEN_EXPIRED_CODE } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Show from "@/pages/show";
import Login from "@/pages/login";
import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import CalendarPage from "./pages/calendar";
import { QueryProvider } from "@/components/query-provider";
import { queryKeys } from "@/lib/queryKeys";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isFetched, error } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error instanceof AuthError) {
      clearAuthData();
      if (error.code === ANILIST_TOKEN_EXPIRED_CODE) {
        setLocation(`/login?error=${encodeURIComponent(error.message)}`);
      } else {
        setLocation("/login");
      }
    } else if (isFetched && !isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, isFetched, user, error, setLocation]);

  if (isLoading || !isFetched) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Component />;
  }

  return null;
}

function Router() {
  const [location] = useLocation();
  const showLayout = !["/login", "/auth-error"].includes(location);

  const content = (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/auth-error" component={() => (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Something went wrong during authentication. Please try logging in again.</p>
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      )} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={CalendarPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/show/:id" component={() => <ProtectedRoute component={Show} />} />
      <Route component={NotFound} />
    </Switch>
  );

  return showLayout ? <Layout>{content}</Layout> : content;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="anime-tracker-theme">
      <QueryProvider>
        <Router />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
