import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUser, login } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";
import { SiAnilist } from "react-icons/si";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppState } from "@/components/app-state";
import { BrandMark } from "@/components/brand-mark";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const errorParam = new URLSearchParams(search).get("error");

  const { data: user, isLoading: isCheckingAuth } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
    retry: false,
  });

  if (user) {
    setLocation("/");
    return null;
  }

  if (isCheckingAuth) {
    return (
      <PageShell
        size="narrow"
        className="flex min-h-svh flex-col justify-center gap-6 px-6 py-8 sm:px-8 sm:py-12 lg:px-12"
      >
        <AppState kind="loading" title="Checking your AniList connection" />
      </PageShell>
    );
  }

  return (
    <PageShell
      size="narrow"
      className="flex min-h-svh flex-col justify-center gap-6 px-6 py-8 sm:px-8 sm:py-12 lg:px-12"
    >
      <BrandMark />
      <PageHeader
        title="Know what airs next"
        description="Connect AniList to see your watchlist and airing schedule in one place."
      />
      <Card>
        <CardContent className="space-y-5 px-10 pb-6 pt-6 sm:px-14 sm:pt-6 lg:px-16">
          {errorParam && (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Sign-in failed: {errorParam}
            </p>
          )}

          <Button className="h-12 w-full text-base" onClick={() => login()}>
            <SiAnilist className="mr-2 h-5 w-5" />
            Continue with AniList
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
        </CardContent>
      </Card>
    </PageShell>
  );
}
