import { hasPublicSupabaseEnv } from "@/lib/env";
import { createNotification } from "@/lib/notifications/service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ReviewableTradeRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  completed_at: string | null;
  target_listing: { title: string } | null;
  offered_listing: { title: string } | null;
  user_a: { display_name: string; username: string } | null;
  user_b: { display_name: string; username: string } | null;
};

export type ReviewableGiftRow = {
  id: string;
  requester_id: string;
  giver_id: string;
  completed_at: string | null;
  listings: { title: string } | null;
  requester: { display_name: string; username: string } | null;
  giver: { display_name: string; username: string } | null;
};

export type ReviewRow = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  trade_id: string | null;
  gift_request_id: string | null;
  rating: number;
  body: string | null;
  created_at: string;
  review_deadline_at: string | null;
  visible_at: string | null;
  reviewer: { display_name: string; username: string } | null;
  reviewee: { display_name: string; username: string } | null;
};

async function createMissingReviewReminders(
  userId: string,
  trades: ReviewableTradeRow[],
  gifts: ReviewableGiftRow[],
  reviews: ReviewRow[],
) {
  const admin = createAdminSupabaseClient();
  const now = Date.now();
  const reviewedTradeIds = new Set(
    reviews.filter((review) => review.reviewer_id === userId && review.trade_id).map((review) => review.trade_id),
  );
  const reviewedGiftIds = new Set(
    reviews
      .filter((review) => review.reviewer_id === userId && review.gift_request_id)
      .map((review) => review.gift_request_id),
  );

  for (const trade of trades) {
    if (!trade.completed_at || reviewedTradeIds.has(trade.id)) continue;
    if (now - new Date(trade.completed_at).getTime() < 24 * 60 * 60 * 1000) continue;

    const { data } = await admin
      .from("review_reminders")
      .upsert({ user_id: userId, trade_id: trade.id }, { onConflict: "user_id,trade_id", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();

    if (data?.id) {
      await createNotification({
        userId,
        type: "review_prompt",
        title: "Review reminder",
        body: "A completed trade is waiting for your review.",
        linkPath: "/reviews",
      });
    }
  }

  for (const gift of gifts) {
    if (!gift.completed_at || reviewedGiftIds.has(gift.id)) continue;
    if (now - new Date(gift.completed_at).getTime() < 24 * 60 * 60 * 1000) continue;

    const { data } = await admin
      .from("review_reminders")
      .upsert(
        { user_id: userId, gift_request_id: gift.id },
        { onConflict: "user_id,gift_request_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();

    if (data?.id) {
      await createNotification({
        userId,
        type: "review_prompt",
        title: "Review reminder",
        body: "A completed gift exchange is waiting for your review.",
        linkPath: "/reviews",
      });
    }
  }
}

export async function listReviewContext(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return { trades: [], gifts: [], reviews: [] };
  }

  const supabase = await createServerSupabaseClient();
  const [tradesResult, giftsResult, reviewsResult] = await Promise.all([
    supabase
      .from("trades")
      .select(
        `
        id,
        user_a_id,
        user_b_id,
        completed_at,
        target_listing:target_listing_id(title),
        offered_listing:offered_listing_id(title),
        user_a:user_a_id(display_name, username),
        user_b:user_b_id(display_name, username)
      `,
      )
      .eq("status", "completed")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
    supabase
      .from("gift_requests")
      .select(
        `
        id,
        requester_id,
        giver_id,
        completed_at,
        listings:listing_id(title),
        requester:requester_id(display_name, username),
        giver:giver_id(display_name, username)
      `,
      )
      .eq("status", "completed")
      .or(`requester_id.eq.${userId},giver_id.eq.${userId}`),
    supabase
      .from("reviews")
      .select(
        `
        id,
        reviewer_id,
        reviewee_id,
        trade_id,
        gift_request_id,
        rating,
        body,
        created_at,
        review_deadline_at,
        visible_at,
        reviewer:reviewer_id(display_name, username),
        reviewee:reviewee_id(display_name, username)
      `,
      )
      .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
  ]);

  if (tradesResult.error) throw new Error(tradesResult.error.message);
  if (giftsResult.error) throw new Error(giftsResult.error.message);
  if (reviewsResult.error) throw new Error(reviewsResult.error.message);

  const trades = (tradesResult.data ?? []) as unknown as ReviewableTradeRow[];
  const gifts = (giftsResult.data ?? []) as unknown as ReviewableGiftRow[];
  const reviews = (reviewsResult.data ?? []) as unknown as ReviewRow[];

  await createMissingReviewReminders(userId, trades, gifts, reviews);

  return { trades, gifts, reviews };
}
