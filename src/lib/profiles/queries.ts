import { hasPublicSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileSetupIssues, getProfileCompletionIssues } from "./completeness";

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  bio: string | null;
  interests: string[];
  skills: string[];
  current_wants: string[];
  current_needs: string[];
  preferred_category_ids: string[];
  allowed_radius_km: number;
  hobbies: string[];
  profession: string | null;
  gifts_given_count: number;
  trust_score: number;
  profile_completed_at: string | null;
};

const profileSelect = `
  id,
  username,
  display_name,
  avatar_url,
  city,
  bio,
  interests,
  skills,
  current_wants,
  current_needs,
  preferred_category_ids,
  allowed_radius_km,
  hobbies,
  profession,
  gifts_given_count,
  trust_score,
  profile_completed_at
`;

export function getProfileReadiness(profile: ProfileRow | null) {
  const issues = getProfileSetupIssues(
    profile
      ? {
          ...profile,
          trade_radius: profile.allowed_radius_km,
        }
      : null,
  );

  return {
    isComplete: issues.length === 0,
    issues,
  };
}

export async function getProfileById(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("profiles").select(profileSelect).eq("id", userId).single();

  if (error) {
    return null;
  }

  return data as ProfileRow;
}

export async function getProfileByUsername(username: string) {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("username", username)
    .single();

  if (error) {
    return null;
  }

  return data as ProfileRow;
}

export async function assertProfileReadyForExchange(userId: string) {
  const profile = await getProfileById(userId);

  const issues = getProfileCompletionIssues(
    profile
      ? {
          ...profile,
          trade_radius: profile.allowed_radius_km,
        }
      : null,
  );

  if (issues.length > 0) {
    throw new Error(`Complete your profile before sending proposals or gift requests: ${issues.join(" ")}`);
  }

  return profile;
}