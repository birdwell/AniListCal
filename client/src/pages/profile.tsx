import { useQuery } from "@tanstack/react-query";
import { getUser, logout } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { AppState } from "@/components/app-state";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export default function Profile() {
  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
  });

  if (isLoading) {
    return (
      <PageShell size="narrow" className="space-y-6">
        <PageHeader title="Profile" />
        <AppState kind="loading" title="Loading your profile" />
      </PageShell>
    );
  }

  return (
    <PageShell size="narrow" className="space-y-6">
      <PageHeader title="Profile" />
      <Card>
        <CardContent className="p-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium">Name</dt>
              <dd className="text-muted-foreground">{user?.name}</dd>
            </div>
            {user?.id && (
              <div>
                <dt className="text-sm font-medium">AniList account</dt>
                <dd className="text-sm text-muted-foreground">
                  Connected via OAuth (ID: {user.id})
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card className="md:hidden">
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => {
              void logout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
