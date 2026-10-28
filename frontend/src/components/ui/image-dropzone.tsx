import { useEffect, useMemo, useRef, useState } from "react"
import { ImageUp, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ImageDropzoneProps {
  id?: string
  value: File | null
  onChange: (file: File | null) => void
  /** Allowed MIME types, e.g. `["image/jpeg", "image/png"]`. */
  accept: readonly string[]
  hint?: string
  invalid?: boolean
  "aria-describedby"?: string
}

export function ImageDropzone({
  id,
  value,
  onChange,
  accept,
  hint,
  invalid,
  ...aria
}: ImageDropzoneProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept.join(",")}
        aria-invalid={invalid || undefined}
        aria-describedby={aria["aria-describedby"]}
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null)
          // Reset so picking the same file again after removing it still fires `change`.
          event.target.value = ""
        }}
      />

      {previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
          <img src={previewUrl} alt="" className="size-full object-cover" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("dropzone.remove")}
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 size-8 rounded-full bg-card/90 shadow-sm hover:bg-card"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            onChange(event.dataTransfer.files?.[0] ?? null)
          }}
          className={cn(
            "flex h-auto w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-transparent",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            invalid && "border-destructive",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-primary">
            <ImageUp aria-hidden className="size-5" />
          </span>
          <span className="text-sm font-normal">
            <span className="font-medium text-primary">{t("dropzone.browse")}</span>
            {t("dropzone.orDrop")}
          </span>
          {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
        </Button>
      )}
    </div>
  )
}

