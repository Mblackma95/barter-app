import { redirect } from "next/navigation";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email?: string;
};

export async function getOptionalUser(): Promise<AuthUser | null> {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

export async function requireUser() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}
