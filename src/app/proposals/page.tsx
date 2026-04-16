import { requireUser } from "@/lib/auth/session";
import { acceptProposalAction, declineProposalAction } from "@/lib/proposals/actions";
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
            Pending received proposals: {unreadPlaceholderCount}.
          </p>
        </div>
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
              {proposal.recipient_id === user.id && proposal.status === "pending" ? (
                <div className={styles.actions}>
                  <form action={acceptProposalAction}>
                    <input type="hidden" name="proposalId" value={proposal.id} />
                    <button type="submit">Accept proposal</button>
                  </form>
                  <form action={declineProposalAction}>
                    <input type="hidden" name="proposalId" value={proposal.id} />
                    <button type="submit">Decline</button>
                  </form>
                </div>
              ) : (
                <p className={styles.placeholder}>Current status: {proposal.status}</p>
              )}
            </article>
          ))
        ) : (
          <p className={styles.notice}>No proposals yet.</p>
        )}
      </section>
    </main>
  );
}
