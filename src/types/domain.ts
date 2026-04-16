export const exchangeModes = ["barter", "digital", "gift"] as const;
export type ExchangeMode = (typeof exchangeModes)[number];

export const listingStatuses = [
  "draft",
  "active",
  "pending",
  "completed",
  "archived",
  "removed",
] as const;
export type ListingStatus = (typeof listingStatuses)[number];

export const proposalStatuses = [
  "pending",
  "accepted",
  "declined",
] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

export const tradeStatuses = [
  "pending",
  "completed",
  "canceled",
  "disputed",
] as const;
export type TradeStatus = (typeof tradeStatuses)[number];

export const giftRequestStatuses = [
  "pending",
  "approved",
  "declined",
  "cancelled",
  "completed",
] as const;
export type GiftRequestStatus = (typeof giftRequestStatuses)[number];

export const notificationTypes = [
  "proposal_received",
  "proposal_updated",
  "proposal_accepted",
  "proposal_declined",
  "message_received",
  "trade_agreed",
  "trade_created",
  "trade_status_changed",
  "completion_confirmed",
  "completion_flagged",
  "pending_completion",
  "gift_requested",
  "gift_approved",
  "ai_match",
  "review_available",
  "review_prompt",
  "event_reminder",
  "admin_notice",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export type ListingCore = {
  id: string;
  slug: string;
  ownerId: string;
  exchangeMode: ExchangeMode;
  status: ListingStatus;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  city: string | null;
  localRadiusKm: number | null;
  isRemote: boolean;
  wanted: string | null;
};

export type ProfileCore = {
  id: string;
  username: string;
  displayName: string;
  city: string;
  neighborhood: string | null;
  giftsGivenCount: number;
  trustScore: number;
};

export type EventCore = {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  startsAt: string;
  isPublished: boolean;
};
