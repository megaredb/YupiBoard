import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

interface EventMobileTopBarProps {
  onBack: () => void;
  /** Page heading next to the back button, for pages that have no other `h1` on phones. */
  title?: string;
  actions?: ReactNode;
}

/** Replaces the app header on phones (the route hides it there). */
export function EventMobileTopBar({ onBack, title, actions }: EventMobileTopBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-30 border-b border-border/50 bg-background/95 pt-safe backdrop-blur-md lg:hidden">
      <div className="flex h-14 w-full items-center gap-2 px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={t("common.back")}
          onClick={onBack}
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Button>
        {title && <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>}
        <div className="ml-auto">{actions}</div>
      </div>
    </div>
  );
}
