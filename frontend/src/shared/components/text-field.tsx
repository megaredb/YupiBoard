import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  isRequired?: boolean;
  optionalText?: string;
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
}

function PasswordToggle({ isVisible, onToggle }: { isVisible: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={isVisible}
      aria-label={t("common.showPassword")}
      onClick={onToggle}
      className="absolute right-1.5 text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      {isVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
    </Button>
  );
}

/** `FormField` + `Input`, with optional icon, adornment and a show/hide toggle for passwords. */
export function TextField({
  label,
  error,
  hint,
  isRequired,
  optionalText,
  startIcon,
  endAdornment,
  type,
  className,
  ...inputProps
}: TextFieldProps) {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const handleTogglePassword = () => setPasswordVisible((isVisible) => !isVisible);
  const trailing = isPassword ? (
    <PasswordToggle isVisible={isPasswordVisible} onToggle={handleTogglePassword} />
  ) : (
    endAdornment && <div className="absolute right-2 flex items-center">{endAdornment}</div>
  );

  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      isRequired={isRequired}
      optionalText={optionalText}
    >
      {(fieldControl) => (
        <div className="relative flex items-center">
          {startIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 flex items-center text-muted-foreground [&_svg]:size-4"
            >
              {startIcon}
            </span>
          )}
          <Input
            {...fieldControl}
            {...inputProps}
            type={isPassword && isPasswordVisible ? "text" : type}
            className={cn(startIcon && "pl-9", trailing && "pr-12", className)}
          />
          {trailing}
        </div>
      )}
    </FormField>
  );
}
