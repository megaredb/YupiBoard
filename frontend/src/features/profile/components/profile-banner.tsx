/** Decorative header band; custom banners wait for a backend `banner_url`. */
export function ProfileBanner() {
  return (
    <div
      aria-hidden
      className="h-44 w-full bg-linear-to-r from-foreground/90 via-primary/40 to-foreground/85 sm:h-52 sm:rounded-b-2xl"
    />
  )
}
