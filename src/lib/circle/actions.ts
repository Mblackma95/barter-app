"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const addCircleInputSchema = z.object({
  circleUserId: z.string().uuid(),
  redirectTo: z.string().startsWith("/").default("/browse"),
});

export async function addToCircleAction(formData: FormData) {
  const user = await requireUser();
  const parsed = addCircleInputSchema.parse({
    circleUserId: String(formData.get("circleUserId") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "/browse"),
  });

  if (parsed.circleUserId === user.id) {
    throw new Error("You cannot add yourself to your circle.");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("user_circles").upsert(
    [
      { user_id: user.id, circle_user_id: parsed.circleUserId },
      { user_id: parsed.circleUserId, circle_user_id: user.id },
    ],
    { onConflict: "user_id,circle_user_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(parsed.redirectTo);
  revalidatePath("/trades");
  redirect(parsed.redirectTo);
}
