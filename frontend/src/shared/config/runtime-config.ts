export interface RuntimeConfig {
  apiBaseUrl: string
  publicWebUrl: string
  googleClientId: string | null
}

let runtimeConfig: RuntimeConfig | null = null

/** Set once by `bootstrap()` from the validated env; layers below `app/` read it from here. */
export function setRuntimeConfig(config: RuntimeConfig): void {
  runtimeConfig = config
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!runtimeConfig) throw new Error("Runtime config was read before bootstrap()")
  return runtimeConfig
}
