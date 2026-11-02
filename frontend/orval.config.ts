import { defineConfig } from "orval";

export default defineConfig({
  yupiboard: {
    input: "./openapi/openapi.json",
    output: {
      mode: "tags-split",
      target: "./src/shared/api/generated/endpoints",
      schemas: "./src/shared/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      formatter: "prettier",
      override: {
        mutator: {
          path: "./src/shared/api/mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
});
