import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, login } from "@/lib/auth";
import { SiAnilist } from "react-icons/si";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const errorParam = new URLSearchParams(search).get("error");
  const appLoginUrl = `${window.location.origin}/login`;

  const { data: user, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUser,
    retry: false,
  });

  if (user) {
    setLocation("/");
    return null;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">Welcome to AniListCal</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Track your anime watching schedule with ease. Connect your AniList account to automatically sync your watchlist and get calendar events for airing shows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorParam && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Sign-in failed: {errorParam}
            </p>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Never miss an episode with automatic calendar integration</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Track currently airing shows and their broadcast times</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Sync with your existing AniList watchlist</span>
            </div>
          </div>

          <Button className="w-full py-6 text-lg" onClick={() => login()}>
            <SiAnilist className="mr-2 h-5 w-5" />
            Sign in on AniList.co
          </Button>

          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            AniListCal is an independent app and is not affiliated with AniList.
            Sign-in happens on{" "}
            <a
              href="https://anilist.co"
              className="underline underline-offset-2 text-primary"
              rel="noopener noreferrer"
            >
              anilist.co
            </a>
            , then returns here.
          </p>

          {import.meta.env.DEV && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">Local dev:</strong>{" "}
                <code className="font-mono">{appLoginUrl}</code>
              </p>
              <p>
                If sign-in does nothing in Cursor&apos;s preview, use the link below —{" "}
                <code className="font-mono">yarn dev</code> also opens your system browser on startup.
              </p>
              <a
                href={appLoginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Open app in system browser
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
