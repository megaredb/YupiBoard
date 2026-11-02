/** Layer boundaries of RULES.md §2 and TOOL-4: app -> routes -> features -> shared. */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "shared-stays-domain-free",
      comment: "shared/ must not import features, routes or app (ARCH-1).",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(features|routes|app)/|^src/routeTree\\.gen\\.ts$" },
    },
    {
      name: "features-below-routes-and-app",
      comment: "features/ never reach up into routes/ or app/.",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/(routes|app)/|^src/routeTree\\.gen\\.ts$" },
    },
    {
      name: "routes-below-app",
      severity: "error",
      from: { path: "^src/routes/" },
      to: { path: "^src/app/" },
    },
    {
      name: "no-cross-feature-deep-imports",
      comment: "Other features are used through their index.ts only (ARCH-2).",
      severity: "error",
      from: { path: "^src/features/([^/]+)/" },
      to: {
        path: "^src/features/([^/]+)/.+",
        // `.js`: scripts/depcruise.mjs cruises a transpiled copy of src/.
        pathNot: ["^src/features/$1/", "^src/features/[^/]+/index\\.(ts|js)$"],
      },
    },
    {
      name: "shared-ui-is-dumb",
      comment: "shared/ui has no API, router, i18n or stores (ARCH-3).",
      severity: "error",
      from: { path: "^src/shared/ui/" },
      to: {
        path: [
          "^src/shared/(api|i18n|platform|config)/",
          "^src/shared/lib/toast/",
          "node_modules/(@tanstack/react-router|@tanstack/react-query|react-i18next|i18next|zustand)/",
        ],
      },
    },
    {
      name: "generated-api-only-in-feature-hooks",
      comment: "Generated endpoints are wrapped in features/*/hooks or features/*/api (API-3).",
      severity: "error",
      from: { pathNot: "^src/(features/[^/]+/(hooks|api)/|shared/api/)" },
      to: { path: "^src/shared/api/generated/endpoints/" },
    },
    {
      name: "capacitor-only-in-platform",
      severity: "error",
      from: { pathNot: "^src/shared/platform/" },
      to: { path: "node_modules/@capacitor/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "^src/shared/api/generated/" },
    // Written next to the transpiled copy by scripts/depcruise.mjs, for the `@/` alias only.
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
}
