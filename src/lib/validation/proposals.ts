import { z } from "zod";
import { hasCashLanguage } from "./tags";

export const barterProposalInputSchema = z
  .object({
    targetListingId: z.string().uuid(),
    offeredListingId: z.string().uuid(),
    note: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, context) => {
    if (hasCashLanguage(value.note ?? "")) {
      context.addIssue({
        code: "custom",
        message: "Cash or payment language is not allowed in proposals.",
        path: ["note"],
      });
    }
  });

export const digitalProposalInputSchema = z
  .object({
    targetListingId: z.string().uuid(),
    offeredListingId: z.string().uuid().optional(),
    deliveryDate: z.coerce.date(),
    note: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, context) => {
    if (hasCashLanguage(value.note ?? "")) {
      context.addIssue({
        code: "custom",
        message: "Cash or payment language is not allowed in proposals.",
        path: ["note"],
      });
    }
  });

export const giftRequestInputSchema = z
  .object({
    listingId: z.string().uuid(),
    message: z.string().trim().min(1).max(1000),
  })
  .superRefine((value, context) => {
    if (hasCashLanguage(value.message)) {
      context.addIssue({
        code: "custom",
        message: "Gift requests cannot include cash or payment language.",
        path: ["message"],
      });
    }
  });
