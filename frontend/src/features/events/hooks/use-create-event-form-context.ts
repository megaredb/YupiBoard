import { useFormContext, type UseFormReturn } from "react-hook-form"
import type {
  CreateEventFormInput,
  CreateEventFormValues,
} from "@/features/events/schemas/create-event.schema"

/** Typed access to the create-event form from its sections. */
export function useCreateEventFormContext(): UseFormReturn<
  CreateEventFormInput,
  unknown,
  CreateEventFormValues
> {
  return useFormContext<CreateEventFormInput, unknown, CreateEventFormValues>()
}
