"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { maxLocalRadiusKm } from "@/lib/constants/radius";
import { assertProfileReadyForExchange } from "@/lib/profiles/queries";
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
  const supabase = await createServerSupabaseClient();
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

  revalidatePath("/gifts");
  redirect("/gifts");
}
