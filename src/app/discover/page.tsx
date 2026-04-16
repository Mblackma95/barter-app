import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listAiMatchOpportunities } from "@/lib/discover/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const user = await requireUser();
  const matches = await listAiMatchOpportunities(user.id);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Discover</p>
        <h1>AI match opportunities</h1>
        <p className={styles.subtle}>
          Matches are suggestions only. You choose whether to open a listing and start a proposal.
        </p>
      </header>

      <section className={styles.notice}>
        <h2>How matches work</h2>
        <p>
          AI matches can help surface promising barter opportunities, but they do not create proposals or
          trades. Proposals stay user-initiated, and trades only begin after a proposal is accepted.
        </p>
      </section>

      <section className={styles.list}>
        {matches.length ? (
          matches.map((match) => (
            <article key={match.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <p className={styles.meta}>{match.listings?.exchange_mode ?? "match"}</p>
                <span className={styles.status}>
                  {match.score >= 80 ? "High-quality match" : "Opportunity"} · {match.score}%
                </span>
              </div>
              <h2>{match.listings?.title ?? "Matched listing"}</h2>
              <p>
                {match.listings?.categories?.name ?? "Category"} ·{" "}
                {match.listings?.exchange_mode === "digital" ? "Remote" : match.listings?.city ?? "Local"}
              </p>
              {match.reasons?.length ? (
                <ul className={styles.reasons}>
                  {match.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
              {match.listings?.slug ? <Link href={`/listings/${match.listings.slug}`}>View listing</Link> : null}
            </article>
          ))
        ) : (
          <p className={styles.notice}>
            No AI matches yet. This page is ready for the matching engine, and high-quality matches can
            later create notifications without creating proposals automatically.
          </p>
        )}
      </section>
    </main>
  );
}
