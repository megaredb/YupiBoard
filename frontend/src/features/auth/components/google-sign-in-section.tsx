import googleIcon from "@/assets/google.svg";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import type { GoogleSignInControl } from "@/features/auth/hooks/use-google-sign-in";

interface GoogleSignInSectionProps {
  control: GoogleSignInControl;
  label: string;
  isPending: boolean;
  isDisabled: boolean;
}

type WebButtonRenderer = Extract<GoogleSignInControl, { kind: "web" }>["buttonRef"];

interface WebGoogleButtonProps {
  renderInto: WebButtonRenderer;
  isPending: boolean;
  isBlocked: boolean;
}

/** Slot that Google's SDK renders its own button into. */
function WebGoogleButton({ renderInto, isPending, isBlocked }: WebGoogleButtonProps) {
  return (
    <div
      ref={renderInto}
      aria-busy={isPending}
      aria-disabled={isBlocked}
      className={cn(
        "flex min-h-11 w-full items-center justify-center",
        isBlocked && "pointer-events-none opacity-50",
      )}
    />
  );
}

export function GoogleSignInSection({
  control,
  label,
  isPending,
  isDisabled,
}: GoogleSignInSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {control.kind === "custom" ? (
        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={isDisabled}
          isLoading={isPending}
          onClick={control.signIn}
          className="w-full text-sm font-medium"
        >
          <img src={googleIcon} alt="" width={16} height={16} className="size-4 shrink-0" />
          <span>{label}</span>
        </Button>
      ) : (
        <WebGoogleButton
          renderInto={control.buttonRef}
          isPending={isPending}
          isBlocked={isPending || isDisabled}
        />
      )}
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">{t("auth.orEmail")}</span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
