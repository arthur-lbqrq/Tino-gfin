import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: false,
    // Sem isso, testes compilados que sobraram em dist/ (build de produção)
    // são descobertos de novo e quebram — são CJS, vitest só roda ESM/TS.
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
