import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globalSetup: ["./test/setup.global.ts"],
		setupFiles: ["./test/setup.ts"],
		typecheck: {
			enabled: true,
		},
		// Tests run against the Asset API, writes are throttled and search
		// results are indexed asynchronously.
		testTimeout: 60_000,
		retry: 1,
		coverage: {
			provider: "v8",
			reporter: ["lcovonly", "text"],
			include: ["src"],
		},
	},
})
