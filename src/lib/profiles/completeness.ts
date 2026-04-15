export type ProfileCompletenessInput = {
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  interests: string[] | null;
  skills: string[] | null;
  current_wants: string[] | null;
  current_needs?: string[] | null;
};

export function getProfileCompletionIssues(profile: ProfileCompletenessInput | null) {
  if (!profile) {
    return ["Create your profile."];
  }

  const issues = [];

  if (!profile.avatar_url) {
    issues.push("Add a profile photo.");
  }

  if (!profile.bio || profile.bio.trim().length < 10) {
    issues.push("Add a short bio.");
  }

  if (!profile.city || profile.city.trim().length < 2) {
    issues.push("Add your city or town.");
  }

  if ((profile.interests?.length ?? 0) === 0 && (profile.skills?.length ?? 0) === 0) {
    issues.push("Add at least one interest or skill.");
  }

  if ((profile.current_wants?.length ?? 0) === 0 && (profile.current_needs?.length ?? 0) === 0) {
    issues.push("Add at least one current want or need.");
  }

  return issues;
}

export function isProfileCompleteForExchange(profile: ProfileCompletenessInput | null) {
  return getProfileCompletionIssues(profile).length === 0;
}
