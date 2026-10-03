import { it } from "./it"

it("returns all tags", async ({ expect, client, tag }) => {
	const res = await client.getTags()
	expect(res).toContainEqual(expect.objectContaining({ id: tag.id, name: tag.name }))
	expect(client).toHaveLastFetchedAssetAPI("tags")
})

it("includes asset count", async ({ expect, client, setupClient, createAsset, tag }) => {
	const asset = await createAsset()
	await setupClient.assignTagToAssets(tag.id, [asset.id])
	const res = await client.getTags()
	expect(res).toContainEqual(expect.objectContaining({ id: tag.id, count: 1 }))
})
