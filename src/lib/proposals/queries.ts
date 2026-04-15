import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProposalRow = {
  id: string;
  mode: string;
  status: string;
  note: string | null;
  delivery_date: string | null;
  created_at: string;
  requester_id: string;
  recipient_id: string;
  target_listing: {
    title: string;
    slug: string;
  } | null;
  offered_listing: {
    title: string;
    slug: string;
  } | null;
  requester: {
    display_name: string;
    username: string;
  } | null;
  recipient: {
    display_name: string;
    username: string;
  } | null;
};

export async function listUserProposals(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      id,
      mode,
      status,
      note,
      delivery_date,
      created_at,
      requester_id,
      recipient_id,
      target_listing:target_listing_id(title, slug),
      offered_listing:offered_listing_id(title, slug),
      requester:requester_id(display_name, username),
      recipient:recipient_id(display_name, username)
    `,
    )
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ProposalRow[];
}
