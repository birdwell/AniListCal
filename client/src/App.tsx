import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, ReactElement, useState } from "react";
import { handleAuthCallback, getUser } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import Show from "@/pages/show";
import Login from "@/pages/login";
import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setError('No authorization code received');
      return;
    }

    handleAuthCallback(code)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      })
      .catch(err => {
        console.error('Auth error:', err);
        setError(err.message);
      });
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-destructive">Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => window.location.href = '/login'}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Completing Authentication</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getUser
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return user ? <Component /> : null;
}

function Router() {
  const [location] = useLocation();
  const showLayout = !["/login", "/auth/callback"].includes(location);

  const content = (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={Calendar} />} />
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
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;