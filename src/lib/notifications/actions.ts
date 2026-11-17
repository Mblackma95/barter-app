"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = String(formData.get("notificationId") ?? "");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notifications");
}
