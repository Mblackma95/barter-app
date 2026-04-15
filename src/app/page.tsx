import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Phase 2 functionality</p>
          <h1>Barter now has listing, gift, and proposal flows.</h1>
          <p>
            The backend foundation is preserved, and Phase 2 adds server-side
            actions plus minimal UI for creating listings, requesting gifts,
            approving gift recipients, and sending barter or digital proposals.
          </p>
          <a className={styles.primaryLink} href="/browse">
            Open browse
          </a>
        </section>

        <section className={styles.grid} aria-label="Build status">
          <article className={styles.card}>
            <span className={styles.status}>Phase 0</span>
            <h2>Cleanup and refactor</h2>
            <p>
              Existing prototypes are preserved as references. Production code
              now lives in this isolated Next.js app instead of overwriting the
              static mock folders.
            </p>
          </article>

          <article className={styles.card}>
            <span className={styles.status}>Phase 1</span>
            <h2>Backend foundation</h2>
            <ul>
              <li>Supabase environment template</li>
              <li>Server, browser, admin, and middleware clients</li>
              <li>Core exchange mode and status models</li>
              <li>Listing, proposal, gift, tag, and no-cash validation</li>
            </ul>
          </article>

          <article className={styles.card}>
            <span className={styles.status}>Phase 2</span>
            <h2>Functional flows</h2>
            <p>
              Create barter, digital, or gift listings. Send proposals and gift
              requests. Review proposals and approve gift recipients from the
              minimal inbox pages.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
