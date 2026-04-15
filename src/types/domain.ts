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
  "cancelled",
  "expired",
] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

export const tradeStatuses = [
  "agreed",
  "pending_completion",
  "completed",
  "flagged",
  "cancelled",
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
  "message_received",
  "trade_agreed",
  "completion_confirmed",
  "completion_flagged",
  "gift_requested",
  "gift_approved",
  "review_available",
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
