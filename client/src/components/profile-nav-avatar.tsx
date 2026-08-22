import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { getUser } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { ProfileAvatar, useProfileAvatar } from "@/components/profile-avatar";

export function ProfileNavAvatar({ active }: { active: boolean }) {
  const { data: user } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
  const anilistAvatarUrl = user?.avatar.medium;
  const { avatarId } = useProfileAvatar(user?.id, Boolean(anilistAvatarUrl));

  if (!user) {
    return <User className="h-5 w-5" aria-hidden />;
  }

  return (
    <ProfileAvatar
      avatarId={avatarId}
      anilistAvatarUrl={anilistAvatarUrl}
      name={user.name}
      decorative
      className={cn(
        "h-6 w-6 rounded-md",
        active ? "ring-2 ring-primary" : "ring-border/70",
      )}
    />
  );
}
