import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { Card } from "@/shared/ui/card";

type StatusTone = "pending" | "success" | "error";

interface StatusCardProps {
  tone: StatusTone;
  title: string;
  description: string;
  children?: ReactNode;
}

const iconWrapperVariants = cva(
  "mx-auto mb-2 flex size-12 items-center justify-center rounded-full",
  {
    variants: {
      tone: {
        pending: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        error: "bg-destructive/10 text-destructive",
      },
    },
  },
);

const ICONS = { pending: LoaderCircle, success: CheckCircle2, error: CircleAlert } as const;

export function StatusCard({ tone, title, description, children }: StatusCardProps) {
  const Icon = ICONS[tone];
  return (
    <Card size="lg" className="w-full">
      <Card.Header className="text-center">
        <div className={iconWrapperVariants({ tone })}>
          <Icon aria-hidden className={tone === "pending" ? "size-6 animate-spin" : "size-6"} />
        </div>
        <Card.Title size="2xl">{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      {children && (
        <Card.Footer variant="plain" className="flex-col gap-2">
          {children}
        </Card.Footer>
      )}
    </Card>
  );
}
