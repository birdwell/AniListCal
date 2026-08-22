import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const AVATAR_STORAGE_PREFIX = "anilistcal:profile-avatar:";
const AVATAR_CHANGE_EVENT = "anilistcal:profile-avatar-change";
const MASCOT_SPRITES = {
  original: "/avatars/anilistcal-mascots.png",
  expansion: "/avatars/anilistcal-mascots-2.png",
} as const;

const MASCOT_AVATARS = {
  fox: { sprite: MASCOT_SPRITES.original, position: "0% 0%" },
  rabbit: { sprite: MASCOT_SPRITES.original, position: "50% 0%" },
  dragon: { sprite: MASCOT_SPRITES.original, position: "100% 0%" },
  cat: { sprite: MASCOT_SPRITES.original, position: "0% 100%" },
  tanuki: { sprite: MASCOT_SPRITES.original, position: "50% 100%" },
  cloud: { sprite: MASCOT_SPRITES.original, position: "100% 100%" },
  shiba: { sprite: MASCOT_SPRITES.expansion, position: "0% 0%" },
  owl: { sprite: MASCOT_SPRITES.expansion, position: "50% 0%" },
  redPanda: { sprite: MASCOT_SPRITES.expansion, position: "100% 0%" },
  penguin: { sprite: MASCOT_SPRITES.expansion, position: "0% 100%" },
  axolotl: { sprite: MASCOT_SPRITES.expansion, position: "50% 100%" },
  tiger: { sprite: MASCOT_SPRITES.expansion, position: "100% 100%" },
  kirin: { sprite: "/avatars/celestial-kirin.png", position: "50% 50%" },
} as const;

type MascotAvatarId = keyof typeof MASCOT_AVATARS;
export type ProfileAvatarId = "anilist" | MascotAvatarId;

export const PROFILE_AVATAR_OPTIONS: ReadonlyArray<{
  id: ProfileAvatarId;
  label: string;
}> = [
  { id: "anilist", label: "AniList avatar" },
  { id: "fox", label: "Fox" },
  { id: "rabbit", label: "Rabbit" },
  { id: "dragon", label: "Little dragon" },
  { id: "cat", label: "Black cat" },
  { id: "tanuki", label: "Tanuki" },
  { id: "cloud", label: "Cloud sheep" },
  { id: "shiba", label: "Shiba inu" },
  { id: "owl", label: "Snowy owl" },
  { id: "redPanda", label: "Red panda" },
  { id: "penguin", label: "Penguin chick" },
  { id: "axolotl", label: "Pink axolotl" },
  { id: "tiger", label: "White tiger" },
  { id: "kirin", label: "Celestial kirin" },
];

function isProfileAvatarId(value: string | null): value is ProfileAvatarId {
  return PROFILE_AVATAR_OPTIONS.some((option) => option.id === value);
}

export function useProfileAvatar(
  userId: number | undefined,
  hasAniListAvatar: boolean,
) {
  const fallback: ProfileAvatarId = hasAniListAvatar ? "anilist" : "fox";
  const [avatarId, setAvatarIdState] = useState<ProfileAvatarId>(fallback);

  useEffect(() => {
    if (!userId) {
      setAvatarIdState(fallback);
      return;
    }

    try {
      const stored = window.localStorage.getItem(
        `${AVATAR_STORAGE_PREFIX}${userId}`,
      );
      setAvatarIdState(
        isProfileAvatarId(stored) &&
          (stored !== "anilist" || hasAniListAvatar)
          ? stored
          : fallback,
      );
    } catch {
      setAvatarIdState(fallback);
    }
  }, [fallback, hasAniListAvatar, userId]);

  useEffect(() => {
    if (!userId) return;

    const handleAvatarChange = (event: Event) => {
      const { detail } = event as CustomEvent<{
        userId: number;
        avatarId: ProfileAvatarId;
      }>;

      if (detail.userId === userId) {
        setAvatarIdState(detail.avatarId);
      }
    };

    window.addEventListener(AVATAR_CHANGE_EVENT, handleAvatarChange);
    return () => {
      window.removeEventListener(AVATAR_CHANGE_EVENT, handleAvatarChange);
    };
  }, [userId]);

  const setAvatarId = useCallback(
    (nextAvatarId: ProfileAvatarId) => {
      setAvatarIdState(nextAvatarId);
      if (!userId) return false;

      window.dispatchEvent(
        new CustomEvent(AVATAR_CHANGE_EVENT, {
          detail: { userId, avatarId: nextAvatarId },
        }),
      );

      try {
        window.localStorage.setItem(
          `${AVATAR_STORAGE_PREFIX}${userId}`,
          nextAvatarId,
        );
        return true;
      } catch {
        // localStorage may be unavailable in private browsing mode.
        return false;
      }
    },
    [userId],
  );

  return { avatarId, setAvatarId };
}

interface ProfileAvatarProps {
  avatarId: ProfileAvatarId;
  anilistAvatarUrl?: string;
  name?: string;
  className?: string;
  decorative?: boolean;
}

export function ProfileAvatar({
  avatarId,
  anilistAvatarUrl,
  name,
  className,
  decorative = false,
}: ProfileAvatarProps) {
  if (avatarId === "anilist") {
    return (
      <Avatar
        aria-hidden={decorative || undefined}
        className={cn("h-12 w-12 rounded-xl ring-1 ring-border/70", className)}
      >
        <AvatarImage
          src={anilistAvatarUrl}
          alt={decorative ? "" : name ? `${name}'s AniList avatar` : "AniList avatar"}
          className="object-cover"
        />
        <AvatarFallback className="font-display font-semibold text-primary">
          {name?.slice(0, 1).toUpperCase() || "A"}
        </AvatarFallback>
      </Avatar>
    );
  }

  const mascot = MASCOT_AVATARS[avatarId];

  return (
    <span
      aria-hidden
      className={cn(
        "block h-12 w-12 shrink-0 rounded-xl bg-cover bg-no-repeat ring-1 ring-border/70",
        className,
      )}
      style={{
        backgroundImage: `url(${mascot.sprite})`,
        backgroundPosition: mascot.position,
        backgroundSize: avatarId === "kirin" ? "cover" : "300% 200%",
      }}
    />
  );
}
