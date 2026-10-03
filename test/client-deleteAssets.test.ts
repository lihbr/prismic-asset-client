import { NotFoundError } from "../src"
import { it } from "./it"

it("deletes assets", async ({ expect, client, setupClient, createAsset }) => {
	const asset1 = await createAsset()
	const asset2 = await createAsset()
	await client.deleteAssets([asset1.id, asset2.id])
	expect(client).toHaveLastFetchedAssetAPI("assets/bulk-delete", undefined, {
		method: "POST",
		body: JSON.stringify({ ids: [asset1.id, asset2.id] }),
	})
	const res = await setupClient.getAssetsByIDs([asset1.id, asset2.id])
	expect(res.items).toStrictEqual([])
})

it("succeeds if at least one asset exists", async ({ expect, client, setupClient, asset }) => {
	await client.deleteAssets([asset.id, "invalid"])
	await expect(() => setupClient.getAssetByID(asset.id)).rejects.toThrow(NotFoundError)
})

it("does not fetch without IDs", async ({ expect, client }) => {
	await client.deleteAssets([])
	expect(client.fetchFn).not.toHaveBeenCalled()
})

it("throws NotFoundError if no asset exists", async ({ expect, client }) => {
	await expect(() => client.deleteAssets(["invalid"])).rejects.toThrow(NotFoundError)
})
