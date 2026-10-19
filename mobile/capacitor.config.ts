import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.yupiboard.app",
  appName: "YupiBoard",
  webDir: "../frontend/dist",
  server: {
    androidScheme: "https",
    hostname: "yupiboard.localhost",
  },
  plugins: {
    Preferences: {
      group: "YupiBoardPreferences",
    },
  },
}

export default config
