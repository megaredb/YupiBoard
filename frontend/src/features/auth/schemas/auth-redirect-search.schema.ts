import { z } from "zod";

/** `/login?redirect=/my-events`: where to go after signing in. Shared by `/login` and `/register`. */
export const authRedirectSearchSchema = z.object({
  redirect: z.string().optional(),
});

export type AuthRedirectSearch = z.infer<typeof authRedirectSearchSchema>;
