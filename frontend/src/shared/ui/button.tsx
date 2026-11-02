import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { buttonVariants, type ButtonVariantProps } from "@/shared/ui/button-variants"

interface ButtonProps extends ButtonPrimitive.Props, ButtonVariantProps {
  isLoading?: boolean
}

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading && <LoaderCircle aria-hidden className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}
