/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileByUsername, getProfileReadiness } from "@/lib/profiles/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function ChipList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p>Nothing added yet.</p>;
  }

  return (
    <div className={styles.chips}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const readiness = getProfileReadiness(profile);

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/browse">Browse</Link>
      </nav>

      <article className={styles.card}>
        <div className={styles.header}>
          {profile.avatar_url ? (
            <img className={styles.avatar} src={profile.avatar_url} alt={profile.display_name} />
          ) : (
            <div className={styles.avatarFallback}>{profile.display_name.slice(0, 1).toUpperCase()}</div>
          )}
          <div>
            <p className={styles.eyebrow}>Barter profile</p>
            <h1>{profile.display_name}</h1>
            <p className={styles.meta}>
              @{profile.username} - {profile.city || "City not added"} - {profile.allowed_radius_km} km radius
            </p>
          </div>
        </div>

        {profile.bio ? <p>{profile.bio}</p> : <p>No bio added yet.</p>}
        {profile.profession ? <p>Work/profession: {profile.profession}</p> : null}
        {profile.hobbies.length ? <p>Hobbies: {profile.hobbies.join(", ")}</p> : null}
        <p>
          Gifts given: {profile.gifts_given_count}. Reviews and trade counts will appear after completed exchanges.
        </p>
      </article>

      {!readiness.isComplete ? (
        <p className={styles.notice}>This profile is still being completed.</p>
      ) : null}

      <section className={styles.card}>
        <h2>Interests</h2>
        <ChipList items={profile.interests} />
      </section>

      <section className={styles.card}>
        <h2>Skills</h2>
        <ChipList items={profile.skills} />
      </section>

      <section className={styles.card}>
        <h2>Current wants</h2>
        <ChipList items={profile.current_wants} />
      </section>

      <section className={styles.card}>
        <h2>Current needs</h2>
        <ChipList items={profile.current_needs} />
      </section>
    </main>
  );
}
