import { useTranslation } from "react-i18next"
import logoSvg from "@/assets/logo.svg"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  variant?: "default" | "icon-only"
  size?: "sm" | "md" | "lg"
}

export function BrandLogo({
  className,
  variant = "default",
  size = "md",
}: BrandLogoProps) {
  const { t } = useTranslation()

  const iconClasses = {
    sm: "size-7",
    md: "size-8",
    lg: "size-12",
  }[size]

  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <img
        src={logoSvg}
        alt=""
        className={cn("shrink-0 object-contain", iconClasses)}
      />
      {variant !== "icon-only" && (
        <span
          className={cn(
            "font-bold tracking-tight text-foreground",
            size === "sm" && "text-base",
            size === "md" && "text-lg",
            size === "lg" && "text-xl"
          )}
        >
          {t("common.brand")}
        </span>
      )}
    </span>
  )
}
