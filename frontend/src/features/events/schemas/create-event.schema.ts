import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { coverImageFileSchema } from "@/shared/lib/validators/image-file";

/** Mirrors `EventCreate` in the OpenAPI schema; inputs read their `maxLength` from here. */
export const CREATE_EVENT_LIMITS = {
  titleMin: 3,
  titleMax: 100,
  gameTitleMax: 150,
  descriptionMax: 2000,
  addressMax: 255,
  playersMin: 2,
  playersMax: 20,
} as const;

const MESSAGES = {
  title: "validation.eventTitleLength",
  gameTitleRequired: "validation.gameTitleRequired",
  gameTitleMax: "validation.gameTitleMax",
  descriptionRequired: "validation.descriptionRequired",
  descriptionMax: "validation.descriptionMax",
  dateRequired: "validation.dateRequired",
  timeRequired: "validation.timeRequired",
  dateFuture: "validation.dateFuture",
  addressRequired: "validation.addressRequired",
  addressMax: "validation.addressMax",
  priceInvalid: "validation.priceInvalid",
} as const satisfies Record<string, TranslationKey>;

function startsInFuture({ date, time }: { date: string; time: string }): boolean {
  return !date || !time || new Date(`${date}T${time}`).getTime() > Date.now();
}

export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(CREATE_EVENT_LIMITS.titleMin, MESSAGES.title)
      .max(CREATE_EVENT_LIMITS.titleMax, MESSAGES.title),
    gameTitle: z
      .string()
      .trim()
      .min(1, MESSAGES.gameTitleRequired)
      .max(CREATE_EVENT_LIMITS.gameTitleMax, MESSAGES.gameTitleMax),
    description: z
      .string()
      .trim()
      .min(1, MESSAGES.descriptionRequired)
      .max(CREATE_EVENT_LIMITS.descriptionMax, MESSAGES.descriptionMax),
    date: z.string().min(1, MESSAGES.dateRequired),
    time: z.string().min(1, MESSAGES.timeRequired),
    city: z.string().min(1),
    address: z
      .string()
      .trim()
      .min(1, MESSAGES.addressRequired)
      .max(CREATE_EVENT_LIMITS.addressMax, MESSAGES.addressMax),
    maxPlayers: z
      .number()
      .int()
      .min(CREATE_EVENT_LIMITS.playersMin)
      .max(CREATE_EVENT_LIMITS.playersMax),
    price: z.number({ error: MESSAGES.priceInvalid }).min(0, MESSAGES.priceInvalid),
    coverImage: coverImageFileSchema,
  })
  .refine(startsInFuture, { path: ["date"], message: MESSAGES.dateFuture });

export type CreateEventFormInput = z.input<typeof createEventSchema>;
export type CreateEventFormValues = z.infer<typeof createEventSchema>;
