import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui/input";

export function InputGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "group/input-group relative flex h-11 w-full min-w-0 items-center rounded-lg border border-input bg-background transition-colors dark:bg-input/30",
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
        "has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-3 has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/20",
        "has-[[data-slot=input-group-control]:disabled]:bg-muted/60 has-[[data-slot=input-group-control]:disabled]:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

const addonVariants = cva(
  "flex h-full shrink-0 items-center gap-2 text-sm text-muted-foreground select-none [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3",
        "inline-end": "order-last pr-1.5",
      },
    },
    defaultVariants: { align: "inline-start" },
  },
);

type InputGroupAddonProps = ComponentProps<"div"> & VariantProps<typeof addonVariants>;

function InputGroupAddon({ className, align = "inline-start", ...props }: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(addonVariants({ align }), className)}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        "group-has-[[data-align=inline-end]]/input-group:pr-1 group-has-[[data-align=inline-start]]/input-group:pl-2",
        className,
      )}
      {...props}
    />
  );
}

InputGroup.Addon = InputGroupAddon;
InputGroup.Input = InputGroupInput;
