"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const city = String(formData.get("city") ?? "");
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        city,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/profile/edit?onboarding=1");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/auth?error=" + encodeURIComponent("Could not sign in. Check your email and password, or reset your password."));
  }

  redirect("/browse");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const origin = (await headers()).get("origin");
  if (!origin || !email) redirect("/auth?error=Enter%20your%20email%20and%20try%20again.");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });
  if (error) redirect("/auth?error=Could%20not%20send%20reset%20email.%20Please%20try%20again.");
  redirect("/auth?message=If%20an%20account%20exists%2C%20check%20your%20email%20for%20a%20reset%20link.%20Open%20it%20in%20this%20browser.");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8 || password !== formData.get("confirmPassword")) {
    redirect("/auth/reset-password?error=Passwords%20must%20match%20and%20contain%20at%20least%208%20characters.");
  }
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth?error=Your%20reset%20link%20expired.%20Request%20a%20new%20one.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/auth/reset-password?error=Could%20not%20update%20password.%20Try%20a%20new%20password%20or%20request%20another%20link.");
  await supabase.auth.signOut();
  redirect("/auth?message=Password%20updated.%20Sign%20in%20with%20your%20new%20password.");
}
