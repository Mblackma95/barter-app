import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getListingBySlug } from "@/lib/listings/queries";
import styles from "./page.module.css";

type PublishedSearchParams = {
  slug?: string;
};

export default async function ListingPublishedPage({
  searchParams,
}: {
  searchParams: Promise<PublishedSearchParams>;
}) {
  await requireUser();
  const { slug } = await searchParams;
  const listing = slug ? await getListingBySlug(slug) : null;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Listing published</p>
        <h1>{listing ? listing.title : "Your listing is live."}</h1>
        <p>
          Your listing was created successfully. You can view it, browse other
          listings, or create another one.
        </p>
        <div className={styles.actions}>
          {listing ? <Link href={`/listings/${listing.slug}`}>View Listing</Link> : null}
          <Link href="/browse">Browse Listings</Link>
          <Link href="/listings/new">Create Another Listing</Link>
        </div>
      </section>
    </main>
  );
}
