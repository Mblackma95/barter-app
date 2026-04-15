import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listUserProposals } from "@/lib/proposals/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const user = await requireUser();
  const proposals = await listUserProposals(user.id);
  const unreadPlaceholderCount = proposals.filter(
    (proposal) => proposal.recipient_id === user.id && proposal.status === "pending",
  ).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Proposals</p>
          <h1>Barter and digital proposals</h1>
          <p className={styles.subtle}>
            Pending received proposals: {unreadPlaceholderCount}. Full unread
            badges and proposal actions arrive in the next phase.
          </p>
        </div>
        <Link href="/browse">Browse</Link>
      </header>

      <section className={styles.list}>
        {proposals.length ? (
          proposals.map((proposal) => (
            <article key={proposal.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <p className={styles.meta}>Type: {proposal.mode}</p>
                <span className={styles.status}>Status: {proposal.status}</span>
              </div>
              <h2>Related listing: {proposal.target_listing?.title ?? "Listing"}</h2>
              <p>
                Sender:{" "}
                {proposal.requester_id === user.id
                  ? "You"
                  : proposal.requester?.display_name ?? "Unknown user"}
              </p>
              <p>
                Recipient:{" "}
                {proposal.recipient_id === user.id
                  ? "You"
                  : proposal.recipient?.display_name ?? "Unknown user"}
              </p>
              {proposal.offered_listing?.title ? (
                <p>Offered: {proposal.offered_listing.title}</p>
              ) : null}
              {proposal.delivery_date ? <p>Delivery date: {proposal.delivery_date}</p> : null}
              {proposal.note ? <p>{proposal.note}</p> : null}
              <p className={styles.placeholder}>
                Accept, decline, and counter-proposal actions will be available
                in Phase 3.
              </p>
            </article>
          ))
        ) : (
          <p className={styles.notice}>No proposals yet.</p>
        )}
      </section>
    </main>
  );
}
