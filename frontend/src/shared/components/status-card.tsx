import type { ReactNode } from "react"
import { cva } from "class-variance-authority"
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react"
import { Card } from "@/shared/ui/card"

type StatusTone = "pending" | "success" | "error"

interface StatusCardProps {
  tone: StatusTone
  title: string
  description: string
  children?: ReactNode
}

const iconWrapperVariants = cva(
  "mx-auto mb-2 flex size-12 items-center justify-center rounded-full",
  {
    variants: {
      tone: {
        pending: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        error: "bg-destructive/10 text-destructive",
      },
    },
  },
)

const ICONS = { pending: LoaderCircle, success: CheckCircle2, error: CircleAlert } as const

/** Result card for one-shot flows (email verification, password reset). */
export function StatusCard({ tone, title, description, children }: StatusCardProps) {
  const Icon = ICONS[tone]
  return (
    <Card className="w-full rounded-2xl p-2 shadow-sm sm:p-4">
      <Card.Header className="text-center">
        <div className={iconWrapperVariants({ tone })}>
          <Icon aria-hidden className={tone === "pending" ? "size-6 animate-spin" : "size-6"} />
        </div>
        <Card.Title className="text-2xl font-bold tracking-tight">{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      {children && (
        <Card.Footer className="flex-col gap-2 border-0 bg-transparent">{children}</Card.Footer>
      )}
    </Card>
  )
}
