import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/ui/button";
import type { Input } from "@/shared/ui/input";
import { InputGroup } from "@/shared/ui/input-group";

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
      className="text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      {isVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
    </Button>
  );
}

export function TextField({
  label,
  error,
  hint,
  isRequired,
  optionalText,
  startIcon,
  endAdornment,
  type,
  ...inputProps
}: TextFieldProps) {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const handleTogglePassword = () => setPasswordVisible((isVisible) => !isVisible);
  const trailing = isPassword ? (
    <PasswordToggle isVisible={isPasswordVisible} onToggle={handleTogglePassword} />
  ) : (
    endAdornment
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
        <InputGroup>
          {startIcon && <InputGroup.Addon aria-hidden>{startIcon}</InputGroup.Addon>}
          <InputGroup.Input
            {...fieldControl}
            {...inputProps}
            type={isPassword && isPasswordVisible ? "text" : type}
          />
          {trailing && <InputGroup.Addon align="inline-end">{trailing}</InputGroup.Addon>}
        </InputGroup>
      )}
    </FormField>
  );
}
