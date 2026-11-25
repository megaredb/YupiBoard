import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";

const SECTIONS = [
  { titleKey: "auth.terms.eligibilityTitle", bodyKey: "auth.terms.eligibilityBody" },
  { titleKey: "auth.terms.eventsTitle", bodyKey: "auth.terms.eventsBody" },
  { titleKey: "auth.terms.conductTitle", bodyKey: "auth.terms.conductBody" },
  { titleKey: "auth.terms.privacyTitle", bodyKey: "auth.terms.privacyBody" },
] as const;

export function TermsSections() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 text-sm leading-relaxed text-foreground">
      <p className="text-muted-foreground">{t("auth.terms.intro")}</p>
      {SECTIONS.map((section) => (
        <section key={section.titleKey} className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground">{t(section.titleKey)}</h2>
          <p className="text-muted-foreground">{t(section.bodyKey)}</p>
        </section>
      ))}
    </div>
  );
}

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        closeLabel={t("common.close")}
        className="flex max-h-[85dvh] max-w-2xl flex-col gap-0 overflow-hidden p-0"
      >
        <Dialog.Header className="shrink-0 border-b border-border px-6 py-5 pr-14">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck aria-hidden className="size-5" />
            </span>
            <div className="space-y-1">
              <Dialog.Title className="text-xl">{t("auth.terms.title")}</Dialog.Title>
              <Dialog.Description>{t("auth.terms.updated")}</Dialog.Description>
            </div>
          </div>
        </Dialog.Header>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <TermsSections />
        </div>
        <Dialog.Footer className="shrink-0 border-t border-border px-6 py-4">
          <Button type="button" size="lg" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
