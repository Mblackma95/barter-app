"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/service";
import { hasCashLanguage } from "@/lib/validation/tags";

export async function sendTradeMessageAction(_state: { error: string; sent: number; draft?: string }, formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ tradeId: z.string().uuid(), body: z.string().trim().min(1).max(2000) })
    .safeParse({ tradeId: formData.get("tradeId"), body: formData.get("body") });
  if (!parsed.success) return { error: "Enter a message between 1 and 2,000 characters.", sent: 0 };
  if (hasCashLanguage(parsed.data.body)) return { error: "Keep exchanges cash-free. Please revise your message.", sent: 0, draft: parsed.data.body };
  const { tradeId, body } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { data: trade, error } = await supabase.from("trades")
    .select("id,user_a_id,user_b_id,status").eq("id", tradeId).single();
  if (error || !trade || ![trade.user_a_id, trade.user_b_id].includes(user.id)) {
    return { error: "This conversation is unavailable.", sent: 0 };
  }
  if (!["pending", "completed"].includes(trade.status)) return { error: "Messaging is unavailable for this trade.", sent: 0 };
  const { data: threads, error: threadError } = await supabase.from("conversations")
    .select("id").eq("context_type", "trade").eq("context_id", tradeId).order("created_at").limit(1);
  if (threadError) return { error: "Could not open conversation. Try again.", sent: 0 };
  let conversationId = threads?.[0]?.id;
  if (!conversationId) {
    // Older accepted trades may predate conversation creation.
    const { data: thread, error: createError } = await supabase.from("conversations").insert({
      context_type: "trade", context_id: tradeId, user_a_id: trade.user_a_id, user_b_id: trade.user_b_id,
    }).select("id").single();
    if (createError || !thread) return { error: "Could not open conversation. Try again.", sent: 0 };
    conversationId = thread.id;
  }
  const { error: sendError } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body });
  if (sendError) return { error: "Message was not sent. Please try again.", sent: 0 };
  // A notification failure must not make a successfully sent message look unsent.
  try {
    await createNotification({ userId: trade.user_a_id === user.id ? trade.user_b_id : trade.user_a_id,
      type: "message_received", title: "New trade message", body: "Your trading partner sent a message.", linkPath: `/trades/${tradeId}` });
  } catch (error) { console.error("Trade message notification failed", error); }
  revalidatePath(`/trades/${tradeId}`);
  return { error: "", sent: Date.now() };
}
