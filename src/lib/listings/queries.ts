import { hasPublicSupabaseEnv } from "@/lib/env";
import { maxLocalRadiusKm } from "@/lib/constants/radius";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ExchangeMode } from "@/types/domain";

const listingMediaBucket = "listing-media";

export type CategoryRow = {
  id: string;
  group_name: string;
  name: string;
  slug: string;
};

export type ListingRow = {
  id: string;
  slug: string;
  owner_id: string;
  exchange_mode: ExchangeMode;
  status: string;
  title: string;
  description: string;
  category_id: string;
  tags: string[];
  city: string | null;
  local_radius_km: number | null;
  is_remote: boolean;
  wanted: string | null;
  created_at: string;
  categories?: Pick<CategoryRow, "group_name" | "name" | "slug"> | null;
  profiles?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    city: string;
    bio: string | null;
    interests: string[];
    skills: string[];
    current_wants: string[];
    current_needs: string[];
    preferred_category_ids: string[];
    allowed_radius_km: number;
    gifts_given_count: number;
    trust_score: number;
  } | null;
  listing_photos?: {
    storage_path: string;
    public_url: string;
    alt_text: string | null;
    sort_order: number;
  }[];
};

export type ListingFilters = {
  mode?: ExchangeMode;
  categoryId?: string;
  city?: string;
  radiusKm?: number;
};

function withPublicPhotoUrls<T extends { listing_photos?: { storage_path: string; alt_text: string | null; sort_order: number }[] }>(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  listing: T,
) {
  return {
    ...listing,
    listing_photos: (listing.listing_photos ?? []).map((photo) => ({
      ...photo,
      public_url: supabase.storage.from(listingMediaBucket).getPublicUrl(photo.storage_path).data.publicUrl,
    })),
  };
}

export async function listCategories() {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, group_name, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}

export async function listListings(filters: ListingFilters = {}) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      owner_id,
      exchange_mode,
      status,
      title,
      description,
      category_id,
      tags,
      city,
      local_radius_km,
      is_remote,
      wanted,
      created_at,
      categories:category_id(group_name, name, slug),
      profiles:owner_id(display_name, username, avatar_url, city, bio, interests, skills, current_wants, current_needs, preferred_category_ids, allowed_radius_km, gifts_given_count, trust_score),
      listing_photos(storage_path, alt_text, sort_order)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters.mode) {
    query = query.eq("exchange_mode", filters.mode);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.mode && filters.mode !== "digital" && filters.city) {
    query = query.eq("city", filters.city);
  }

  if (filters.mode && filters.mode !== "digital" && filters.radiusKm) {
    query = query.lte("local_radius_km", Math.min(filters.radiusKm, maxLocalRadiusKm));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((listing) =>
    withPublicPhotoUrls(supabase, listing),
  ) as unknown as ListingRow[];
}

export async function getListingBySlug(slug: string) {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      slug,
      owner_id,
      exchange_mode,
      status,
      title,
      description,
      category_id,
      tags,
      city,
      local_radius_km,
      is_remote,
      wanted,
      created_at,
      categories:category_id(group_name, name, slug),
      profiles:owner_id(display_name, username, avatar_url, city, bio, interests, skills, current_wants, current_needs, preferred_category_ids, allowed_radius_km, gifts_given_count, trust_score),
      listing_photos(storage_path, alt_text, sort_order)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return withPublicPhotoUrls(supabase, data) as unknown as ListingRow;
}

export async function listUserActiveBarterListings(userId: string) {
  if (!hasPublicSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, title")
    .eq("owner_id", userId)
    .eq("exchange_mode", "barter")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
