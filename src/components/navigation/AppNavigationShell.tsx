import { getOptionalUser } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { getProfileById } from "@/lib/profiles/queries";
import { AppNavigation } from "./AppNavigation";

export async function AppNavigationShell() {
  const user = await getOptionalUser();

  if (!user) {
    return null;
  }

  const [profile, unreadNotificationCount] = await Promise.all([
    getProfileById(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return (
    <AppNavigation
      avatarUrl={profile?.avatar_url ?? null}
      displayName={profile?.display_name ?? user.email ?? "Barter user"}
      username={profile?.username || null}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
