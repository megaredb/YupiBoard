// Both targets use the WebView/browser connectivity events; no native network plugin is installed.

export function isOnline(): boolean {
  return navigator.onLine;
}

export function subscribeOnlineStatus(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
