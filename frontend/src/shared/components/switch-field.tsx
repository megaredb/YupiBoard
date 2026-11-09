import { cn } from "@/shared/lib/cn";
import { Switch } from "@/shared/ui/switch";

interface SwitchFieldProps {
  label: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

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
