interface NamedUser {
  first_name?: string | null
  last_name?: string | null
  email: string
}

/** "Olena Kovalenko", or the e-mail when no name is set yet. */
export function getDisplayName(user: NamedUser): string {
  const fullName = [user.first_name, user.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
  return fullName || user.email
}
