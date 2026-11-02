/** Only same-app paths are followed after sign-in, never another origin (`//evil.example`). */
export function toSafeRedirect(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
