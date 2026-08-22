import { useQuery } from "@tanstack/react-query";
import { getUser, logout } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle2, LogOut } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { AppState } from "@/components/app-state";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  PROFILE_AVATAR_OPTIONS,
  ProfileAvatar,
  useProfileAvatar,
} from "@/components/profile-avatar";

export default function Profile() {
  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
  });
  const anilistAvatarUrl = user?.avatar.medium;
  const { avatarId, setAvatarId } = useProfileAvatar(
    user?.id,
    Boolean(anilistAvatarUrl),
  );

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
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <ProfileAvatar
              avatarId={avatarId}
              anilistAvatarUrl={anilistAvatarUrl}
              name={user?.name}
              className="h-16 w-16"
            />
            <dl className="min-w-0 flex-1 space-y-3">
              <div>
                <dt className="text-sm font-medium">Name</dt>
                <dd className="truncate text-muted-foreground">{user?.name}</dd>
              </div>
              {user?.id && (
                <div>
                  <dt className="text-sm font-medium">AniList</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-success"
                      aria-hidden
                    />
                    <span>Connected</span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-5 border-t border-border/70 pt-5">
            <p id="profile-avatar-label" className="text-sm font-medium">
              Avatar
            </p>
            <div
              className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-1"
              role="radiogroup"
              aria-labelledby="profile-avatar-label"
            >
              {PROFILE_AVATAR_OPTIONS.filter(
                (option) => option.id !== "anilist" || anilistAvatarUrl,
              ).map((option) => {
                const isSelected = avatarId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={option.label}
                    className="flex h-14 w-14 items-center justify-center justify-self-center rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    onClick={() => {
                      if (isSelected) return;

                      const saved = setAvatarId(option.id);
                      toast({
                        title: saved ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2
                              className="h-4 w-4 shrink-0 text-success"
                              aria-hidden
                            />
                            <span>Avatar saved on this device</span>
                          </span>
                        ) : (
                          "Avatar changed"
                        ),
                        description: saved
                          ? undefined
                          : "Browser storage is unavailable, so this choice will reset after this session.",
                        variant: "default",
                      });
                    }}
                  >
                    <ProfileAvatar
                      avatarId={option.id}
                      anilistAvatarUrl={anilistAvatarUrl}
                      name={user?.name}
                      className={cn(
                        "h-14 w-14",
                        isSelected && "ring-[3px] ring-inset ring-primary",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden md:hidden">
        <CardContent className="divide-y divide-border/70 p-0">
          <div className="flex min-h-14 items-center justify-between gap-4 px-5">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            className="h-14 w-full justify-between rounded-none px-5"
            onClick={() => {
              void logout();
            }}
          >
            <span>Log out</span>
            <span className="flex h-11 w-11 items-center justify-center">
              <LogOut className="h-4 w-4" />
            </span>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
