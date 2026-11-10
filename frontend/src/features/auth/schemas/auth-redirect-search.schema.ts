import { z } from "zod";

export const authRedirectSearchSchema = z.object({
  redirect: z.string().optional(),
});

export type AuthRedirectSearch = z.infer<typeof authRedirectSearchSchema>;
