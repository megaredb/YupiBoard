import { useEffect } from "react";

const urls = new WeakMap<Blob, string>();
const pendingRevokes = new WeakMap<Blob, ReturnType<typeof setTimeout>>();

function acquireUrl(blob: Blob): string {
  const existing = urls.get(blob);
  if (existing) return existing;
  const created = URL.createObjectURL(blob);
  urls.set(blob, created);
  return created;
}

/**
 * Preview URL for a picked file, revoked once no component shows it anymore (FORM-7).
 * URLs are cached per blob, and revocation waits a tick so StrictMode's simulated unmount and
 * remount keep the same, still valid URL.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  useEffect(() => {
    if (!blob) return;
    clearTimeout(pendingRevokes.get(blob));
    return () => {
      const timer = setTimeout(() => {
        const url = urls.get(blob);
        if (url) URL.revokeObjectURL(url);
        urls.delete(blob);
      });
      pendingRevokes.set(blob, timer);
    };
  }, [blob]);

  return blob ? acquireUrl(blob) : null;
}
