/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/auth/session";
import { createGiftRequestAction } from "@/lib/gifts/actions";
import { getListingBySlug, listUserActiveBarterListings } from "@/lib/listings/queries";
import { getProfileById, getProfileReadiness } from "@/lib/profiles/queries";
import {
  createBarterProposalAction,
  createDigitalProposalAction,
} from "@/lib/proposals/actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  const user = await getOptionalUser();

  if (!listing) {
    notFound();
  }

  const photos = [...(listing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const userBarterListings = user ? await listUserActiveBarterListings(user.id) : [];
  const currentProfile = user ? await getProfileById(user.id) : null;
  const profileReadiness = user ? getProfileReadiness(currentProfile) : null;
  const isOwner = user?.id === listing.owner_id;
  const canSendExchangeRequest = Boolean(user && !isOwner && profileReadiness?.isComplete);
  const trader = listing.profiles;
  const traderWantsNeeds = [...(trader?.current_wants ?? []), ...(trader?.current_needs ?? [])];
  const traderBioSnippet =
    trader?.bio && trader.bio.length > 140 ? `${trader.bio.slice(0, 137)}...` : trader?.bio;

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/browse">Browse</Link>
        <Link href="/listings/new">Create listing</Link>
        <Link href="/proposals">Proposals</Link>
        <Link href="/gifts">Gifts</Link>
      </nav>

      <article className={styles.card}>
        {photos.length ? (
          <div className={styles.gallery}>
            {photos.map((photo, index) => (
              <figure key={photo.storage_path}>
                <img src={photo.public_url ?? ""} alt={photo.alt_text ?? listing.title} />
                <figcaption>{index === 0 ? "Cover image" : `Image ${index + 1}`}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
        <p className={styles.eyebrow}>
          {listing.exchange_mode} · {listing.categories?.name ?? "Category"}
        </p>
        <h1>{listing.title}</h1>
        <p>{listing.description}</p>
        {listing.wanted ? <p>Wants: {listing.wanted}</p> : null}
        <p className={styles.meta}>
          {listing.exchange_mode === "digital"
            ? "Remote digital exchange"
            : `${listing.city ?? "Local"} · ${listing.local_radius_km ?? "?"} km radius`}
        </p>
        {listing.tags?.length ? <p className={styles.meta}>Tags: {listing.tags.join(", ")}</p> : null}
      </article>

      {trader ? (
        <section className={styles.traderCard}>
          <div className={styles.traderHeader}>
            {trader.avatar_url ? (
              <img className={styles.avatar} src={trader.avatar_url} alt={trader.display_name} />
            ) : (
              <div className={styles.avatarFallback}>{trader.display_name.slice(0, 1).toUpperCase()}</div>
            )}
            <div>
              <p className={styles.eyebrow}>Trader snapshot</p>
              <h2>
                <Link href={`/profiles/${trader.username}`}>{trader.display_name}</Link>
              </h2>
              <p className={styles.meta}>
                {trader.city || "City not added"} · Gifts given: {trader.gifts_given_count}
              </p>
            </div>
          </div>
          <p>{traderBioSnippet || "No bio added yet."}</p>
          {trader.interests?.length ? (
            <p className={styles.meta}>Interests: {trader.interests.slice(0, 3).join(", ")}</p>
          ) : null}
          {traderWantsNeeds.length ? (
            <p className={styles.meta}>Wants/needs: {traderWantsNeeds.slice(0, 3).join(", ")}</p>
          ) : null}
          <p className={styles.placeholder}>Reviews and completed trade counts will appear after Phase 3.</p>
        </section>
      ) : null}

      {!user ? (
        <p className={styles.notice}>
          <Link href="/auth">Sign in</Link> to request this gift or send a proposal.
        </p>
      ) : null}

      {user && isOwner ? <p className={styles.notice}>This is your listing.</p> : null}

      {user && !isOwner && !profileReadiness?.isComplete ? (
        <section className={styles.notice}>
          <strong>Complete your profile before sending proposals or gift requests.</strong>
          <ul>
            {profileReadiness?.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <Link href="/profile/edit">Edit profile</Link>
        </section>
      ) : null}

      {canSendExchangeRequest && listing.exchange_mode === "gift" ? (
        <form action={createGiftRequestAction} className={styles.form}>
          <h2>Request this gift</h2>
          <input type="hidden" name="listingId" value={listing.id} />
          <label>
            Message to giver
            <textarea name="message" required rows={4} />
          </label>
          <button type="submit">Send gift request</button>
        </form>
      ) : null}

      {canSendExchangeRequest && listing.exchange_mode === "barter" ? (
        <form action={createBarterProposalAction} className={styles.form}>
          <h2>Propose a barter</h2>
          <input type="hidden" name="targetListingId" value={listing.id} />
          <label>
            Your offered listing
            <select name="offeredListingId" required>
              <option value="">Choose one of your barter listings</option>
              {userBarterListings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Optional note
            <textarea name="note" rows={4} />
          </label>
          <button type="submit">Send barter proposal</button>
        </form>
      ) : null}

      {canSendExchangeRequest && listing.exchange_mode === "digital" ? (
        <form action={createDigitalProposalAction} className={styles.form}>
          <h2>Propose a digital exchange</h2>
          <input type="hidden" name="targetListingId" value={listing.id} />
          <label>
            Required delivery date
            <input name="deliveryDate" type="date" required />
          </label>
          <label>
            Note
            <textarea name="note" rows={4} />
          </label>
          <button type="submit">Send digital proposal</button>
        </form>
      ) : null}
    </main>
  );
}
