import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImageUp, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FieldControlProps } from "@/shared/components/form-field";
import { useObjectUrl } from "@/shared/hooks/use-object-url";
import { cn } from "@/shared/lib/cn";
import { IMAGE_MIME_TYPES } from "@/shared/lib/image/image-constraints";
import { Button } from "@/shared/ui/button";

interface ImageDropzoneProps {
  control: FieldControlProps;
  value: File | null;
  onChange: (file: File | null) => void;
  hint: string;
}

function ImagePreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
      <img src={url} alt="" className="size-full object-cover" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("common.removeImage")}
        onClick={onRemove}
        className="absolute top-2 right-2 rounded-full bg-card/90 shadow-sm hover:bg-card"
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}

export function ImageDropzone({ control, value, onChange, hint }: ImageDropzoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const previewUrl = useObjectUrl(value);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
    // Reset so picking the same file again after removing it still fires `change`.
    event.target.value = "";
  };
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    onChange(event.dataTransfer.files[0] ?? null);
  };
  const handleBrowse = () => inputRef.current?.click();
  const handleRemove = () => onChange(null);

  return (
    <div>
      <input
        ref={inputRef}
        {...control}
        type="file"
        accept={IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />
      {previewUrl ? (
        <ImagePreview url={previewUrl} onRemove={handleRemove} />
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={handleBrowse}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-auto w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-transparent",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            control["aria-invalid"] && "border-destructive",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-primary">
            <ImageUp aria-hidden className="size-5" />
          </span>
          <span className="text-sm font-normal">
            <span className="font-medium text-primary">{t("common.browseImage")}</span>{" "}
            {t("common.dropImage")}
          </span>
          <span className="text-xs font-normal text-muted-foreground">{hint}</span>
        </Button>
      )}
    </div>
  );
}
