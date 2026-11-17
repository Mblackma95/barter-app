import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { hasPublicSupabaseEnv } from "@/lib/env";
import styles from "../page.module.css";

export default function ForgotPasswordPage() {
  return (
    <main className={styles.page}>
      <form action={requestPasswordResetAction} className={`${styles.card} ${styles.recoveryForm}`}>
        <h1>Reset your password</h1>
        <p>Enter your email and we will send you a reset link.</p>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <button type="submit" disabled={!hasPublicSupabaseEnv()}>Send reset link</button>
        <Link href="/auth" className={styles.recoveryLink}>Back to sign in</Link>
      </form>
    </main>
  );
}
