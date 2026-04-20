import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createReviewAction } from "@/lib/reviews/actions";
import { listReviewContext, type ReviewRow } from "@/lib/reviews/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type ReviewsSearchParams = {
  tab?: string;
};

function getReviewContextKey(review: ReviewRow) {
  return review.trade_id ? `trade:${review.trade_id}` : `gift:${review.gift_request_id}`;
}

function isReviewVisible(review: ReviewRow, reviews: ReviewRow[]) {
  const now = Date.now();

  if (review.visible_at && new Date(review.visible_at).getTime() <= now) {
    return true;
  }

  if (review.review_deadline_at && new Date(review.review_deadline_at).getTime() <= now) {
    return true;
  }

  return reviews.some(
    (otherReview) =>
      otherReview.id !== review.id && getReviewContextKey(otherReview) === getReviewContextKey(review),
  );
}

function getReviewRevealLabel(review: ReviewRow, reviews: ReviewRow[]) {
  if (isReviewVisible(review, reviews)) {
    return "Visible";
  }

  if (!review.review_deadline_at) {
    return "Waiting for the other review";
  }

  return `Hidden until both reviews are in or ${new Date(review.review_deadline_at).toLocaleDateString()}`;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<ReviewsSearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const activeTab = params.tab === "given" ? "given" : "about";
  const { trades, gifts, reviews } = await listReviewContext(user.id);
  const reviewedTradeIds = new Set(reviews.filter((review) => review.reviewer_id === user.id).map((review) => review.trade_id));
  const reviewedGiftIds = new Set(
    reviews.filter((review) => review.reviewer_id === user.id).map((review) => review.gift_request_id),
  );
  const reviewsAboutYou = reviews.filter(
    (review) => review.reviewee_id === user.id && isReviewVisible(review, reviews),
  );
  const reviewsYouGave = reviews.filter((review) => review.reviewer_id === user.id);
  const visibleReviews = activeTab === "given" ? reviewsYouGave : reviewsAboutYou;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Reviews</p>
          <h1>Completed exchanges</h1>
          <p className={styles.subtle}>
            Reviews are blind for 7 days. They reveal when both sides submit or when the window expires.
          </p>
        </div>
      </header>

      <section className={styles.list}>
        <h2>Leave a review</h2>
        {trades.map((trade) => {
          if (reviewedTradeIds.has(trade.id)) return null;
          const otherTrader = trade.user_a_id === user.id ? trade.user_b : trade.user_a;

          return (
            <form key={trade.id} action={createReviewAction} className={styles.card}>
              <input type="hidden" name="contextType" value="trade" />
              <input type="hidden" name="contextId" value={trade.id} />
              <p className={styles.meta}>Trade</p>
              <h3>{trade.target_listing?.title ?? "Completed trade"}</h3>
              <p>Review: {otherTrader?.display_name ?? "Trader"}</p>
              <label>
                Rating
                <select name="rating" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} stars
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Written review
                <textarea name="body" rows={3} />
              </label>
              <button type="submit">Submit review</button>
            </form>
          );
        })}

        {gifts.map((gift) => {
          if (reviewedGiftIds.has(gift.id)) return null;
          const otherTrader = gift.requester_id === user.id ? gift.giver : gift.requester;

          return (
            <form key={gift.id} action={createReviewAction} className={styles.card}>
              <input type="hidden" name="contextType" value="gift" />
              <input type="hidden" name="contextId" value={gift.id} />
              <p className={styles.meta}>Gift</p>
              <h3>{gift.listings?.title ?? "Completed gift"}</h3>
              <p>Review: {otherTrader?.display_name ?? "Trader"}</p>
              <label>
                Rating
                <select name="rating" defaultValue="5">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} stars
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Written review
                <textarea name="body" rows={3} />
              </label>
              <button type="submit">Submit review</button>
            </form>
          );
        })}

        {!trades.length && !gifts.length ? (
          <p className={styles.notice}>No completed exchanges are ready for review yet.</p>
        ) : null}
      </section>

      <section className={styles.list}>
        <div className={styles.sectionHeader}>
          <h2>Review history</h2>
          <nav className={styles.tabs} aria-label="Review history tabs">
            <Link
              href="/reviews"
              className={`${styles.tab} ${activeTab === "about" ? styles.activeTab : ""}`}
              aria-current={activeTab === "about" ? "page" : undefined}
            >
              Reviews About You
            </Link>
            <Link
              href="/reviews?tab=given"
              className={`${styles.tab} ${activeTab === "given" ? styles.activeTab : ""}`}
              aria-current={activeTab === "given" ? "page" : undefined}
            >
              Reviews You&apos;ve Given
            </Link>
          </nav>
        </div>
        {visibleReviews.length ? (
          visibleReviews.map((review) => (
            <article key={review.id} className={styles.card}>
              <p className={styles.meta}>{review.rating} stars</p>
              <h3>
                {review.reviewer_id === user.id ? "You reviewed" : "Review from"}{" "}
                {review.reviewer_id === user.id
                  ? review.reviewee?.display_name ?? "Trader"
                  : review.reviewer?.display_name ?? "Trader"}
              </h3>
              {activeTab === "given" || isReviewVisible(review, reviews) ? (
                review.body ? <p>{review.body}</p> : <p className={styles.subtle}>No written review.</p>
              ) : null}
              <p className={styles.statusNote}>{getReviewRevealLabel(review, reviews)}</p>
            </article>
          ))
        ) : (
          <p className={styles.notice}>
            {activeTab === "given"
              ? "You have not given any reviews yet."
              : "No visible reviews about you yet. Blind reviews may still be waiting on both sides or the 7-day deadline."}
          </p>
        )}
      </section>
    </main>
  );
}
