"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { defaultLocalRadiusKm } from "@/lib/constants/radius";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingInputSchema } from "@/lib/validation/listings";
import type { ExchangeMode } from "@/types/domain";

const listingMediaBucket = "listing-media";
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxListingImages = 3;
const maxImageSizeBytes = 5 * 1024 * 1024;

function parseTags(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "bin";
}

export async function createListingAction(formData: FormData) {
  const user = await requireUser();
  const exchangeMode = String(formData.get("exchangeMode") ?? "barter") as ExchangeMode;
  const isDigital = exchangeMode === "digital";
  const imageFiles = getImageFiles(formData);
  const parsed = listingInputSchema.parse({
    exchangeMode,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    tags: parseTags(formData.get("tags")),
    city: isDigital ? null : String(formData.get("city") ?? "").trim(),
    localRadiusKm: isDigital ? null : Number(formData.get("localRadiusKm") ?? defaultLocalRadiusKm),
    isRemote: isDigital,
    wanted: String(formData.get("wanted") ?? "") || null,
  });

  const supabase = await createServerSupabaseClient();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("group_name")
    .eq("id", parsed.categoryId)
    .single();

  if (categoryError || !category) {
    throw new Error("Category not found.");
  }

  const requiresImages = category.group_name === "Goods" && parsed.exchangeMode !== "digital";

  if (imageFiles.length > maxListingImages) {
    throw new Error("Listings can include up to 3 images.");
  }

  if (requiresImages && imageFiles.length === 0) {
    throw new Error("Physical goods listings require at least one image.");
  }

  for (const file of imageFiles) {
    if (file.size > maxImageSizeBytes) {
      throw new Error("Image must be under 5MB");
    }

    if (!acceptedImageTypes.includes(file.type)) {
      throw new Error("Accepted image formats are jpg, png, and webp.");
    }
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      exchange_mode: parsed.exchangeMode,
      status: "active",
      title: parsed.title,
      description: parsed.description,
      category_id: parsed.categoryId,
      tags: parsed.tags,
      city: parsed.city,
      local_radius_km: parsed.localRadiusKm,
      is_remote: parsed.isRemote,
      wanted: parsed.wanted,
      delivery_date_required: parsed.exchangeMode === "digital",
    })
    .select("id, slug")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (imageFiles.length > 0) {
    const photoRows = [];

    for (const [index, file] of imageFiles.entries()) {
      const extension = getExtension(file);
      const storagePath = `${user.id}/${data.slug}/${index + 1}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(listingMediaBucket)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      photoRows.push({
        listing_id: data.id,
        storage_path: storagePath,
        alt_text: parsed.title,
        sort_order: index,
      });
    }

    const { error: photoError } = await supabase.from("listing_photos").insert(photoRows);

    if (photoError) {
      throw new Error(photoError.message);
    }
  }

  revalidatePath("/browse");
  redirect(`/listings/published?slug=${data.slug}`);
}
