import type { ReactNode } from "react";
import { Card } from "@/shared/ui/card";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card size="lg">
      <Card.Header>
        <Card.Title size="xl">{title}</Card.Title>
        {description && <Card.Description>{description}</Card.Description>}
      </Card.Header>
      <Card.Content className="space-y-5">{children}</Card.Content>
    </Card>
  );
}
