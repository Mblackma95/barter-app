import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  linkPath?: string | null;
};

export async function createNotification(input: NotificationInput) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link_path: input.linkPath ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (!inputs.length) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("notifications").insert(
    inputs.map((input) => ({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link_path: input.linkPath ?? null,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}
