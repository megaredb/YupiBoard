import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/page-container";
import { buttonVariants } from "@/shared/ui/button-variants";
import { StatusMessage } from "@/shared/ui/status-message";

export function RouteNotFound() {
  const { t } = useTranslation();

  return (
    <PageContainer size="narrow">
      <StatusMessage
        title={t("shell.notFound.title")}
        description={t("shell.notFound.description")}
        action={
          <Link to="/events" className={buttonVariants({ size: "lg" })}>
            {t("shell.backToEvents")}
          </Link>
        }
      />
    </PageContainer>
  );
}
