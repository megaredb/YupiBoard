import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const ENV_DIR = path.resolve(import.meta.dirname, "..");
const ASSET_LINKS_PATH = "/.well-known/assetlinks.json";

/**
 * Digital Asset Links for Android App Links: Android opens links to this site in the app only
 * when this file lists the SHA-256 of the certificate the installed app is signed with.
 */
function androidAssetLinks(fingerprints: string[]): Plugin {
  const body = JSON.stringify([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.yupiboard.app",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
  return {
    name: "android-asset-links",
    configureServer: (server) => {
      server.middlewares.use(ASSET_LINKS_PATH, (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: ASSET_LINKS_PATH.slice(1), source: body });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Not a VITE_ variable: it configures the build and never reaches the app bundle.
  const fingerprints = (loadEnv(mode, ENV_DIR, "").ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean);

  return {
    // The monorepo keeps one `.env` at its root for backend and frontend.
    envDir: ENV_DIR,
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      fingerprints.length > 0 && androidAssetLinks(fingerprints),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  };
});
