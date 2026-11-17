import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listUserNotifications(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link_path, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NotificationRow[];
}

export async function getUnreadNotificationCount(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return 0;
  }

  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
