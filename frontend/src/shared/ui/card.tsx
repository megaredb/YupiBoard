import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

/** `--card-spacing` pads the card and separates its parts, so one `size` sets all of it. */
const cardVariants = cva(
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl",
  {
    variants: {
      size: {
        sm: "[--card-spacing:--spacing(3)]",
        default: "[--card-spacing:--spacing(4)]",
        lg: "[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]",
      },
    },
    defaultVariants: { size: "default" },
  },
);

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

export function Card({ className, size, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size ?? "default"}
      className={cn(cardVariants({ size }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-(--card-spacing) has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

const titleVariants = cva("font-heading leading-snug", {
  variants: {
    size: {
      default: "text-base font-medium group-data-[size=sm]/card:text-sm",
      lg: "text-lg font-bold tracking-tight",
      xl: "text-xl font-bold tracking-tight",
      "2xl": "text-2xl font-bold tracking-tight",
    },
  },
  defaultVariants: { size: "default" },
});

type CardTitleProps = ComponentProps<"div"> & VariantProps<typeof titleVariants>;

function CardTitle({ className, size, ...props }: CardTitleProps) {
  return (
    <div data-slot="card-title" className={cn(titleVariants({ size }), className)} {...props} />
  );
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />
  );
}

const footerVariants = cva("flex items-center p-(--card-spacing)", {
  variants: {
    variant: {
      divided: "border-t bg-muted/50",
      plain: "pt-0",
    },
  },
  defaultVariants: { variant: "divided" },
});

type CardFooterProps = ComponentProps<"div"> & VariantProps<typeof footerVariants>;

function CardFooter({ className, variant, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(footerVariants({ variant }), className)}
      {...props}
    />
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
