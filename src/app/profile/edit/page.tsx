import Link from "next/link";
import { ProfileSetupForm } from "@/components/profiles/ProfileSetupForm";
import { requireUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/listings/queries";
import { getProfileById, getProfileReadiness } from "@/lib/profiles/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type ProfileEditSearchParams = {
  onboarding?: string;
  saved?: string;
};

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<ProfileEditSearchParams>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const profile = await getProfileById(user.id);
  const categories = await listCategories();
  const readiness = getProfileReadiness(profile);
  const isOnboarding = params.onboarding === "1";

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/browse">Browse</Link>
        {profile?.username ? <Link href={`/profiles/${profile.username}`}>Public profile</Link> : null}
      </nav>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>{isOnboarding ? "Profile setup" : "Profile"}</p>
        <h1>{isOnboarding ? "Help people know who they are trading with." : "Edit your Barter profile."}</h1>
        <p>
          Browsing stays open, but proposals and gift requests need a trusted
          community profile first.
        </p>
      </section>

      {params.saved === "1" ? <p className={styles.notice}>Profile saved.</p> : null}

      {!readiness.isComplete ? (
        <section className={styles.notice}>
          <strong>Needed before proposals or gift requests:</strong>
          <ul className={styles.issues}>
            {readiness.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={styles.notice}>Your profile is ready for proposals and gift requests.</p>
      )}

      <ProfileSetupForm profile={profile} categories={categories} />
    </main>
  );
}
