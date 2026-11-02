// Regenerates src/routeTree.gen.ts (git-ignored) so `tsc` can run without a Vite build first.
// Uses the same generator and options as the Vite plugin in vite.config.ts.
import { unpluginRouterGeneratorFactory } from "@tanstack/router-plugin";

const plugin = unpluginRouterGeneratorFactory({ target: "react", autoCodeSplitting: true });
await plugin.vite.configResolved({ root: process.cwd() });
