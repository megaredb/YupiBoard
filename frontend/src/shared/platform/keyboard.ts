import { Keyboard } from "@capacitor/keyboard";
import { isNativePlatform } from "@/shared/platform/is-native";

function setKeyboardOpen(isOpen: boolean): void {
  document.documentElement.dataset.keyboard = isOpen ? "open" : "closed";
}

/**
 * Sets `data-keyboard` on `<html>` so bottom navigation can hide while typing. No keyboard height
 * is exposed: Capacitor pads the WebView by the keyboard on Android, so `bottom: 0` already sits
 * above it, just as browsers resize the viewport themselves.
 */
export function initKeyboardState(): () => void {
  setKeyboardOpen(false);
  if (!isNativePlatform()) return () => {};
  const show = Keyboard.addListener("keyboardWillShow", () => setKeyboardOpen(true));
  const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardOpen(false));
  return () => {
    void show.then((handle) => handle.remove());
    void hide.then((handle) => handle.remove());
  };
}
