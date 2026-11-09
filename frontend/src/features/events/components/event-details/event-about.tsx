import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const COLLAPSIBLE_AFTER_CHARS = 160;

export function EventAbout({ description }: { description: string }) {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = useState(false);
  const isCollapsible = description.length > COLLAPSIBLE_AFTER_CHARS;
  const handleExpand = () => setExpanded(true);

  return (
    <Card size="lg">
      <Card.Header>
        <Card.Title size="xl">{t("events.details.about")}</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-3">
        <p
          className={cn(
            "text-sm leading-relaxed whitespace-pre-line text-muted-foreground",
            !isExpanded && isCollapsible && "line-clamp-4 desktop:line-clamp-none",
          )}
        >
          {description}
        </p>
        {isCollapsible && !isExpanded && (
          <Button
            type="button"
            variant="link"
            onClick={handleExpand}
            className="p-0 desktop:hidden"
          >
            {t("events.details.readMore")}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}
