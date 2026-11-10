import type { ReactNode } from "react";
import { Card } from "@/shared/ui/card";

interface FormSectionProps {
  title: string;
  description?: string;
  headerNote?: string;
  children: ReactNode;
}

export function FormSection({ title, description, headerNote, children }: FormSectionProps) {
  return (
    <Card size="lg">
      <Card.Header>
        <div className="flex items-baseline justify-between gap-4">
          <Card.Title size="xl">{title}</Card.Title>
          {headerNote && (
            <span className="shrink-0 text-xs text-muted-foreground">
              <span aria-hidden className="text-destructive">
                {"*"}
              </span>{" "}
              {headerNote.replace(/^\*\s*/, "")}
            </span>
          )}
        </div>
        {description && <Card.Description>{description}</Card.Description>}
      </Card.Header>
      <Card.Content className="space-y-5">{children}</Card.Content>
    </Card>
  );
}
