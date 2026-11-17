"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { maxLocalRadiusKm } from "@/lib/constants/radius";
import { createNotifications } from "@/lib/notifications/service";
import { assertProfileReadyForExchange } from "@/lib/profiles/queries";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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

async function getProposalForDecision(proposalId: string, userId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      id,
      mode,
      requester_id,
      recipient_id,
      target_listing_id,
      offered_listing_id,
      status,
      target_listing:target_listing_id(title),
      offered_listing:offered_listing_id(title)
    `,
    )
    .eq("id", proposalId)
    .single();

  if (error || !data) {
    throw new Error("Proposal not found.");
  }

  if (data.recipient_id !== userId) {
    throw new Error("Only the proposal recipient can make this decision.");
  }

  if (data.status !== "pending") {
    throw new Error("Only pending proposals can be updated.");
  }

  return data;
}

export async function acceptProposalAction(formData: FormData) {
  const user = await requireUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await getProposalForDecision(proposalId, user.id);
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      proposal_id: proposal.id,
      mode: proposal.mode,
      user_a_id: proposal.requester_id,
      user_b_id: proposal.recipient_id,
      target_listing_id: proposal.target_listing_id,
      offered_listing_id: proposal.offered_listing_id,
      status: "pending",
      agreed_at: now,
    })
    .select("id")
    .single();

  if (tradeError || !trade) {
    throw new Error(tradeError?.message ?? "Trade could not be created.");
  }

  // Messaging will use this trade-scoped conversation once the chat UI is added.
  const { error: conversationError } = await supabase.from("conversations").insert({
    context_type: "trade",
    context_id: trade.id,
    user_a_id: proposal.requester_id,
    user_b_id: proposal.recipient_id,
  });

  if (conversationError) {
    await supabase.from("trades").delete().eq("id", trade.id);
    throw new Error(conversationError.message);
  }

  const { error: proposalError } = await supabase
    .from("proposals")
    .update({ status: "accepted" })
    .eq("id", proposal.id);

  if (proposalError) {
    await supabase.from("conversations").delete().eq("context_type", "trade").eq("context_id", trade.id);
    await supabase.from("trades").delete().eq("id", trade.id);
    throw new Error(proposalError.message);
  }

  const listingIds = [proposal.target_listing_id, proposal.offered_listing_id].filter(Boolean);

  if (listingIds.length) {
    const { error: listingError } = await supabase
      .from("listings")
      .update({ status: "pending" })
      .in("id", listingIds);

    if (listingError) {
      throw new Error(listingError.message);
    }
  }

  await createNotifications([
    {
      userId: proposal.requester_id,
      type: "proposal_accepted",
      title: "Proposal accepted",
      body: "Your proposal was accepted. The trade is ready for coordination.",
      linkPath: "/trades",
    },
    {
      userId: proposal.recipient_id,
      type: "trade_created",
      title: "Trade created",
      body: "The accepted proposal is ready for coordination.",
      linkPath: "/trades",
    },
  ]);

  revalidatePath("/proposals");
  revalidatePath("/trades");
  redirect("/proposals");
}

export async function declineProposalAction(formData: FormData) {
  const user = await requireUser();
  const proposalId = String(formData.get("proposalId") ?? "");
  const proposal = await getProposalForDecision(proposalId, user.id);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("proposals")
    .update({ status: "declined" })
    .eq("id", proposal.id);

  if (error) {
    throw new Error(error.message);
  }

  await createNotifications([
    {
      userId: proposal.requester_id,
      type: "proposal_declined",
      title: "Proposal declined",
      body: "Your proposal was declined.",
      linkPath: "/proposals",
    },
  ]);

  revalidatePath("/proposals");
  redirect("/proposals");
}
