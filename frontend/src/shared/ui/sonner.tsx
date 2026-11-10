import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const ICONS: ToasterProps["icons"] = {
  success: <CircleCheck aria-hidden className="size-5 text-success" />,
  error: <CircleAlert aria-hidden className="size-5 text-destructive" />,
  info: <Info aria-hidden className="size-5 text-primary" />,
  warning: <TriangleAlert aria-hidden className="size-5 text-secondary-foreground" />,
  loading: <LoaderCircle aria-hidden className="size-5 animate-spin text-muted-foreground" />,
};

const CLASS_NAMES = {
  toast: "gap-3 pr-9 font-sans shadow-lg",
  title: "text-sm leading-snug font-semibold",
  description: "text-sm leading-snug",
  icon: "mt-0.5 self-start",
};

/**
 * shadcn's sonner `Toaster`, conformed to this repo: the theme and labels come in as props, and
 * the colours are mapped to the design tokens in `styles/toaster.css` instead of inline styles.
 */
export function Toaster({ toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      icons={ICONS}
      toastOptions={{
        ...toastOptions,
        classNames: { ...CLASS_NAMES, ...toastOptions?.classNames },
      }}
      {...props}
    />
  );
}
