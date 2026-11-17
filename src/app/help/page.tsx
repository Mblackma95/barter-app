import styles from "./page.module.css";

export default function HelpPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Help / Contact</p>
        <h1>Need a hand?</h1>
        <p>
          For the MVP, use this page as the support entry point for account issues, trust questions,
          and local exchange safety concerns.
        </p>
        <p className={styles.notice}>
          Support routing is still placeholder-only. Add the final contact email, safety resources, and
          moderation paths before launch.
        </p>
      </section>
    </main>
  );
}
