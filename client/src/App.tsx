import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import authService, { handleAuthCallback, getUser, isAuthenticated } from "./lib/auth";
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
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check URL parameters first, then sessionStorage
    let code = new URLSearchParams(window.location.search).get('code');
    
    // If no code in URL, try sessionStorage
    if (!code) {
      code = sessionStorage.getItem('auth_code');
      // Clean up sessionStorage
      sessionStorage.removeItem('auth_code');
    }
    
    if (!code) {
      console.error('No authorization code received');
      setError('No authorization code received');
      setIsLoading(false);
      return;
    }

    console.log('Processing authentication callback...');

    handleAuthCallback(code)
      .then(() => {
        // Force a refetch of the user data
        console.log('Authentication successful');
        queryClient.invalidateQueries({ queryKey: ["auth"] });
        setTimeout(() => setLocation("/"), 500); // Small delay for state to update
      })
      .catch(err => {
        console.error('Authentication error:', err);
        setError(err.message || 'Authentication failed');
        setIsLoading(false);
      });
  }, [setLocation]);

  if (isLoading && !error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-destructive">Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => setLocation('/login')}>
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
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No authenticated user found, redirecting to login');
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Authentication error:', error);
    authService.clearAuthData(); // Clear any invalid auth data
    setLocation("/login");
    return null;
  }

  return user ? <Component /> : null;
}

function Router() {
  const [location] = useLocation();
  const showLayout = !["/login", "/auth/callback", "/auth/callback-process"].includes(location);

  const content = (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={() => {
        // Just handle the initial OAuth redirect with code parameter
        // This route will be hit by the AniList OAuth redirect
        return (
          <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p>Initiating authentication...</p>
            </div>
          </div>
        );
      }} />
      <Route path="/auth/callback-process" component={AuthCallback} />
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