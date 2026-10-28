import { z } from "zod"
import { CREATE_EVENT_LIMITS as LIMITS } from "../../constants"

// Messages are i18n keys, translated when rendered (same convention as the login form).
export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LIMITS.titleMin, "createEvent.validation.title")
      .max(LIMITS.titleMax, "createEvent.validation.title"),
    description: z.string().max(LIMITS.descriptionMax, "createEvent.validation.descriptionMax"),
    date: z.string().min(1, "createEvent.validation.dateRequired"),
    time: z.string().min(1, "createEvent.validation.timeRequired"),
    address: z.string().trim().min(1, "createEvent.validation.addressRequired"),
    /** Set when the address was picked from suggestions, cleared when typed by hand. */
    venueName: z.string().nullable(),
    seatsTotal: z.number().int().min(LIMITS.seatsMin).max(LIMITS.seatsMax),
    price: z
      .number({ error: "createEvent.validation.priceInvalid" })
      .min(0, "createEvent.validation.priceInvalid"),
    coverImage: z
      .instanceof(File)
      .refine((file) => (LIMITS.coverTypes as readonly string[]).includes(file.type), "createEvent.validation.coverType")
      .refine((file) => file.size <= LIMITS.coverMaxBytes, "createEvent.validation.coverSize")
      .nullable(),
  })
  .refine(({ date, time }) => !date || !time || new Date(`${date}T${time}`).getTime() > Date.now(), {
    path: ["date"],
    message: "createEvent.validation.dateFuture",
  })

export type CreateEventFormValues = z.infer<typeof createEventSchema>
