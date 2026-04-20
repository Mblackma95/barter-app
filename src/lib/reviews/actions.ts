"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications/service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasCashLanguage } from "@/lib/validation/tags";

const reviewInputSchema = z
  .object({
    contextType: z.enum(["trade", "gift"]),
    contextId: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    body: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, context) => {
    if (hasCashLanguage(value.body ?? "")) {
      context.addIssue({
        code: "custom",
        message: "Cash or payment language is not allowed in reviews.",
        path: ["body"],
      });
    }
  });

export async function createReviewAction(formData: FormData) {
  const user = await requireUser();
  const parsed = reviewInputSchema.parse({
    contextType: String(formData.get("contextType") ?? ""),
    contextId: String(formData.get("contextId") ?? ""),
    rating: Number(formData.get("rating") ?? 5),
    body: String(formData.get("body") ?? ""),
  });
  const supabase = createAdminSupabaseClient();
  let revieweeId: string;
  let reviewDeadlineAt: string;
  let counterpartFilter: { trade_id?: string; gift_request_id?: string };
  let insertPayload: {
    reviewer_id: string;
    reviewee_id: string;
    trade_id?: string;
    gift_request_id?: string;
    rating: number;
    body: string | null;
    review_deadline_at: string;
    visible_at: string | null;
  };

  if (parsed.contextType === "trade") {
    const { data: trade, error } = await supabase
      .from("trades")
      .select("id, user_a_id, user_b_id, status, completed_at")
      .eq("id", parsed.contextId)
      .single();

    if (error || !trade) {
      throw new Error("Trade not found.");
    }

    if (trade.status !== "completed") {
      throw new Error("Reviews are only available after completed trades.");
    }

    if (trade.user_a_id !== user.id && trade.user_b_id !== user.id) {
      throw new Error("You can only review your own trades.");
    }

    revieweeId = trade.user_a_id === user.id ? trade.user_b_id : trade.user_a_id;
    reviewDeadlineAt = new Date(
      new Date(trade.completed_at ?? Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    counterpartFilter = { trade_id: trade.id };
    insertPayload = {
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      trade_id: trade.id,
      rating: parsed.rating,
      body: parsed.body ?? null,
      review_deadline_at: reviewDeadlineAt,
      visible_at: new Date() >= new Date(reviewDeadlineAt) ? new Date().toISOString() : null,
    };
  } else {
    const { data: giftRequest, error } = await supabase
      .from("gift_requests")
      .select("id, requester_id, giver_id, status, completed_at")
      .eq("id", parsed.contextId)
      .single();

    if (error || !giftRequest) {
      throw new Error("Gift request not found.");
    }

    if (giftRequest.status !== "completed") {
      throw new Error("Reviews are only available after completed gifts.");
    }

    if (giftRequest.requester_id !== user.id && giftRequest.giver_id !== user.id) {
      throw new Error("You can only review your own gift exchanges.");
    }

    revieweeId = giftRequest.requester_id === user.id ? giftRequest.giver_id : giftRequest.requester_id;
    reviewDeadlineAt = new Date(
      new Date(giftRequest.completed_at ?? Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    counterpartFilter = { gift_request_id: giftRequest.id };
    insertPayload = {
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      gift_request_id: giftRequest.id,
      rating: parsed.rating,
      body: parsed.body ?? null,
      review_deadline_at: reviewDeadlineAt,
      visible_at: new Date() >= new Date(reviewDeadlineAt) ? new Date().toISOString() : null,
    };
  }

  const { data: insertedReview, error: insertError } = await supabase
    .from("reviews")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  let counterpartQuery = supabase
    .from("reviews")
    .select("id, reviewer_id")
    .neq("reviewer_id", user.id);

  if (counterpartFilter.trade_id) {
    counterpartQuery = counterpartQuery.eq("trade_id", counterpartFilter.trade_id);
  }

  if (counterpartFilter.gift_request_id) {
    counterpartQuery = counterpartQuery.eq("gift_request_id", counterpartFilter.gift_request_id);
  }

  const { data: counterpartReview, error: counterpartError } = await counterpartQuery.maybeSingle();

  if (counterpartError) {
    throw new Error(counterpartError.message);
  }

  if (counterpartReview || new Date() >= new Date(reviewDeadlineAt)) {
    const reviewIds = [insertedReview.id, counterpartReview?.id].filter((id): id is string => Boolean(id));
    const { error: revealError } = await supabase
      .from("reviews")
      .update({ visible_at: new Date().toISOString() })
      .in("id", reviewIds);

    if (revealError) {
      throw new Error(revealError.message);
    }

    await createNotification({
      userId: revieweeId,
      type: "review_available",
      title: "Review available",
      body: "A review is now visible.",
      linkPath: "/reviews",
    });
  }

  revalidatePath("/reviews");
  redirect("/reviews");
}
