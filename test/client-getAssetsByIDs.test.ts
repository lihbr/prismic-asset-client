import { it } from "./it"

it("returns assets", async ({ expect, client, createAsset }) => {
	const asset1 = await createAsset()
	const asset2 = await createAsset()
	const res = await client.getAssetsByIDs([asset1.id, asset2.id])
	expect(res.items).toHaveLength(2)
	expect(res.items).toContainEqual(expect.objectContaining({ id: asset1.id }))
	expect(res.items).toContainEqual(expect.objectContaining({ id: asset2.id }))
	expect(res.missing_ids).toBeUndefined()
	expect(client).toHaveLastFetchedAssetAPI("assets", [
		["ids", asset1.id],
		["ids", asset2.id],
	])
})

it("returns missing IDs", async ({ expect, client, asset }) => {
	const res = await client.getAssetsByIDs([asset.id, "invalid"])
	expect(res).toMatchObject({ items: [{ id: asset.id }], missing_ids: ["invalid"] })
})

it("does not fetch without IDs", async ({ expect, client }) => {
	const res = await client.getAssetsByIDs([])
	expect(res).toStrictEqual({ items: [] })
	expect(client.fetchFn).not.toHaveBeenCalled()
})
