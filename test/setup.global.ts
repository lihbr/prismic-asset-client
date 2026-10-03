import { ok } from "node:assert"

import { createRepositoriesManager } from "@prismicio/e2e-tests-utils"
import type { TestProject } from "vitest/node"

try {
	process.loadEnvFile(".env.test.local")
} catch {}

ok(process.env.E2E_PRISMIC_EMAIL, "Missing E2E_PRISMIC_EMAIL. See the .env.test.example file.")
ok(
	process.env.E2E_PRISMIC_PASSWORD,
	"Missing E2E_PRISMIC_PASSWORD. See the .env.test.example file.",
)

export const repositories = createRepositoriesManager({
	urlConfig: process.env.PRISMIC_WROOM_BASE_URL || "https://prismic.io",
	authConfig: {
		email: process.env.E2E_PRISMIC_EMAIL,
		password: process.env.E2E_PRISMIC_PASSWORD,
	},
})

export async function setup({ provide }: TestProject): Promise<void> {
	const [repository, writeToken] = await Promise.all([
		repositories.createRepository({ prefix: "e2e-tests-asset-client" }),
		repositories.getUserApiToken(),
	])
	provide("repositoryName", repository.name)
	provide("writeToken", writeToken)
}

export async function teardown(): Promise<void> {
	await repositories.tearDown()
}
