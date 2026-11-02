type SessionEndedListener = (userId: string | null) => void

const listeners = new Set<SessionEndedListener>()

/** Fires after logout or session expiry, once tokens and on-device user data are wiped. */
export function onSessionEnded(listener: SessionEndedListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitSessionEnded(userId: string | null): void {
  listeners.forEach((listener) => listener(userId))
}
