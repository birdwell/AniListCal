import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="max-w-2xl mx-auto space-y-8">
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
    </div>
  );
}
