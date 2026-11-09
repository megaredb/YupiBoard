import { create } from "zustand";

export type ToastTone = "success" | "info";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  nextId: number;
}

const useToastStore = create<ToastState>(() => ({ toasts: [], nextId: 1 }));

/** The one mechanism for transient notices (logged out, saved, …). Text must already be translated. */
export function showToast(message: string, tone: ToastTone = "success"): void {
  useToastStore.setState((state) => ({
    toasts: [...state.toasts, { id: state.nextId, message, tone }],
    nextId: state.nextId + 1,
  }));
}

export function dismissToast(id: number): void {
  useToastStore.setState((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  }));
}

export function useToasts(): Toast[] {
  return useToastStore((state) => state.toasts);
}
