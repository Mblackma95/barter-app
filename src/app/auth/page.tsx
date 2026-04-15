import { hasPublicSupabaseEnv } from "@/lib/env";
import { signInAction, signUpAction } from "@/lib/auth/actions";
import styles from "./page.module.css";

export default function AuthPage() {
  const supabaseReady = hasPublicSupabaseEnv();

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Authentication</p>
        <h1>Sign in to test Barter flows.</h1>
        {!supabaseReady ? (
          <p>
            Supabase is not connected yet. Add your values to `.env.local`,
            restart `npm run dev`, then use these forms.
          </p>
        ) : null}
      </section>

      <section className={styles.grid}>
        <form action={signInAction} className={styles.card}>
          <h2>Sign in</h2>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button type="submit" disabled={!supabaseReady}>
            Sign in
          </button>
        </form>

        <form action={signUpAction} className={styles.card}>
          <h2>Create account</h2>
          <p>You will finish your community profile after this step.</p>
          <label>
            Display name
            <input name="displayName" required />
          </label>
          <label>
            City
            <input name="city" required placeholder="Simcoe" />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          <button type="submit" disabled={!supabaseReady}>
            Create account
          </button>
        </form>
      </section>
    </main>
  );
}
