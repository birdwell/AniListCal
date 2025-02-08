import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { handleRedirectCallback } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import { Layout } from "@/components/layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    if (window.location.search.includes("code=")) {
      handleRedirectCallback();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
