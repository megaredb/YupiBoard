import { useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { ImageUp, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageDropzoneProps {
  value: File | null
  onChange: (file: File | null) => void
  /** MIME types for the file picker, e.g. ["image/jpeg", "image/png"]. */
  accept: readonly string[]
  /** Shown under the call to action, e.g. "JPEG/PNG up to 5 MB". */
  hint?: string
  invalid?: boolean
  id?: string
  "aria-describedby"?: string
}

/** Drop / browse image picker with preview. Type and size rules belong to the form schema. */
export function ImageDropzone({ value, onChange, accept, hint, invalid, id, ...aria }: ImageDropzoneProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const pick = (file: File | undefined) => {
    if (file) onChange(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    pick(event.dataTransfer.files[0])
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex min-h-56 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed bg-muted/40 p-6 text-center transition-colors",
        isDragging && "border-primary bg-primary/5",
        invalid && "border-destructive",
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        aria-invalid={invalid || undefined}
        aria-describedby={aria["aria-describedby"]}
        onChange={(event) => {
          pick(event.target.files?.[0])
          event.target.value = "" // allow re-picking the same file
        }}
      />

      {previewUrl ? (
        <>
          <img src={previewUrl} alt={t("imageDropzone.previewAlt")} className="max-h-60 w-full rounded-lg object-cover" />
          <p className="max-w-full truncate text-xs text-muted-foreground">{value?.name}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              {t("imageDropzone.replace")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X />
              {t("imageDropzone.remove")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ImageUp className="size-5" />
          </span>
          <p className="text-sm">
            {t("imageDropzone.drop")}{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("imageDropzone.browse")}
            </button>
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </div>
  )
}
