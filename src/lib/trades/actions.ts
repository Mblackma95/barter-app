"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createNotifications } from "@/lib/notifications/service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function getTradeForUser(tradeId: string, userId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("trades")
    .select(
      `
      id,
      mode,
      user_a_id,
      user_b_id,
      target_listing_id,
      offered_listing_id,
      status,
      user_a_confirmed_at,
      user_b_confirmed_at,
      pending_completion_started_at,
      target_listing:target_listing_id(title),
      offered_listing:offered_listing_id(title)
    `,
    )
    .eq("id", tradeId)
    .single();

  if (error || !data) {
    throw new Error("Trade not found.");
  }

  if (data.user_a_id !== userId && data.user_b_id !== userId) {
    throw new Error("You can only update your own trades.");
  }

  return data;
}

export async function confirmTradeCompletionAction(formData: FormData) {
  const user = await requireUser();
  const tradeId = String(formData.get("tradeId") ?? "");
  const trade = await getTradeForUser(tradeId, user.id);
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const isUserA = trade.user_a_id === user.id;
  const userAConfirmedAt = isUserA ? now : trade.user_a_confirmed_at;
  const userBConfirmedAt = isUserA ? trade.user_b_confirmed_at : now;
  const bothConfirmed = Boolean(userAConfirmedAt && userBConfirmedAt);
  const nextStatus = bothConfirmed ? "completed" : "pending";

  const { error } = await supabase
    .from("trades")
    .update({
      status: nextStatus,
      user_a_confirmed_at: userAConfirmedAt,
      user_b_confirmed_at: userBConfirmedAt,
      pending_completion_started_at: bothConfirmed
        ? trade.pending_completion_started_at
        : trade.pending_completion_started_at ?? now,
      completed_at: bothConfirmed ? now : null,
    })
    .eq("id", trade.id);

  if (error) {
    throw new Error(error.message);
  }

  const otherUserId = trade.user_a_id === user.id ? trade.user_b_id : trade.user_a_id;

  if (bothConfirmed) {
    const listingIds = [trade.target_listing_id, trade.offered_listing_id].filter(Boolean);

    if (listingIds.length) {
      const { error: listingError } = await supabase
        .from("listings")
        .update({ status: "archived", archived_at: now })
        .in("id", listingIds);

      if (listingError) {
        throw new Error(listingError.message);
      }
    }

    await createNotifications([
      {
        userId: trade.user_a_id,
        type: "review_prompt",
        title: "Trade completed",
        body: "Leave a review when you have a minute.",
        linkPath: "/reviews",
      },
      {
        userId: trade.user_b_id,
        type: "review_prompt",
        title: "Trade completed",
        body: "Leave a review when you have a minute.",
        linkPath: "/reviews",
      },
    ]);
  } else {
    await createNotifications([
      {
        userId: otherUserId,
        type: "pending_completion",
        title: "Confirm trade completion",
        body: "The other trader marked this trade complete. Please confirm when you are ready.",
        linkPath: "/trades",
      },
    ]);
  }

  revalidatePath("/trades");
  revalidatePath("/reviews");
  redirect("/trades");
}
