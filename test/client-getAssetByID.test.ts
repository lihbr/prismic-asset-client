import { NotFoundError } from "../src"
import { it } from "./it"

it("returns an asset", async ({ expect, client, asset }) => {
	const res = await client.getAssetByID(asset.id)
	expect(res).toMatchObject({ id: asset.id, filename: asset.filename })
	expect(client).toHaveLastFetchedAssetAPI("assets", { ids: asset.id })
})

it("throws if the asset does not exist", async ({ expect, client }) => {
	await expect(() => client.getAssetByID("invalid")).rejects.toThrow(NotFoundError)
})

it("throws if the asset was deleted", async ({ expect, client, setupClient, asset }) => {
	await setupClient.deleteAsset(asset.id)
	await expect(() => client.getAssetByID(asset.id)).rejects.toThrow(NotFoundError)
})
