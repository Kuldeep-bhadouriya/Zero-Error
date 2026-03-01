import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(workspaceRoot, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['tests/setup/unit.setup.ts', 'tests/setup/integration.setup.ts'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
