import { vi } from "vitest"

import { it } from "./it"

it("returns all assets", async ({ expect, client, createAsset, tag }) => {
	const asset1 = await createAsset({ tags: [tag.id] })
	const asset2 = await createAsset({ tags: [tag.id] })
	const asset3 = await createAsset({ tags: [tag.id] })
	const res = await client.dangerouslyGetAllAssets({ tags: [tag.id], pageSize: 2 })
	expect(res.map((asset) => asset.id)).toStrictEqual([asset3.id, asset2.id, asset1.id])
	expect(client).toHaveFetchedAssetAPITimes(2)
})

it("uses the maximum page size by default", async ({ expect, client, tag }) => {
	await client.dangerouslyGetAllAssets({ tags: [tag.id] })
	expect(client).toHaveLastFetchedAssetAPI("assets", { limit: "100" })
})

it("supports limit", async ({ expect, client, createAsset, tag }) => {
	const asset1 = await createAsset({ tags: [tag.id] })
	const asset2 = await createAsset({ tags: [tag.id] })
	const asset3 = await createAsset({ tags: [tag.id] })
	const res = await client.dangerouslyGetAllAssets({ tags: [tag.id], limit: 2 })
	expect(res.map((asset) => asset.id)).toStrictEqual([asset3.id, asset2.id])
	expect(res).not.toContainEqual(expect.objectContaining({ id: asset1.id }))
	expect(client).toHaveLastFetchedAssetAPI("assets", { limit: "2" })
	expect(client).toHaveFetchedAssetAPITimes(1)
})

it("follows cursors until an empty page", async ({ expect, client }) => {
	const asset = { id: "foo" }
	vi.mocked(client.fetchFn)
		.mockResolvedValueOnce(Response.json({ items: [asset], cursor: "1" }))
		.mockResolvedValueOnce(Response.json({ items: [asset], cursor: "2" }))
		.mockResolvedValueOnce(Response.json({ items: [] }))
	const res = await client.dangerouslyGetAllAssets({ pageSize: 1 })
	expect(res).toHaveLength(2)
	expect(client).toHaveLastFetchedAssetAPI("assets", { cursor: "2" })
	expect(client).toHaveFetchedAssetAPITimes(3)
})

it("stops when no cursor is returned", async ({ expect, client }) => {
	vi.mocked(client.fetchFn).mockResolvedValueOnce(Response.json({ items: [{ id: "foo" }] }))
	const res = await client.dangerouslyGetAllAssets({ pageSize: 1 })
	expect(res).toHaveLength(1)
	expect(client).toHaveFetchedAssetAPITimes(1)
})
