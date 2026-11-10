import type { ReactNode } from "react";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { Card } from "@/shared/ui/card";

interface AuthCardProps {
  title: string;
  subtitle: string;
  /** Shorter heading for phones; falls back to `title`. */
  mobileTitle?: string;
  mobileSubtitle?: string;
  tabs?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  mobileTitle = title,
  mobileSubtitle = subtitle,
  tabs,
  footer,
  children,
}: AuthCardProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-6">
      <Card size="lg">
        <Card.Header className="justify-items-center space-y-3 text-center">
          <BrandLogo size="md" />
          <div className="space-y-1.5">
            <Card.Title size="2xl">
              <span className="max-sm:hidden">{title}</span>
              <span className="sm:hidden">{mobileTitle}</span>
            </Card.Title>
            <Card.Description className="mx-auto max-w-xs">
              <span className="max-sm:hidden">{subtitle}</span>
              <span className="sm:hidden">{mobileSubtitle}</span>
            </Card.Description>
          </div>
          {tabs}
        </Card.Header>
        <Card.Content className="space-y-5">{children}</Card.Content>
        {footer && (
          <Card.Footer variant="plain" className="justify-center text-xs text-muted-foreground">
            {footer}
          </Card.Footer>
        )}
      </Card>
    </div>
  );
}
