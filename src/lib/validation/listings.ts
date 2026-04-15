import { z } from "zod";
import { maxLocalRadiusKm, minLocalRadiusKm } from "@/lib/constants/radius";
import { exchangeModes } from "@/types/domain";
import { hasCashLanguage, normalizeTags } from "./tags";

const baseListingSchema = z.object({
  exchangeMode: z.enum(exchangeModes),
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().min(10).max(2000),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).default([]).transform(normalizeTags),
  city: z.string().trim().min(2).max(80).nullable().optional(),
  localRadiusKm: z.number().min(minLocalRadiusKm).max(maxLocalRadiusKm).nullable().optional(),
  isRemote: z.boolean().default(false),
  wanted: z.string().trim().max(1000).nullable().optional(),
});

export const listingInputSchema = baseListingSchema.superRefine((value, context) => {
  const text = `${value.title} ${value.description} ${value.wanted ?? ""}`;

  if (hasCashLanguage(text)) {
    context.addIssue({
      code: "custom",
      message: "Cash, payments, prices, and money language are not allowed on Barter.",
      path: ["description"],
    });
  }

  if (value.exchangeMode === "digital" && !value.isRemote) {
    context.addIssue({
      code: "custom",
      message: "Digital exchange listings must be remote.",
      path: ["isRemote"],
    });
  }

  if (value.exchangeMode !== "digital" && !value.city) {
    context.addIssue({
      code: "custom",
      message: "Local barter and gift listings require a city.",
      path: ["city"],
    });
  }
});

export type ListingInput = z.infer<typeof listingInputSchema>;
