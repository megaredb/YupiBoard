interface NamedUser {
  first_name?: string | null;
  last_name?: string | null;
}

export function getFullName(user: NamedUser): string | null {
  const fullName = [user.first_name, user.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return fullName || null;
}

/** The full name, or the e-mail when no name is set yet. Only the signed-in user has an e-mail. */
export function getDisplayName(user: NamedUser & { email: string }): string {
  return getFullName(user) ?? user.email;
}
