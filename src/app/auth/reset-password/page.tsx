import Link from "next/link";
import { updatePasswordAction } from "@/lib/auth/actions";
import styles from "../page.module.css";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className={styles.page}>
    <form action={updatePasswordAction} className={styles.card}>
      <h1>Choose a new password</h1>
      {error ? <p role="alert">{error}</p> : null}
      <label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
      <label>Confirm password<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></label>
      <button type="submit">Save password</button>
      <Link href="/auth">Back to sign in</Link>
    </form>
  </main>;
}
