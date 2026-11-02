import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

/** Every form: react-hook-form + zod, validated on blur. Messages are translation keys. */
export function useAppForm<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>,
  options: Omit<UseFormProps<TInput, unknown, TOutput>, "resolver" | "mode"> = {},
): UseFormReturn<TInput, unknown, TOutput> {
  return useForm<TInput, unknown, TOutput>({
    mode: "onBlur",
    ...options,
    resolver: zodResolver(schema),
  });
}
