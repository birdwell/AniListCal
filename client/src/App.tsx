import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { getUser, clearAuthData, isAuthenticated, getApiToken, isTokenExpired, STORAGE_KEYS } from "./lib/auth";
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
import { Calendar } from "./components/ui/calendar";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const isAuth = isAuthenticated();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUser,
    enabled: isAuth,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isAuth && error) {
      console.error('User query failed despite client token, likely invalid token:', error);
      clearAuthData();
      setLocation("/login");
    }
    else if (!isLoading && !isAuth) {
      console.log('ProtectedRoute: Not authenticated, redirecting to login');
      setLocation("/login");
    }
  }, [isAuth, isLoading, error, setLocation]);

  if (isLoading && isAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuth && user) {
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
      <Route path="/calendar" component={() => <ProtectedRoute component={Calendar} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/show/:id" component={() => <ProtectedRoute component={Show} />} />
      <Route component={NotFound} />
    </Switch>
  );

  return showLayout ? <Layout>{content}</Layout> : content;
}

function App() {
  const [, setLocation] = useLocation();
  const [isProcessingAuth, setIsProcessingAuth] = useState(!!window.location.hash);

  useEffect(() => {
    if (window.location.hash && isProcessingAuth) {
      console.log("[App Effect] Detected URL hash and processing flag is true:", window.location.hash);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const apiToken = hashParams.get('apiToken');
      const expiresIn = hashParams.get('expiresIn');
      const authError = hashParams.get('authError');

      console.log("[App Effect] Clearing window hash.");
      window.location.hash = '';

      if (authError) {
        console.error("[App Effect] Authentication error from server redirect:", decodeURIComponent(authError));
        clearAuthData();
        setIsProcessingAuth(false);
        setLocation('/auth-error');
      } else if (apiToken && expiresIn) {
        console.log("[App Effect] Found apiToken and expiresIn in hash. Storing...");
        const expiryTime = Date.now() + (parseInt(expiresIn, 10) * 1000);

        sessionStorage.setItem(STORAGE_KEYS.API_TOKEN, apiToken);
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
        console.log("[App Effect] Token stored in sessionStorage.");

        console.log("[App Effect] Invalidating auth queries AFTER storing token...");
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });

        console.log("[App Effect] Setting isProcessingAuth to false.");
        setIsProcessingAuth(false);
        console.log("[App Effect] Navigating to '/'.");
        setLocation('/');
      } else {
        console.warn("[App Effect] URL hash detected, but did not contain expected parameters.");
        setIsProcessingAuth(false);
      }
    } else if (!window.location.hash && isProcessingAuth) {
      console.log("[App Effect] Hash disappeared before processing, setting isProcessingAuth to false.");
      setIsProcessingAuth(false);
    }
  }, [setLocation, isProcessingAuth]);

  if (isProcessingAuth) {
    console.log("[App Render] isProcessingAuth is true, rendering loading indicator.");
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Processing authentication...</p>
      </div>
    );
  }

  console.log("[App Render] isProcessingAuth is false, rendering main application.");
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