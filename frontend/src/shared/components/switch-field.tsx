import { cn } from "@/shared/lib/cn";
import { Switch } from "@/shared/ui/switch";

interface SwitchFieldProps {
  label: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

/** A row with a label on the left and an on/off switch on the right; the whole row is clickable. */
export function SwitchField({
  label,
  isChecked,
  onCheckedChange,
  isDisabled,
  className,
}: SwitchFieldProps) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium",
        className,
      )}
    >
      <span>{label}</span>
      <Switch checked={isChecked} onCheckedChange={onCheckedChange} disabled={isDisabled} />
    </label>
  );
}
