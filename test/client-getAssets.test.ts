import { vi } from "vitest"

import { it } from "./it"

it("returns a page of assets", async ({ expect, client, createAsset, tag }) => {
	const asset = await createAsset({ tags: [tag.id] })
	const res = await client.getAssets({ tags: [tag.id] })
	expect(res).toMatchObject({ items: [{ id: asset.id }], total: 1 })
	expect(client).toHaveLastFetchedAssetAPI("assets", { tags: tag.id })
})

it("returns assets from newest to oldest", async ({ expect, client, createAsset, tag }) => {
	const asset1 = await createAsset({ tags: [tag.id] })
	const asset2 = await createAsset({ tags: [tag.id] })
	const res = await client.getAssets({ tags: [tag.id] })
	expect(res.items.map((item) => item.id)).toStrictEqual([asset2.id, asset1.id])
})

it("supports page size and cursor", async ({ expect, client, createAsset, tag }) => {
	const asset1 = await createAsset({ tags: [tag.id] })
	const asset2 = await createAsset({ tags: [tag.id] })
	const page1 = await client.getAssets({ tags: [tag.id], pageSize: 1 })
	expect(page1).toMatchObject({ items: [{ id: asset2.id }], cursor: expect.any(String) })
	expect(client).toHaveLastFetchedAssetAPI("assets", { limit: "1" })
	const page2 = await client.getAssets({ tags: [tag.id], pageSize: 1, cursor: page1.cursor })
	expect(page2).toMatchObject({ items: [{ id: asset1.id }] })
	expect(client).toHaveLastFetchedAssetAPI("assets", { limit: "1", cursor: page1.cursor! })
})

it("supports asset type", async ({ expect, client, createAsset, tag }) => {
	const asset = await createAsset({ tags: [tag.id] })
	const images = await client.getAssets({ tags: [tag.id], assetType: "image" })
	expect(images.items).toMatchObject([{ id: asset.id, kind: "image" }])
	expect(client).toHaveLastFetchedAssetAPI("assets", { assetType: "image" })
	const documents = await client.getAssets({ tags: [tag.id], assetType: "document" })
	expect(documents.items).toStrictEqual([])
})

it("supports multiple tags", async ({ expect, client, setupClient, createAsset, createTag }) => {
	const [tag1, tag2] = await Promise.all([createTag(), createTag()])
	const asset = await createAsset({ tags: [tag1.id, tag2.id] })
	await createAsset({ tags: [tag1.id] })
	const res = await client.getAssets({ tags: [tag1.id, tag2.id] })
	expect(res.items).toMatchObject([{ id: asset.id }])
	expect(client).toHaveLastFetchedAssetAPI("assets", [
		["tags", tag1.id],
		["tags", tag2.id],
	])
	await setupClient.deleteTag(tag2.id)
})

it("supports keyword", async ({ expect, client, createAsset, unique }) => {
	const keyword = unique("kw")
	const asset = await createAsset({ filename: `${keyword}.png` })
	await vi.waitFor(
		async () => {
			const res = await client.getAssets({ keyword })
			expect(res.items).toMatchObject([{ id: asset.id }])
		},
		{ timeout: 45_000, interval: 2_000 },
	)
	expect(client).toHaveLastFetchedAssetAPI("assets", { keyword })
})

it("supports uploader ID", async ({ expect, client, tag }) => {
	const res = await client.getAssets({ tags: [tag.id], uploaderID: "ghost" })
	expect(res.items).toStrictEqual([])
	expect(client).toHaveLastFetchedAssetAPI("assets", { uploaderId: "ghost" })
})

it("supports AI search", async ({ expect, client }) => {
	vi.mocked(client.fetchFn).mockImplementation(async () => Response.json({ items: [] }))
	await client.getAssets({ aiDescription: "foo" })
	expect(client).toHaveLastFetchedAssetAPI("assets", { aiDescription: "foo" })
	await client.getAssets({ aiKeywords: "bar" })
	expect(client).toHaveLastFetchedAssetAPI("assets", { aiKeywords: "bar" })
})

it("omits undefined parameters", async ({ expect, client }) => {
	vi.mocked(client.fetchFn).mockImplementation(async () => Response.json({ items: [] }))
	await client.getAssets({ keyword: undefined })
	expect(new URL(vi.mocked(client.fetchFn).mock.lastCall![0]).search).toBe("")
})
