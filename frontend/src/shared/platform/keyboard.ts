import { Keyboard } from "@capacitor/keyboard";
import { isNativePlatform } from "@/shared/platform/is-native";

const INSET_PROPERTY = "--keyboard-inset";

function setInset(px: number): void {
  document.documentElement.style.setProperty(INSET_PROPERTY, `${px}px`);
  document.documentElement.dataset.keyboard = px > 0 ? "open" : "closed";
}

/**
 * Exposes the on-screen keyboard height as `--keyboard-inset` so fixed bars can sit above it, and
 * `data-keyboard` on `<html>` so bottom navigation can hide while typing.
 * Browsers resize the viewport themselves, so the web variable stays `0px`.
 */
export function initKeyboardInsets(): () => void {
  setInset(0);
  if (!isNativePlatform()) return () => {};
  const show = Keyboard.addListener("keyboardWillShow", (info) => setInset(info.keyboardHeight));
  const hide = Keyboard.addListener("keyboardWillHide", () => setInset(0));
  return () => {
    void show.then((handle) => handle.remove());
    void hide.then((handle) => handle.remove());
  };
}
