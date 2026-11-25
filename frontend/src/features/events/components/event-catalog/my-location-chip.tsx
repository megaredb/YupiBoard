import { LocateFixed, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { formatDecimal } from "@/shared/lib/format/format-number";

const COORDINATE_DECIMALS = 3;

interface MyLocationChipProps {
  lat: number;
  lon: number;
  onDismiss: () => void;
  className?: string;
}

export function MyLocationChip({ lat, lon, onDismiss, className }: MyLocationChipProps) {
  const { t } = useTranslation();
  const coordinates = t("events.filters.myLocation.coordinates", {
    lat: formatDecimal(lat, COORDINATE_DECIMALS),
    lon: formatDecimal(lon, COORDINATE_DECIMALS),
  });

  return (
    <div
      className={cn(
        "flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-1 pr-1 pl-3 text-sm text-primary",
        className,
      )}
    >
      <LocateFixed aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block font-medium">{t("events.filters.myLocation.label")}</span>
        <span className="block truncate text-xs text-muted-foreground">{coordinates}</span>
      </span>
      <button
        type="button"
        aria-label={t("events.filters.myLocation.dismiss")}
        title={t("events.filters.myLocation.dismiss")}
        onClick={onDismiss}
        className="touch-hitbox flex size-9 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
