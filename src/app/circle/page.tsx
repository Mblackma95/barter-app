/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listCircleProfiles } from "@/lib/circle/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function getBioSnippet(bio: string | null) {
  if (!bio) {
    return null;
  }

  return bio.length > 130 ? `${bio.slice(0, 127)}...` : bio;
}

export default async function CirclePage() {
  const user = await requireUser();
  const circleProfiles = await listCircleProfiles(user.id);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Circle</p>
        <h1>Your trusted network</h1>
        <p>
          Circle is a lightweight trust layer for people you have traded with or want to keep close.
        </p>
      </header>

      <section className={styles.grid}>
        {circleProfiles.length ? (
          circleProfiles.map(({ created_at, profile }) =>
            profile ? (
              <article key={profile.id} className={styles.card}>
                {profile.avatar_url ? (
                  <img className={styles.avatar} src={profile.avatar_url} alt={profile.display_name} />
                ) : (
                  <div className={styles.avatarFallback}>{profile.display_name.slice(0, 1).toUpperCase()}</div>
                )}
                <div className={styles.cardBody}>
                  <p className={styles.meta}>In Circle since {new Date(created_at).toLocaleDateString()}</p>
                  <h2>{profile.display_name}</h2>
                  <p className={styles.meta}>{profile.city || "City not added"}</p>
                  {getBioSnippet(profile.bio) ? <p>{getBioSnippet(profile.bio)}</p> : null}
                  <div className={styles.actions}>
                    {profile.username ? <Link href={`/profiles/${profile.username}`}>View Profile</Link> : null}
                    <span>Messaging soon</span>
                  </div>
                </div>
              </article>
            ) : null,
          )
        ) : (
          <p className={styles.notice}>
            Your Circle is empty for now. Visit a trader profile or a completed trade to add someone.
          </p>
        )}
      </section>
    </main>
  );
}
