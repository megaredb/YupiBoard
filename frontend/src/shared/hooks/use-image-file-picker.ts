import { useState, type ChangeEvent } from "react";
import type { ImageKind } from "@/shared/lib/image/image-constraints";
import { prepareImage } from "@/shared/lib/image/prepare-image";

interface ImageFilePicker {
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** The last picked file was the wrong type or too large. */
  hasError: boolean;
}

/** `onChange` of an image `<input type="file">`: validates and resizes through the shared pipeline. */
export function useImageFilePicker(kind: ImageKind, onPick: (file: File) => void): ImageFilePicker {
  const [hasError, setHasError] = useState(false);

  const pickFile = async (file: File) => {
    const result = await prepareImage(file, kind);
    setHasError(result.status !== "ok");
    if (result.status === "ok") onPick(result.file);
  };
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires `change`.
    event.target.value = "";
    if (file) void pickFile(file);
  };

  return { handleFileChange, hasError };
}
