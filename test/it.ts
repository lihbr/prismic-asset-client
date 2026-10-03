import { inject, test, vi } from "vitest"

import type { Asset, AssetClient, AssetTag, CreateAssetParams } from "../src"
import { createAssetClient } from "../src"

/** A 1x1 transparent PNG. */
const PNG = Uint8Array.from(
	atob(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
	),
	(char) => char.charCodeAt(0),
)

export type Fixtures = {
	repositoryName: string
	writeToken: string
	/** A client with a spied `fetchFn`. */
	client: AssetClient
	/** A client used to set up test data, its requests are not tracked. */
	setupClient: AssetClient
	/** A PNG file. */
	file: Blob
	/** Uploads a new PNG asset. */
	createAsset: (params?: CreateAssetParams & { filename?: string }) => Promise<Asset>
	/** Creates a new tag with a unique name. */
	createTag: () => Promise<AssetTag>
	/** An uploaded PNG asset. */
	asset: Asset
	/** A tag with a unique name. */
	tag: AssetTag
	/** Returns a unique string, prefixed with `prefix`. */
	unique: (prefix?: string) => string
}

export const it = test.extend<Fixtures>({
	// oxlint-disable-next-line no-empty-pattern
	repositoryName: async ({}, use) => {
		await use(inject("repositoryName"))
	},
	// oxlint-disable-next-line no-empty-pattern
	writeToken: async ({}, use) => {
		await use(inject("writeToken"))
	},
	client: async ({ repositoryName, writeToken }, use) => {
		const client = createAssetClient(repositoryName, { writeToken })
		vi.spyOn(client, "fetchFn")
		await use(client)
	},
	setupClient: async ({ repositoryName, writeToken }, use) => {
		await use(createAssetClient(repositoryName, { writeToken }))
	},
	// oxlint-disable-next-line no-empty-pattern
	file: async ({}, use) => {
		await use(new Blob([PNG], { type: "image/png" }))
	},
	// oxlint-disable-next-line no-empty-pattern
	unique: async ({}, use) => {
		await use((prefix = "") => `${prefix}${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`)
	},
	createAsset: async ({ setupClient, file, unique }, use) => {
		await use(async ({ filename = `${unique("asset-")}.png`, ...params } = {}) => {
			return await setupClient.createAsset(file, filename, params)
		})
	},
	createTag: async ({ setupClient, unique }, use) => {
		await use(async () => {
			return await setupClient.createTag(unique("tag-"))
		})
	},
	asset: async ({ createAsset }, use) => {
		await use(await createAsset())
	},
	tag: async ({ createTag }, use) => {
		await use(await createTag())
	},
})
