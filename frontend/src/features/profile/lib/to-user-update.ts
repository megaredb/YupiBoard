import type { UserUpdate } from "@/shared/api/generated/model"
import type { CompleteProfileFormValues } from "@/features/profile/schemas/profile.schema"

/** Form values -> `PATCH /users/me` body; cleared optional fields become `null`. */
export function toUserUpdate(values: CompleteProfileFormValues): UserUpdate {
  return {
    first_name: values.first_name,
    last_name: values.last_name,
    city: values.city || null,
    contact_info: values.contact_info || null,
  }
}
