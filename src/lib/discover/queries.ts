import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AiMatchOpportunity = {
  id: string;
  score: number;
  reasons: string[] | null;
  status: string;
  notified_at: string | null;
  created_at: string;
  listings: {
    title: string;
    slug: string;
    exchange_mode: string;
    city: string | null;
    categories: { name: string } | null;
  } | null;
};

export async function listAiMatchOpportunities(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ai_match_opportunities")
    .select(
      `
      id,
      score,
      reasons,
      status,
      notified_at,
      created_at,
      listings:listing_id(
        title,
        slug,
        exchange_mode,
        city,
        categories:category_id(name)
      )
    `,
    )
    .eq("user_id", userId)
    .order("score", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as AiMatchOpportunity[];
}
