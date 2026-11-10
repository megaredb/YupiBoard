import { z } from "zod";

export const tokenSearchSchema = z.object({
  token: z.string().optional(),
});
