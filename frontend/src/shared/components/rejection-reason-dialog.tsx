import { useState } from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InlineError } from "@/shared/components/inline-error";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { cn } from "@/shared/lib/cn";
import { Backdrop } from "@/shared/ui/backdrop";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";
import { Checkbox } from "@/shared/ui/checkbox";
import { Textarea } from "@/shared/ui/textarea";

type RejectionMode = "participant" | "event";

interface RejectionReasonDialogProps {
  mode: RejectionMode;
  targetName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

interface RejectionModeConfig {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  reasonsLabelKey: TranslationKey;
  presetKeys: readonly TranslationKey[];
  otherKey: TranslationKey;
  placeholderKey: TranslationKey;
  requiredErrorKey: TranslationKey;
  confirmKey: TranslationKey;
}

const REJECTION_CONFIGS: Record<RejectionMode, RejectionModeConfig> = {
  participant: {
    titleKey: "events.participants.declineDialog.title",
    descriptionKey: "events.participants.declineDialog.description",
    reasonsLabelKey: "events.participants.declineDialog.reasonsLabel",
    presetKeys: [
      "events.participants.declineDialog.reasons.experience",
      "events.participants.declineDialog.reasons.requirements",
      "events.participants.declineDialog.reasons.conduct",
      "events.participants.declineDialog.reasons.groupFull",
    ],
    otherKey: "events.participants.declineDialog.reasons.other",
    placeholderKey: "events.participants.declineDialog.otherPlaceholder",
    requiredErrorKey: "events.participants.declineDialog.reasonRequired",
    confirmKey: "events.participants.declineDialog.confirm",
  },
  event: {
    titleKey: "events.rejectEventDialog.title",
    descriptionKey: "events.rejectEventDialog.description",
    reasonsLabelKey: "events.rejectEventDialog.reasonsLabel",
    presetKeys: [
      "events.rejectEventDialog.reasons.inappropriate",
      "events.rejectEventDialog.reasons.spam",
      "events.rejectEventDialog.reasons.duplicate",
      "events.rejectEventDialog.reasons.inaccurate",
      "events.rejectEventDialog.reasons.missing",
      "events.rejectEventDialog.reasons.guidelines",
    ],
    otherKey: "events.rejectEventDialog.reasons.other",
    placeholderKey: "events.rejectEventDialog.otherPlaceholder",
    requiredErrorKey: "events.rejectEventDialog.reasonRequired",
    confirmKey: "events.rejectEventDialog.confirm",
  },
};

// Long labels wrap cleanly inside the button instead of overflowing it.
const ACTION_CLASS = "h-auto min-h-12 px-3 py-2 text-sm leading-tight whitespace-normal";

function buildReasonString(
  presetKeys: readonly TranslationKey[],
  selected: ReadonlySet<TranslationKey>,
  isOtherChecked: boolean,
  otherText: string,
  translate: (key: TranslationKey) => string,
): string | null {
  const presetLabels = presetKeys.filter((key) => selected.has(key)).map(translate);
  const trimmedOther = otherText.trim();
  if (isOtherChecked && !trimmedOther) return null;
  const parts = [...presetLabels, ...(trimmedOther ? [trimmedOther] : [])];
  return parts.length > 0 ? parts.join("; ") : null;
}

function ReasonChecklist({
  config,
  selected,
  isOtherChecked,
  otherText,
  isTextareaInvalid,
  onTogglePreset,
  onToggleOther,
  onOtherTextChange,
}: {
  config: RejectionModeConfig;
  selected: ReadonlySet<TranslationKey>;
  isOtherChecked: boolean;
  otherText: string;
  isTextareaInvalid: boolean;
  onTogglePreset: (key: TranslationKey) => void;
  onToggleOther: (checked: boolean) => void;
  onOtherTextChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 text-left">
      <p className="text-sm font-semibold text-foreground">
        {t(config.reasonsLabelKey)}
        <span aria-hidden className="ml-0.5 text-destructive">
          {"*"}
        </span>
      </p>
      <div className="space-y-2.5">
        {config.presetKeys.map((key) => (
          <label key={key} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              className="mt-0.5 rounded-[4px]"
              checked={selected.has(key)}
              onCheckedChange={() => onTogglePreset(key)}
            />
            <span className="leading-snug text-foreground">{t(key)}</span>
          </label>
        ))}
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <Checkbox
            className="mt-0.5 rounded-[4px]"
            checked={isOtherChecked}
            onCheckedChange={onToggleOther}
          />
          <span className="leading-snug text-foreground">{t(config.otherKey)}</span>
        </label>
      </div>
      <Textarea
        rows={3}
        maxLength={300}
        aria-invalid={isTextareaInvalid || undefined}
        value={otherText}
        onChange={(event) => onOtherTextChange(event.target.value)}
        placeholder={t(config.placeholderKey)}
        className="mt-1 rounded-xl border-border"
      />
    </div>
  );
}

function RejectionDialogHeader({ title, description }: { title: string; description: string }) {
  return (
    <>
      <div className="flex items-start gap-3.5">
        <span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-secondary/25 text-warning desktop:flex dark:bg-secondary/20 dark:text-secondary">
          <TriangleAlert aria-hidden className="size-5" />
        </span>
        <AlertDialogPrimitive.Title className="min-w-0 text-lg leading-snug font-bold desktop:pt-1">
          {title}
        </AlertDialogPrimitive.Title>
      </div>
      <AlertDialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </AlertDialogPrimitive.Description>
    </>
  );
}

function RejectionDialogFooter({
  cancelLabel,
  confirmLabel,
  onConfirm,
}: {
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 px-5 pt-2 pb-5 desktop:px-6 desktop:pb-6">
      <AlertDialogPrimitive.Close
        className={buttonVariants({
          variant: "outline",
          size: "xl",
          className: ACTION_CLASS,
        })}
      >
        {cancelLabel}
      </AlertDialogPrimitive.Close>
      <Button
        variant="secondary"
        size="xl"
        className={cn(ACTION_CLASS, "shadow-sm")}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}

function useRejectionReasonState(config: RejectionModeConfig) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<TranslationKey>>(() => new Set());
  const [isOtherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [hasError, setHasError] = useState(false);

  const togglePreset = (key: TranslationKey) => {
    setHasError(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const setOther = (checked: boolean) => {
    setHasError(false);
    setOtherChecked(checked);
  };
  const setText = (value: string) => {
    setHasError(false);
    setOtherText(value);
  };
  const resolveReason = () => {
    const reason = buildReasonString(config.presetKeys, selected, isOtherChecked, otherText, (k) =>
      t(k),
    );
    if (!reason) setHasError(true);
    return reason;
  };

  return {
    selected,
    isOtherChecked,
    otherText,
    hasError,
    togglePreset,
    setOther,
    setText,
    resolveReason,
  };
}

/**
 * Shared rejection modal with mandatory reason selection.
 * Adapts copy and preset reasons to the caller's mode ("participant" | "event"),
 * rendering as a centered dialog on desktop and a bottom sheet on mobile.
 */
export function RejectionReasonDialog({
  mode,
  targetName,
  onConfirm,
  onClose,
}: RejectionReasonDialogProps) {
  const { t } = useTranslation();
  const config = REJECTION_CONFIGS[mode];
  const state = useRejectionReasonState(config);

  const handleConfirm = () => {
    const reason = state.resolveReason();
    if (!reason) return;
    onConfirm(reason);
    onClose();
  };

  return (
    <AlertDialogPrimitive.Root open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogPrimitive.Portal>
        <Backdrop />
        <AlertDialogPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center desktop:items-center desktop:p-4">
          <AlertDialogPrimitive.Popup
            data-slot="rejection-reason-dialog"
            className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card pb-safe text-card-foreground shadow-xl transition-all outline-none data-ending-style:translate-y-full data-starting-style:translate-y-full desktop:max-h-[85dvh] desktop:max-w-md desktop:rounded-2xl desktop:pb-0 desktop:data-ending-style:translate-y-0 desktop:data-ending-style:scale-95 desktop:data-ending-style:opacity-0 desktop:data-starting-style:translate-y-0 desktop:data-starting-style:scale-95 desktop:data-starting-style:opacity-0"
          >
            <div
              aria-hidden
              className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 desktop:hidden"
            />
            <div className="flex-1 space-y-4 overflow-y-auto px-5 pt-3 pb-4 desktop:p-6 desktop:pb-4">
              <RejectionDialogHeader
                title={t(config.titleKey, { name: targetName })}
                description={t(config.descriptionKey, { name: targetName })}
              />
              <ReasonChecklist
                config={config}
                selected={state.selected}
                isOtherChecked={state.isOtherChecked}
                otherText={state.otherText}
                isTextareaInvalid={
                  state.hasError && state.isOtherChecked && !state.otherText.trim()
                }
                onTogglePreset={state.togglePreset}
                onToggleOther={state.setOther}
                onOtherTextChange={state.setText}
              />
              {state.hasError && <InlineError message={t(config.requiredErrorKey)} />}
            </div>
            <RejectionDialogFooter
              cancelLabel={t("common.cancel")}
              confirmLabel={t(config.confirmKey)}
              onConfirm={handleConfirm}
            />
          </AlertDialogPrimitive.Popup>
        </AlertDialogPrimitive.Viewport>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
