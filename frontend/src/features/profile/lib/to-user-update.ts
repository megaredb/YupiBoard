import type { UserUpdate } from "@/shared/api/generated/model";
import type { ProfileUpdateValues } from "@/features/profile/schemas/profile.schema";

/** Form values -> `PATCH /users/me` body; cleared optional fields become `null`. */
export function toUserUpdate(values: ProfileUpdateValues): UserUpdate {
  return {
    first_name: values.first_name,
    last_name: values.last_name,
    city: values.city || null,
    contact_info: values.contact_info || null,
    // The "complete profile" form has no bio field: leave the stored one untouched.
    ...(values.bio === undefined ? {} : { bio: values.bio || null }),
  };
}
