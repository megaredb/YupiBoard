import { useFormContext, type UseFormReturn } from "react-hook-form";
import type {
  CreateEventFormInput,
  CreateEventFormValues,
} from "@/features/events/schemas/create-event.schema";

export function useCreateEventFormContext(): UseFormReturn<
  CreateEventFormInput,
  unknown,
  CreateEventFormValues
> {
  return useFormContext<CreateEventFormInput, unknown, CreateEventFormValues>();
}
