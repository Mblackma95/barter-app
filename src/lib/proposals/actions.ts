"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { maxLocalRadiusKm } from "@/lib/constants/radius";
import { assertProfileReadyForExchange } from "@/lib/profiles/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  barterProposalInputSchema,
  digitalProposalInputSchema,
} from "@/lib/validation/proposals";

async function getListingForProposal(listingId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, owner_id, exchange_mode, city, local_radius_km, is_remote, status")
    .eq("id", listingId)
    .single();

  if (error || !data) {
    throw new Error("Listing not found.");
  }

  return data;
}

async function assertLocalEligibility(userId: string, targetListingId: string) {
  const supabase = await createServerSupabaseClient();
  const target = await getListingForProposal(targetListingId);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("city, allowed_radius_km")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found.");
  }

  if (target.exchange_mode !== "digital") {
    if (!target.city || !profile.city || target.city.toLowerCase() !== profile.city.toLowerCase()) {
      throw new Error("Local proposals must stay within the same city.");
    }

    const allowedRadius = Math.min(Number(profile.allowed_radius_km), maxLocalRadiusKm);

    if (target.local_radius_km && target.local_radius_km > allowedRadius) {
      throw new Error("This listing is outside your allowed local radius.");
    }
  }

  return target;
}

export async function createBarterProposalAction(formData: FormData) {
  const user = await requireUser();
  await assertProfileReadyForExchange(user.id);
  const parsed = barterProposalInputSchema.parse({
    targetListingId: String(formData.get("targetListingId") ?? ""),
    offeredListingId: String(formData.get("offeredListingId") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  const target = await assertLocalEligibility(user.id, parsed.targetListingId);
  const offered = await getListingForProposal(parsed.offeredListingId);

  if (target.exchange_mode !== "barter") {
    throw new Error("Barter proposals can only be sent to barter listings.");
  }

  if (target.owner_id === user.id) {
    throw new Error("You cannot propose to your own listing.");
  }

  if (offered.owner_id !== user.id || offered.exchange_mode !== "barter") {
    throw new Error("Your offered listing must be one of your active barter listings.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("proposals").insert({
    mode: "barter",
    requester_id: user.id,
    recipient_id: target.owner_id,
    target_listing_id: parsed.targetListingId,
    offered_listing_id: parsed.offeredListingId,
    note: parsed.note,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  redirect("/proposals");
}

export async function createDigitalProposalAction(formData: FormData) {
  const user = await requireUser();
  await assertProfileReadyForExchange(user.id);
  const parsed = digitalProposalInputSchema.parse({
    targetListingId: String(formData.get("targetListingId") ?? ""),
    offeredListingId: String(formData.get("offeredListingId") ?? "") || undefined,
    deliveryDate: String(formData.get("deliveryDate") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  const target = await getListingForProposal(parsed.targetListingId);

  if (target.exchange_mode !== "digital") {
    throw new Error("Digital proposals can only be sent to digital exchange listings.");
  }

  if (target.owner_id === user.id) {
    throw new Error("You cannot propose to your own listing.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("proposals").insert({
    mode: "digital",
    requester_id: user.id,
    recipient_id: target.owner_id,
    target_listing_id: parsed.targetListingId,
    offered_listing_id: parsed.offeredListingId ?? null,
    delivery_date: parsed.deliveryDate.toISOString().slice(0, 10),
    note: parsed.note,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  redirect("/proposals");
}
