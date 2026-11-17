import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getTradeConversation(tradeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: conversations, error } = await supabase.from("conversations")
    .select("id").eq("context_type", "trade").eq("context_id", tradeId)
    .order("created_at").limit(1);
  if (error) throw new Error(error.message);
  const conversation = conversations?.[0];
  if (!conversation) return { id: null, messages: [] };
  const { data: messages, error: messageError } = await supabase.from("messages")
    .select("id, sender_id, body, created_at").eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false }).limit(200);
  if (messageError) throw new Error(messageError.message);
  return { id: conversation.id, messages: (messages ?? []).reverse() };
}
