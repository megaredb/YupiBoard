import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface RatingTileProps {
  label: string;
  icon: ReactNode;
  rating: string | null;
  /** Optional in the API schema, where it defaults to 0. */
  reviewCount: number | undefined;
}

export function RatingTile({ label, icon, rating, reviewCount }: RatingTileProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-1">
        {icon}
        <span className="text-base font-bold text-foreground">
          {rating ?? t("common.notProvided")}
        </span>
        {rating && <span className="text-xs text-muted-foreground">{t("profile.outOfFive")}</span>}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t("profile.reviewsCount", { count: reviewCount ?? 0 })}
      </p>
    </div>
  );
}
