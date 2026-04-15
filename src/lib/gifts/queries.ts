import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type GiftRequestRow = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  requester_id: string;
  giver_id: string;
  listings: {
    title: string;
    slug: string;
  } | null;
  requester: {
    display_name: string;
    username: string;
  } | null;
  giver: {
    display_name: string;
    username: string;
  } | null;
};

export async function listUserGiftRequests(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("gift_requests")
    .select(
      `
      id,
      message,
      status,
      created_at,
      requester_id,
      giver_id,
      listings:listing_id(title, slug),
      requester:requester_id(display_name, username),
      giver:giver_id(display_name, username)
    `,
    )
    .or(`requester_id.eq.${userId},giver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as GiftRequestRow[];
}
