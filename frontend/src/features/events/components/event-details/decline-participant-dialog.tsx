import { useState } from "react";
import { useTranslation } from "react-i18next";
import { InlineError } from "@/shared/components/inline-error";
import { AlertDialog } from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Textarea } from "@/shared/ui/textarea";

interface DeclineParticipantDialogProps {
  playerName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const PRESET_REASON_KEYS = [
  "events.participants.declineDialog.reasons.experience",
  "events.participants.declineDialog.reasons.requirements",
  "events.participants.declineDialog.reasons.conduct",
  "events.participants.declineDialog.reasons.groupFull",
] as const;

type PresetKey = (typeof PRESET_REASON_KEYS)[number];

function ReasonChecklist({
  selected,
  isOtherChecked,
  otherText,
  onTogglePreset,
  onToggleOther,
  onOtherTextChange,
}: {
  selected: ReadonlySet<PresetKey>;
  isOtherChecked: boolean;
  otherText: string;
  onTogglePreset: (key: PresetKey) => void;
  onToggleOther: (checked: boolean) => void;
  onOtherTextChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 space-y-2.5 text-left">
      <p className="text-xs font-semibold text-foreground">
        {t("events.participants.declineDialog.reasonsLabel")}{" "}
        <span aria-hidden className="text-destructive">
          {"*"}
        </span>
      </p>
      <div className="space-y-2">
        {PRESET_REASON_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={selected.has(key)}
              onCheckedChange={() => onTogglePreset(key)}
            />
            <span className="leading-snug text-foreground">{t(key)}</span>
          </label>
        ))}
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <Checkbox className="mt-0.5" checked={isOtherChecked} onCheckedChange={onToggleOther} />
          <span className="leading-snug text-foreground">
            {t("events.participants.declineDialog.reasons.other")}
          </span>
        </label>
      </div>
      {isOtherChecked && (
        <Textarea
          rows={3}
          maxLength={300}
          value={otherText}
          onChange={(event) => onOtherTextChange(event.target.value)}
          placeholder={t("events.participants.declineDialog.otherPlaceholder")}
        />
      )}
    </div>
  );
}

function buildReasonString(
  selected: ReadonlySet<PresetKey>,
  isOtherChecked: boolean,
  otherText: string,
  translate: (key: PresetKey) => string,
): string | null {
  const presetLabels = PRESET_REASON_KEYS.filter((key) => selected.has(key)).map(translate);
  const trimmedOther = otherText.trim();
  if (isOtherChecked && !trimmedOther) return null;
  const parts = [...presetLabels, ...(isOtherChecked && trimmedOther ? [trimmedOther] : [])];
  return parts.length > 0 ? parts.join("; ") : null;
}

export function DeclineParticipantDialog({
  playerName,
  onConfirm,
  onClose,
}: DeclineParticipantDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<PresetKey>>(() => new Set());
  const [isOtherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [hasError, setHasError] = useState(false);

  const togglePreset = (key: PresetKey) => {
    setHasError(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const handleToggleOther = (checked: boolean) => {
    setHasError(false);
    setOtherChecked(checked);
  };
  const handleOtherText = (value: string) => {
    setHasError(false);
    setOtherText(value);
  };
  const handleConfirm = () => {
    const reason = buildReasonString(selected, isOtherChecked, otherText, (key) => t(key));
    if (!reason) {
      setHasError(true);
      return;
    }
    onConfirm(reason);
    onClose();
  };

  return (
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialog.Content>
        <AlertDialog.Title>{t("events.participants.declineDialog.title")}</AlertDialog.Title>
        <AlertDialog.Description>
          {t("events.participants.declineDialog.description", { name: playerName })}
        </AlertDialog.Description>
        <ReasonChecklist
          selected={selected}
          isOtherChecked={isOtherChecked}
          otherText={otherText}
          onTogglePreset={togglePreset}
          onToggleOther={handleToggleOther}
          onOtherTextChange={handleOtherText}
        />
        {hasError && (
          <div className="mt-2">
            <InlineError message={t("events.participants.declineDialog.reasonRequired")} />
          </div>
        )}
        <AlertDialog.Footer>
          <AlertDialog.Close render={<Button variant="outline" />}>
            {t("common.cancel")}
          </AlertDialog.Close>
          <Button variant="destructive" onClick={handleConfirm}>
            {t("events.participants.declineDialog.confirm")}
          </Button>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
