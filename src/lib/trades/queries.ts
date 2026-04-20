import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TradeRow = {
  id: string;
  proposal_id: string;
  mode: string;
  user_a_id: string;
  user_b_id: string;
  target_listing_id: string;
  offered_listing_id: string | null;
  status: string;
  agreed_at: string;
  user_a_confirmed_at: string | null;
  user_b_confirmed_at: string | null;
  pending_completion_started_at: string | null;
  completed_at: string | null;
  flagged_at: string | null;
  target_listing: {
    title: string;
    slug: string;
  } | null;
  offered_listing: {
    title: string;
    slug: string;
  } | null;
  user_a: {
    display_name: string;
    username: string;
  } | null;
  user_b: {
    display_name: string;
    username: string;
  } | null;
};

export async function listUserTrades(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("trades")
    .select(
      `
      id,
      proposal_id,
      mode,
      user_a_id,
      user_b_id,
      target_listing_id,
      offered_listing_id,
      status,
      agreed_at,
      user_a_confirmed_at,
      user_b_confirmed_at,
      pending_completion_started_at,
      completed_at,
      flagged_at,
      target_listing:target_listing_id(title, slug),
      offered_listing:offered_listing_id(title, slug),
      user_a:user_a_id(display_name, username),
      user_b:user_b_id(display_name, username)
    `,
    )
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("agreed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TradeRow[];
}
