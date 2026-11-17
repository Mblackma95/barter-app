import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { listUserTrades } from "@/lib/trades/queries";
import { confirmTradeCompletionAction } from "@/lib/trades/actions";
import { getTradeConversation } from "@/lib/messages/queries";
import { TradeChat } from "@/components/messages/TradeChat";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default async function TradeConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const trades = await listUserTrades(user.id);
  const trade = trades.find(item => item.id === id);
  if (!trade) notFound();
  const conversation = await getTradeConversation(id);
  const isUserA = trade.user_a_id === user.id;
  const otherTrader = isUserA ? trade.user_b : trade.user_a;
  const confirmed = isUserA ? trade.user_a_confirmed_at : trade.user_b_confirmed_at;
  const otherConfirmed = isUserA ? trade.user_b_confirmed_at : trade.user_a_confirmed_at;
  return <main className={styles.page}>
    <Link href="/trades">All conversations and trades</Link>
    <header className={styles.header}><div>
      <p className={styles.eyebrow}>{trade.mode} exchange</p>
      <h1>Trade with {otherTrader?.display_name ?? "your trader"}</h1>
    </div></header>
    <section className={styles.card}>
      <h2>{trade.target_listing?.title ?? "Trade listing"}</h2>
      {trade.offered_listing ? <p>In exchange for: {trade.offered_listing.title}</p> : null}
      <p>{trade.status === "completed" ? "Completed" : trade.status === "pending" ? "Pending - arrange your exchange" : trade.status}</p>
      {trade.mode !== "digital" ? <p>Meet in a busy public place, such as a police station exchange zone or library. Agree on a time together. Your address is never shared automatically.</p> : <p>Agree on delivery details here before confirming the work is finished.</p>}
    </section>
    <TradeChat tradeId={id} userId={user.id} messages={conversation.messages} canMessage={["pending", "completed"].includes(trade.status)} />
    <section className={styles.card}>
      <h2>{trade.status === "completed" ? "How did your exchange go?" : "Finished your exchange?"}</h2>
      {trade.status === "completed" ? <>
        <p>Both traders confirmed. Your listings are archived. Leave a review within 7 days; reviews reveal when both submit or the window ends.</p>
        <Link href="/reviews">Leave a review</Link>
      </> : trade.status === "pending" ? <>
        <p>{confirmed ? "You confirmed completion. Waiting for your trader." : otherConfirmed ? "Your trader confirmed completion. Confirm once you have received your exchange." : "Only confirm after you have exchanged the items or finished the service."}</p>
        <form action={confirmTradeCompletionAction} className={styles.actions}>
          <input name="tradeId" type="hidden" value={id} />
          <input name="returnToTrade" type="hidden" value="1" />
          <button type="submit" disabled={Boolean(confirmed)}>{confirmed ? "Waiting for trader" : "Confirm exchange complete"}</button>
        </form>
      </> : <p>This trade is {trade.status}.</p>}
    </section>
  </main>;
}
