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
  const destination = formData.get("returnToTrade") === "1" ? `/trades/${trade.id}` : "/trades";
  if (trade.status === "completed") redirect(destination);
  if (trade.status !== "pending") throw new Error("Only pending trades can be completed.");
  const alreadyConfirmed = trade.user_a_id === user.id ? trade.user_a_confirmed_at : trade.user_b_confirmed_at;
  if (alreadyConfirmed) redirect(destination);
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const isUserA = trade.user_a_id === user.id;
  // Write only this participant's confirmation so concurrent clicks cannot erase each other.
  const { error: confirmationError } = await supabase.from("trades")
    .update(isUserA ? { user_a_confirmed_at: now } : { user_b_confirmed_at: now })
    .eq("id", trade.id).eq("status", "pending");
  if (confirmationError) throw new Error(confirmationError.message);
  const { data: confirmations, error: readError } = await supabase.from("trades")
    .select("user_a_confirmed_at,user_b_confirmed_at").eq("id", trade.id).single();
  if (readError || !confirmations) throw new Error("Could not verify completion. Please refresh.");
  const bothConfirmed = Boolean(confirmations.user_a_confirmed_at && confirmations.user_b_confirmed_at);
  const nextStatus = bothConfirmed ? "completed" : "pending";

  const { data: updatedTrade, error } = await supabase
    .from("trades")
    .update({
      status: nextStatus,
      pending_completion_started_at: bothConfirmed
        ? trade.pending_completion_started_at
        : trade.pending_completion_started_at ?? now,
      completed_at: bothConfirmed ? now : null,
    })
    .eq("id", trade.id).eq("status", "pending").select("id").maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!updatedTrade) redirect(destination);

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
  revalidatePath(`/trades/${trade.id}`);
  redirect(destination);
}
