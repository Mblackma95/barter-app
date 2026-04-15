import { listUserGiftRequests } from "@/lib/gifts/queries";
import { listUserProposals } from "@/lib/proposals/queries";

export async function getInboxCounts(userId: string) {
  const [proposals, giftRequests] = await Promise.all([
    listUserProposals(userId),
    listUserGiftRequests(userId),
  ]);

  return {
    pendingReceivedProposals: proposals.filter(
      (proposal) => proposal.recipient_id === userId && proposal.status === "pending",
    ).length,
    pendingReceivedGiftRequests: giftRequests.filter(
      (request) => request.giver_id === userId && request.status === "pending",
    ).length,
  };
}
