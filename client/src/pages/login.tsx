import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, login } from "@/lib/auth";
import { SiAnilist } from "react-icons/si";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUser,
    retry: false
  });

  // Redirect to home if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Anime Tracker</CardTitle>
          <CardDescription>
            Connect with your Anilist account to manage your anime watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full py-6 text-lg"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <SiAnilist className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Connecting..." : "Continue with Anilist"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}