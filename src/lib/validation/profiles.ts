import { z } from "zod";
import { maxLocalRadiusKm, minLocalRadiusKm } from "@/lib/constants/radius";
import { normalizeTags } from "./tags";

export const profileInputSchema = z.object({
  username: z.string().trim().min(3).max(40).optional(),
  displayName: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  bio: z.string().trim().min(10).max(500).optional(),
  interests: z.array(z.string()).default([]).transform(normalizeTags),
  skills: z.array(z.string()).default([]).transform(normalizeTags),
  currentWants: z.array(z.string()).default([]).transform(normalizeTags),
  currentNeeds: z.array(z.string()).default([]).transform(normalizeTags),
  preferredCategoryIds: z.array(z.string().uuid()).default([]),
  hobbies: z.array(z.string()).default([]).transform(normalizeTags),
  profession: z.string().trim().max(120).optional(),
  allowedRadiusKm: z.coerce.number().min(minLocalRadiusKm).max(maxLocalRadiusKm),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
