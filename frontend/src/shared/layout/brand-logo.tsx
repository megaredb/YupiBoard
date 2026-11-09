import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

interface BrandLogoProps {
  className?: string;
  isIconOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const iconVariants = cva("shrink-0 object-contain", {
  variants: { size: { xs: "size-5", sm: "size-7", md: "size-8", lg: "size-12" } },
});

const textVariants = cva("font-bold tracking-tight text-foreground", {
  variants: { size: { xs: "text-sm", sm: "text-base", md: "text-lg", lg: "text-xl" } },
});

export function BrandLogo({ className, isIconOnly = false, size = "md" }: BrandLogoProps) {
  const { t } = useTranslation();

  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <img
        src="/images/logo.svg"
        alt={isIconOnly ? t("common.brand") : ""}
        width={48}
        height={48}
        className={iconVariants({ size })}
      />
      {!isIconOnly && <span className={textVariants({ size })}>{t("common.brand")}</span>}
    </span>
  );
}
