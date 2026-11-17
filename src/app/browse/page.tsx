/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getOptionalUser } from "@/lib/auth/session";
import { maxLocalRadiusKm, minLocalRadiusKm } from "@/lib/constants/radius";
import { listCategories, listListings } from "@/lib/listings/queries";
import type { ExchangeMode } from "@/types/domain";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type BrowseSearchParams = {
  mode?: string;
  categoryId?: string;
  city?: string;
  radiusKm?: string;
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  const params = await searchParams;
  const supabaseReady = hasPublicSupabaseEnv();
  const user = await getOptionalUser();
  const categories = await listCategories();
  const mode = ["barter", "digital", "gift"].includes(params.mode ?? "")
    ? (params.mode as ExchangeMode)
    : undefined;
  const listings = await listListings({
    mode,
    categoryId: params.categoryId || undefined,
    city: params.city || undefined,
    radiusKm: params.radiusKm ? Math.min(Number(params.radiusKm), maxLocalRadiusKm) : undefined,
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 2</p>
          <h1>Browse Barter listings</h1>
        </div>
        <nav className={styles.nav}>
          <Link href="/listings/new">Create listing</Link>
          {!user ? <Link href="/auth">Sign in</Link> : null}
        </nav>
      </header>

      {!supabaseReady ? (
        <p className={styles.notice}>
          Supabase is not connected. Follow `SUPABASE_SETUP.md`, then restart
          the dev server to test live data.
        </p>
      ) : null}

      <form className={styles.filters}>
        <label>
          Mode
          <select name="mode" defaultValue={params.mode ?? ""}>
            <option value="">All modes</option>
            <option value="barter">Barter</option>
            <option value="digital">Digital exchange</option>
            <option value="gift">Gift</option>
          </select>
        </label>
        <label>
          Category
          <select name="categoryId" defaultValue={params.categoryId ?? ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.group_name}: {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          City
          <input name="city" defaultValue={params.city ?? ""} placeholder="Simcoe" />
        </label>
        <label>
          Radius km
          <input
            name="radiusKm"
            type="number"
            min={minLocalRadiusKm}
            max={maxLocalRadiusKm}
            defaultValue={params.radiusKm ?? ""}
          />
        </label>
        <button type="submit">Filter</button>
      </form>

      <section className={styles.grid}>
        {listings.length ? (
          listings.map((listing) => (
            <article key={listing.id} className={styles.card}>
              {listing.listing_photos?.length ? (
                <img
                  className={styles.cover}
                  src={
                    [...listing.listing_photos].sort((a, b) => a.sort_order - b.sort_order)[0]
                      .public_url ?? ""
                  }
                  alt={
                    [...listing.listing_photos].sort((a, b) => a.sort_order - b.sort_order)[0]
                      .alt_text ?? listing.title
                  }
                />
              ) : null}
              <p className={styles.meta}>
                {listing.exchange_mode} · {listing.categories?.name ?? "Category"}
              </p>
              <h2>
                <Link href={`/listings/${listing.slug}`}>{listing.title}</Link>
              </h2>
              <p>{listing.description}</p>
              {listing.wanted ? <p>Wants: {listing.wanted}</p> : null}
              <p className={styles.meta}>
                {listing.exchange_mode === "digital"
                  ? "Remote"
                  : `${listing.city ?? "Local"} · ${listing.local_radius_km ?? "?"} km`}
              </p>
              {listing.tags?.length ? <p className={styles.tags}>Tags: {listing.tags.join(", ")}</p> : null}
            </article>
          ))
        ) : (
          <p className={styles.notice}>No listings match yet.</p>
        )}
      </section>
    </main>
  );
}
