import { requireUser } from "@/lib/auth/session";
import { addToCircleAction } from "@/lib/circle/actions";
import { listCircleUserIds } from "@/lib/circle/queries";
import { confirmTradeCompletionAction } from "@/lib/trades/actions";
import { listUserTrades } from "@/lib/trades/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function getTradeStatusCopy(status: string) {
  if (status === "completed") {
    return "Completed = finished and ready for reviews.";
  }

  if (status === "canceled") {
    return "Canceled = this exchange is no longer moving forward.";
  }

  if (status === "disputed") {
    return "Disputed = this exchange needs follow-up.";
  }

  return "Pending = coordinating details and chat before completion.";
}

export default async function TradesPage() {
  const user = await requireUser();
  const [trades, circleUserIds] = await Promise.all([listUserTrades(user.id), listCircleUserIds(user.id)]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Trades</p>
          <h1>Active and completed trades</h1>
          <p className={styles.subtle}>
            Accepted proposals become pending trades for coordination. Both traders confirm completion when finished.
          </p>
        </div>
      </header>

      <section className={styles.list}>
        {trades.length ? (
          trades.map((trade) => {
            const otherTrader = trade.user_a_id === user.id ? trade.user_b : trade.user_a;
            const userConfirmed =
              trade.user_a_id === user.id ? trade.user_a_confirmed_at : trade.user_b_confirmed_at;
            const otherConfirmed =
              trade.user_a_id === user.id ? trade.user_b_confirmed_at : trade.user_a_confirmed_at;
            const otherTraderId = trade.user_a_id === user.id ? trade.user_b_id : trade.user_a_id;
            const otherTraderInCircle = circleUserIds.has(otherTraderId);

            return (
              <article key={trade.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <p className={styles.meta}>{trade.mode}</p>
                  <span className={styles.status}>{trade.status.replace("_", " ")}</span>
                </div>
                <h2>{trade.target_listing?.title ?? "Trade listing"}</h2>
                {trade.offered_listing?.title ? <p>Offered: {trade.offered_listing.title}</p> : null}
                <p>With: {otherTrader?.display_name ?? "Trader"}</p>
                <p>
                  Completion: {userConfirmed ? "You confirmed" : "You have not confirmed"};{" "}
                  {otherConfirmed ? "other trader confirmed" : "waiting on other trader"}
                </p>

                <p className={styles.placeholder}>{getTradeStatusCopy(trade.status)}</p>
                <p className={styles.placeholder}>
                  Messaging will attach to this trade thread after the chat UI is added.
                </p>

                {trade.status === "pending" ? (
                  <div className={styles.actions}>
                    <form action={confirmTradeCompletionAction}>
                      <input type="hidden" name="tradeId" value={trade.id} />
                      <button type="submit" disabled={Boolean(userConfirmed)}>
                        Confirm complete
                      </button>
                    </form>
                  </div>
                ) : null}

                {trade.status === "completed" ? (
                  <div className={styles.completedActions}>
                    <p className={styles.placeholder}>Reviews are available for this trade.</p>
                    {otherTraderInCircle ? (
                      <p className={styles.circleState}>In Circle ✓</p>
                    ) : (
                      <form action={addToCircleAction}>
                        <input type="hidden" name="circleUserId" value={otherTraderId} />
                        <input type="hidden" name="redirectTo" value="/trades" />
                        <button type="submit">Add trader to Circle</button>
                      </form>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className={styles.notice}>No trades yet.</p>
        )}
      </section>
    </main>
  );
}
