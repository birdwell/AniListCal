import { useQuery } from "@tanstack/react-query";
import { getUser, logout } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";

export default function Profile() {
  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p className="text-muted-foreground">{user?.name}</p>
          </div>
          {user?.id && (
            <div>
              <label className="text-sm font-medium">AniList account</label>
              <p className="text-sm text-muted-foreground">
                Connected via OAuth (ID: {user.id})
              </p>
            </div>
          )}
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
    </div>
  );
}
