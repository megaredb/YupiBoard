import { z } from "zod";

/** `?token=…` of the e-mail links (`/verify-email`, `/reset-password`). */
export const tokenSearchSchema = z.object({
  token: z.string().optional(),
});
