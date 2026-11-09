import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface EventHeroProps {
  photoUrl: string | null;
  isPromoted: boolean;
  /** Desktop-only overlay actions (share, favorite). */
  actions: ReactNode;
}

export function EventHero({ photoUrl, isPromoted, actions }: EventHeroProps) {
  const { t } = useTranslation();

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-muted desktop:rounded-2xl">
      {photoUrl && (
        <img src={photoUrl} alt="" width={1600} height={900} className="size-full object-cover" />
      )}
      {isPromoted && (
        <span className="absolute bottom-3 left-3 rounded-full bg-card/95 px-3.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-xs desktop:top-4 desktop:bottom-auto desktop:left-4">
          {t("events.promoted")}
        </span>
      )}
      <div className="absolute top-4 right-4 hidden desktop:block">{actions}</div>
    </div>
  );
}
