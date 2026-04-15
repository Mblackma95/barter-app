"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { profileInputSchema } from "@/lib/validation/profiles";

const profileMediaBucket = "profile-media";
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxProfileImageSizeBytes = 5 * 1024 * 1024;

function parseList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseUuidList(values: FormDataEntryValue[]) {
  return values.map((value) => String(value)).filter(Boolean);
}

function getOptionalProfilePhoto(formData: FormData) {
  const value = formData.get("profilePhoto");

  if (value instanceof File && value.size > 0) {
    return value;
  }

  return null;
}

function getExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "bin";
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileInputSchema.parse({
    username: String(formData.get("username") ?? "") || undefined,
    displayName: String(formData.get("displayName") ?? ""),
    city: String(formData.get("city") ?? ""),
    bio: String(formData.get("bio") ?? "") || undefined,
    interests: parseList(formData.get("interests")),
    skills: parseList(formData.get("skills")),
    currentWants: parseList(formData.get("currentWants")),
    currentNeeds: parseList(formData.get("currentNeeds")),
    preferredCategoryIds: parseUuidList(formData.getAll("preferredCategoryIds")),
    hobbies: parseList(formData.get("hobbies")),
    profession: String(formData.get("profession") ?? "") || undefined,
    allowedRadiusKm: Number(formData.get("allowedRadiusKm") ?? 20),
  });
  const profilePhoto = getOptionalProfilePhoto(formData);
  const supabase = await createServerSupabaseClient();
  let avatarUrl = String(formData.get("existingAvatarUrl") ?? "") || null;

  if (profilePhoto) {
    if (profilePhoto.size > maxProfileImageSizeBytes) {
      throw new Error("Image must be under 5MB");
    }

    if (!acceptedImageTypes.includes(profilePhoto.type)) {
      throw new Error("Accepted profile photo formats are jpg, png, and webp.");
    }

    const extension = getExtension(profilePhoto);
    const storagePath = `${user.id}/profile-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(profileMediaBucket)
      .upload(storagePath, profilePhoto, {
        contentType: profilePhoto.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    avatarUrl = supabase.storage.from(profileMediaBucket).getPublicUrl(storagePath).data.publicUrl;
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username: parsed.username,
    display_name: parsed.displayName,
    avatar_url: avatarUrl,
    city: parsed.city,
    bio: parsed.bio ?? null,
    interests: parsed.interests,
    skills: parsed.skills,
    current_wants: parsed.currentWants,
    current_needs: parsed.currentNeeds,
    preferred_category_ids: parsed.preferredCategoryIds,
    hobbies: parsed.hobbies,
    profession: parsed.profession ?? null,
    allowed_radius_km: parsed.allowedRadiusKm,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/profile/edit");
  revalidatePath("/browse");
  redirect("/profile/edit?saved=1");
}
