import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { markNotificationReadAction } from "@/lib/notifications/actions";
import { listUserNotifications } from "@/lib/notifications/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await listUserNotifications(user.id);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Notifications</p>
          <h1>Updates</h1>
          <p className={styles.subtle}>Unread: {unreadCount}</p>
        </div>
      </header>

      <section className={styles.list}>
        {notifications.length ? (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`${styles.card} ${notification.read_at ? "" : styles.unread}`}
            >
              <p className={styles.meta}>{notification.type.replaceAll("_", " ")}</p>
              <h2>{notification.title}</h2>
              {notification.body ? <p>{notification.body}</p> : null}
              <div className={styles.actions}>
                {notification.link_path ? <Link href={notification.link_path}>Open</Link> : null}
                {!notification.read_at ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button type="submit">Mark read</button>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className={styles.notice}>No notifications yet.</p>
        )}
      </section>
    </main>
  );
}
