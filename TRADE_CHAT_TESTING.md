# Trade chat MVP

## Flow

- Accepting a proposal opens `/trades/[id]`.
- The Trades list is the conversation list; each trade links to its private thread.
- The thread shows the exchange listings, meetup guidance, text messages, and completion state.
- Messages refresh every five seconds while the page is visible. Only the latest 200 messages are shown.
- New messages create a notification with a link to the trade.
- Each participant confirms separately. One confirmation leaves the trade pending; both complete it, archive listings, and prompt for reviews.
- Existing blind-review rules remain in use. The completed thread links to `/reviews`.

## Setup

No new migration is needed. Uses existing `trades`, `conversations`, `messages`, and `notifications` tables and their participant RLS policies.
Vercel Preview must have the existing Supabase URL, anon key, and server-only service-role key configured.

## Two-account checks

1. Accept a fresh proposal and confirm the recipient lands in its conversation.
2. Open the same trade as the sender through Trades. Send messages in both directions and wait up to five seconds for updates.
3. Try a blank message, overlong text, and cash language; confirm validation feedback. Confirm sending is disabled while submitting.
4. Verify a third signed-in account cannot open the thread or send messages to it.
5. Arrange a public meetup. Confirm neither user's address appears automatically.
6. Confirm once: the trade stays pending and the other account sees a request to confirm.
7. Confirm from the second account: both see completion and a review link; listings archive and review notifications arrive.
8. Reopen a completed trade: confirmation cannot be repeated and completion timestamps remain unchanged.

## Verified during implementation

- Production build, TypeScript, and ESLint.
- Supabase transaction test: participant read/insert allowed; nonparticipant read/insert blocked. All test inserts rolled back.
- The existing VR headset / Adidas Sneakers trade has a conversation record and can use this UI.

## Limitations

Text only; no typing indicators, attachments, read receipts, message editing, or push notifications. Chat remains available after completion. Older trades get a thread on their first message. Full two-person browser testing still needs real account sessions.
