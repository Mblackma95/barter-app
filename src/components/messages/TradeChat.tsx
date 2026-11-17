"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendTradeMessageAction } from "@/lib/messages/actions";
import styles from "./TradeChat.module.css";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export function TradeChat({ tradeId, userId, messages, canMessage }: {
  tradeId: string; userId: string; messages: Message[]; canMessage: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendTradeMessageAction, { error: "", sent: 0 });
  const form = useRef<HTMLFormElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 5000);
    return () => clearInterval(timer);
  }, [router]);
  useEffect(() => { if (state.sent) form.current?.reset(); }, [state.sent]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);
  return <section className={styles.chat} aria-label="Trade conversation">
    <h2>Conversation</h2>
    <div className={styles.messages} aria-live="polite" role="log" aria-label="Messages">
      {!messages.length ? <p>Say hello and arrange a time and place to exchange.</p> : null}
      {messages.map(message => <article key={message.id} className={`${styles.bubble} ${message.sender_id === userId ? styles.mine : ""}`}>
        <small>{message.sender_id === userId ? "You" : "Trader"}</small>
        <p>{message.body}</p>
        <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>
      </article>)}
      <div ref={end} />
    </div>
    {canMessage ? <form ref={form} action={action} className={styles.composer}>
      <input name="tradeId" type="hidden" value={tradeId} />
      <label htmlFor="trade-message">Message your trader</label>
      <textarea id="trade-message" name="body" rows={3} required maxLength={2000} placeholder="What time works for you?" defaultValue={state.error ? state.draft : ""} key={state.sent} />
      {state.error ? <p role="alert">{state.error}</p> : null}
      <button disabled={pending} type="submit">{pending ? "Sending..." : "Send message"}</button>
    </form> : <p>Messaging is closed for this trade.</p>}
  </section>;
}
