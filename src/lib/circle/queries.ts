import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function areUsersInCircle(userId: string, circleUserId: string) {
  if (!hasPublicSupabaseEnv() || userId === circleUserId) {
    return false;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_circles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("circle_user_id", circleUserId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function listCircleUserIds(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return new Set<string>();
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_circles")
    .select("circle_user_id")
    .eq("user_id", userId);

  if (error) {
    return new Set<string>();
  }

  return new Set((data ?? []).map((row) => row.circle_user_id as string));
}

export type CircleProfileRow = {
  created_at: string;
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    city: string;
    bio: string | null;
  } | null;
};

export async function listCircleProfiles(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_circles")
    .select(
      `
      created_at,
      profile:circle_user_id(
        id,
        username,
        display_name,
        avatar_url,
        city,
        bio
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as CircleProfileRow[];
}
