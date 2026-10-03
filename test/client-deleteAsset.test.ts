import { NotFoundError } from "../src"
import { it } from "./it"

it("deletes an asset", async ({ expect, client, setupClient, asset }) => {
	await client.deleteAsset(asset.id)
	expect(client).toHaveLastFetchedAssetAPI(`assets/${asset.id}`, undefined, { method: "DELETE" })
	await expect(() => setupClient.getAssetByID(asset.id)).rejects.toThrow(NotFoundError)
})

it("throws NotFoundError if the asset does not exist", async ({ expect, client }) => {
	await expect(() => client.deleteAsset("invalid")).rejects.toThrow(NotFoundError)
})
