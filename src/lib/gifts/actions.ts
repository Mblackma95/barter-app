"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { maxLocalRadiusKm } from "@/lib/constants/radius";
import { createNotifications } from "@/lib/notifications/service";
import { assertProfileReadyForExchange } from "@/lib/profiles/queries";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { giftRequestInputSchema } from "@/lib/validation/proposals";

export async function createGiftRequestAction(formData: FormData) {
  const user = await requireUser();
  await assertProfileReadyForExchange(user.id);
  const parsed = giftRequestInputSchema.parse({
    listingId: String(formData.get("listingId") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  const supabase = await createServerSupabaseClient();
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id, exchange_mode, city, local_radius_km")
    .eq("id", parsed.listingId)
    .single();

  if (listingError || !listing) {
    throw new Error("Gift listing not found.");
  }

  if (listing.exchange_mode !== "gift") {
    throw new Error("Gift requests can only be sent to gift listings.");
  }

  if (listing.owner_id === user.id) {
    throw new Error("You cannot request your own gift listing.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("city, allowed_radius_km")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  if (!listing.city || listing.city.toLowerCase() !== profile.city.toLowerCase()) {
    throw new Error("Gift requests must stay within the same city.");
  }

  const allowedRadius = Math.min(Number(profile.allowed_radius_km), maxLocalRadiusKm);

  if (listing.local_radius_km && listing.local_radius_km > allowedRadius) {
    throw new Error("This gift is outside your allowed local radius.");
  }

  const { error } = await supabase.from("gift_requests").insert({
    listing_id: parsed.listingId,
    requester_id: user.id,
    giver_id: listing.owner_id,
    message: parsed.message,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/gifts");
  redirect("/gifts");
}

export async function approveGiftRequestAction(formData: FormData) {
  const user = await requireUser();
  const giftRequestId = String(formData.get("giftRequestId") ?? "");
  const supabase = createAdminSupabaseClient();
  const { data: giftRequest, error: readError } = await supabase
    .from("gift_requests")
    .select("id, requester_id, giver_id, status")
    .eq("id", giftRequestId)
    .single();

  if (readError || !giftRequest) {
    throw new Error("Gift request not found.");
  }

  if (giftRequest.giver_id !== user.id) {
    throw new Error("Only the giver can approve a gift request.");
  }

  const { error } = await supabase
    .from("gift_requests")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", giftRequestId)
    .eq("giver_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  await createNotifications([
    {
      userId: giftRequest.requester_id,
      type: "gift_approved",
      title: "Gift request approved",
      body: "The giver approved your gift request.",
      linkPath: "/gifts",
    },
  ]);

  revalidatePath("/gifts");
  redirect("/gifts");
}

export async function confirmGiftCompletionAction(formData: FormData) {
  const user = await requireUser();
  const giftRequestId = String(formData.get("giftRequestId") ?? "");
  const supabase = createAdminSupabaseClient();
  const { data: giftRequest, error: readError } = await supabase
    .from("gift_requests")
    .select("id, listing_id, requester_id, giver_id, status, requester_confirmed_at, giver_confirmed_at")
    .eq("id", giftRequestId)
    .single();

  if (readError || !giftRequest) {
    throw new Error("Gift request not found.");
  }

  if (giftRequest.requester_id !== user.id && giftRequest.giver_id !== user.id) {
    throw new Error("You can only confirm your own gift requests.");
  }

  if (!["approved", "completed"].includes(giftRequest.status)) {
    throw new Error("Only approved gifts can be completed.");
  }

  const now = new Date().toISOString();
  const isRequester = giftRequest.requester_id === user.id;
  const requesterConfirmedAt = isRequester ? now : giftRequest.requester_confirmed_at;
  const giverConfirmedAt = isRequester ? giftRequest.giver_confirmed_at : now;
  const bothConfirmed = Boolean(requesterConfirmedAt && giverConfirmedAt);

  const { error } = await supabase
    .from("gift_requests")
    .update({
      requester_confirmed_at: requesterConfirmedAt,
      giver_confirmed_at: giverConfirmedAt,
      status: bothConfirmed ? "completed" : giftRequest.status,
      completed_at: bothConfirmed ? now : null,
    })
    .eq("id", giftRequest.id);

  if (error) {
    throw new Error(error.message);
  }

  if (bothConfirmed) {
    const { error: listingError } = await supabase
      .from("listings")
      .update({ status: "archived", archived_at: now })
      .eq("id", giftRequest.listing_id);

    if (listingError) {
      throw new Error(listingError.message);
    }

    const { data: giverProfile, error: profileError } = await supabase
      .from("profiles")
      .select("gifts_given_count")
      .eq("id", giftRequest.giver_id)
      .single();

    if (!profileError && giverProfile) {
      await supabase
        .from("profiles")
        .update({ gifts_given_count: Number(giverProfile.gifts_given_count ?? 0) + 1 })
        .eq("id", giftRequest.giver_id);
    }

    await createNotifications([
      {
        userId: giftRequest.requester_id,
        type: "review_prompt",
        title: "Gift completed",
        body: "You can now leave a review.",
        linkPath: "/reviews",
      },
      {
        userId: giftRequest.giver_id,
        type: "review_prompt",
        title: "Gift completed",
        body: "You can now leave a review.",
        linkPath: "/reviews",
      },
    ]);
  }

  revalidatePath("/gifts");
  revalidatePath("/reviews");
  redirect("/gifts");
}
