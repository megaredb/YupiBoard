import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { isApiError } from "@/shared/api/errors";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import { PageContainer } from "@/shared/layout/page-container";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";
import { StatusMessage } from "@/shared/ui/status-message";

/** Router `defaultErrorComponent`: every route gets a retryable error state (ERR-1). */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const isNotFound = isApiError(error) && error.status === 404;
  const handleRetry = () => {
    reset();
    void router.invalidate();
  };

  return (
    <PageContainer size="narrow">
      <StatusMessage
        title={t(isNotFound ? "shell.notFound.title" : "shell.error.title")}
        description={t(
          isNotFound
            ? "shell.notFound.description"
            : getApiErrorKey(error, "shell.error.description"),
        )}
        action={
          <div className="flex gap-2">
            {!isNotFound && (
              <Button variant="outline" size="lg" onClick={handleRetry}>
                {t("common.retry")}
              </Button>
            )}
            <Link to="/events" className={buttonVariants({ size: "lg" })}>
              {t("shell.backToEvents")}
            </Link>
          </div>
        }
      />
    </PageContainer>
  );
}
