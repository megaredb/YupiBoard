interface ProfileBannerProps {
  imageUrl: string | null | undefined;
}

/** Header band: the user's banner photo, or a decorative gradient without one. */
export function ProfileBanner({ imageUrl }: ProfileBannerProps) {
  return (
    <div
      aria-hidden
      className="relative h-44 w-full overflow-hidden bg-linear-to-r from-foreground/90 via-primary/40 to-foreground/85 sm:h-52 sm:rounded-b-2xl"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          width={1600}
          height={416}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}
