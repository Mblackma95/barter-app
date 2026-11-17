import { requireUser } from "@/lib/auth/session";
import { approveGiftRequestAction, confirmGiftCompletionAction } from "@/lib/gifts/actions";
import { listUserGiftRequests } from "@/lib/gifts/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const user = await requireUser();
  const giftRequests = await listUserGiftRequests(user.id);
  const pendingReceivedCount = giftRequests.filter(
    (request) => request.giver_id === user.id && request.status === "pending",
  ).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Gifts</p>
          <h1>Gift requests and approvals</h1>
          <p className={styles.subtle}>
            Pending received gift requests: {pendingReceivedCount}. Broader
            unread badges will be part of the future notification system.
          </p>
        </div>
      </header>

      <section className={styles.list}>
        {giftRequests.length ? (
          giftRequests.map((request) => {
            const isGiver = request.giver_id === user.id;
            const userConfirmed = isGiver ? request.giver_confirmed_at : request.requester_confirmed_at;
            const otherConfirmed = isGiver ? request.requester_confirmed_at : request.giver_confirmed_at;

            return (
              <article key={request.id} className={styles.card}>
                <p className={styles.meta}>{request.status}</p>
                <h2>{request.listings?.title ?? "Gift listing"}</h2>
                <p>{request.message}</p>
                <p className={styles.meta}>{isGiver ? "Received by you" : "Requested by you"}</p>
                {isGiver && request.status === "pending" ? (
                  <form action={approveGiftRequestAction}>
                    <input type="hidden" name="giftRequestId" value={request.id} />
                    <button type="submit">Approve recipient</button>
                  </form>
                ) : null}
                {request.status === "approved" ? (
                  <div className={styles.completion}>
                    <p>
                      Completion: {userConfirmed ? "You confirmed" : "You have not confirmed"};{" "}
                      {otherConfirmed ? "other trader confirmed" : "waiting on other trader"}
                    </p>
                    <form action={confirmGiftCompletionAction}>
                      <input type="hidden" name="giftRequestId" value={request.id} />
                      <button type="submit" disabled={Boolean(userConfirmed)}>
                        Confirm gift complete
                      </button>
                    </form>
                  </div>
                ) : null}
                {request.status === "completed" ? (
                  <p className={styles.placeholder}>Gift completed. Reviews are available.</p>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className={styles.notice}>No gift requests yet.</p>
        )}
      </section>
    </main>
  );
}
