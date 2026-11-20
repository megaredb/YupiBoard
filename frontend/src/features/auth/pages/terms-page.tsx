import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/page-container";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const SECTIONS = [
  { titleKey: "auth.terms.eligibilityTitle", bodyKey: "auth.terms.eligibilityBody" },
  { titleKey: "auth.terms.eventsTitle", bodyKey: "auth.terms.eventsBody" },
  { titleKey: "auth.terms.conductTitle", bodyKey: "auth.terms.conductBody" },
  { titleKey: "auth.terms.privacyTitle", bodyKey: "auth.terms.privacyBody" },
] as const;

export function TermsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    router.history.back();
  };

  return (
    <PageContainer className="max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
          <ArrowLeft aria-hidden />
          {t("auth.terms.back")}
        </Button>
      </div>

      <Card size="lg">
        <Card.Header className="space-y-2 border-b pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck aria-hidden className="size-5" />
            </span>
            <div>
              <Card.Title size="2xl">{t("auth.terms.title")}</Card.Title>
              <Card.Description>{t("auth.terms.updated")}</Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="space-y-6 pt-2 text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">{t("auth.terms.intro")}</p>
          {SECTIONS.map((section) => (
            <section key={section.titleKey} className="space-y-1.5">
              <h2 className="text-base font-semibold text-foreground">{t(section.titleKey)}</h2>
              <p className="text-muted-foreground">{t(section.bodyKey)}</p>
            </section>
          ))}
        </Card.Content>
      </Card>
    </PageContainer>
  );
}
