export type ProfileCompletenessInput = {
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  interests: string[] | null;
  skills: string[] | null;
  current_wants: string[] | null;
  current_needs?: string[] | null;
  trade_radius?: number | null;
};

function hasMinLength(value: string | null | undefined, min: number) {
  return !!value && value.trim().length >= min;
}

function hasAnyItems(values: string[] | null | undefined) {
  return (values?.length ?? 0) > 0;
}

export function getProfileCompletionIssues(profile: ProfileCompletenessInput | null) {
  if (!profile) {
    return ["Create your profile."];
  }

  const issues: string[] = [];

  if (!profile.avatar_url) {
    issues.push("Add a profile photo.");
  }

  if (!hasMinLength(profile.bio, 10)) {
    issues.push("Add a short bio.");
  }

  if (!hasMinLength(profile.city, 2)) {
    issues.push("Add your city or town.");
  }

  if (!hasAnyItems(profile.interests) && !hasAnyItems(profile.skills)) {
    issues.push("Add at least one interest or skill.");
  }

  if (!hasAnyItems(profile.current_wants) && !hasAnyItems(profile.current_needs)) {
    issues.push("Add at least one current want or need.");
  }

  return issues;
}

export function getProfileSetupIssues(profile: ProfileCompletenessInput | null) {
  const issues = [...getProfileCompletionIssues(profile)];

  const radius = profile?.trade_radius ?? null;
  if (radius === null || radius < 1 || radius > 50) {
    issues.push("Set your trade radius.");
  }

  return issues;
}

export function isProfileCompleteForExchange(profile: ProfileCompletenessInput | null) {
  return getProfileCompletionIssues(profile).length === 0;
}

export function isProfileSetupComplete(profile: ProfileCompletenessInput | null) {
  return getProfileSetupIssues(profile).length === 0;
}