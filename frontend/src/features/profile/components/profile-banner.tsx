import type { ReactNode } from "react";

interface ProfileBannerProps {
  imageUrl: string | null | undefined;
  children?: ReactNode;
}

export function ProfileBanner({ imageUrl, children }: ProfileBannerProps) {
  return (
    <div className="relative h-44 w-full overflow-hidden bg-linear-to-r from-foreground/90 via-primary/40 to-foreground/85 sm:h-52 sm:rounded-b-2xl">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          width={1600}
          height={416}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {children}
    </div>
  );
}
