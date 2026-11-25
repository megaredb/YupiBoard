import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TermsSections } from "@/shared/components/terms-dialog";
import { PageContainer } from "@/shared/layout/page-container";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

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
        <Card.Content className="pt-2">
          <TermsSections />
        </Card.Content>
      </Card>
    </PageContainer>
  );
}
