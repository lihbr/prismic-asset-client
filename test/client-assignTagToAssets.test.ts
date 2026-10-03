import { NotFoundError } from "../src"
import { it } from "./it"

it("tags assets", async ({ expect, client, setupClient, tag, createAsset }) => {
	const asset1 = await createAsset()
	const asset2 = await createAsset()
	await client.assignTagToAssets(tag.id, [asset1.id, asset2.id])
	expect(client).toHaveLastFetchedAssetAPI(`tags/${tag.id}/assets`, undefined, {
		method: "POST",
		body: JSON.stringify({ assetIds: [asset1.id, asset2.id] }),
	})
	const res = await setupClient.getAssets({ tags: [tag.id] })
	expect(res.items.map((asset) => asset.id)).toStrictEqual([asset2.id, asset1.id])
})

it("keeps existing tags", async ({ expect, client, setupClient, createTag, createAsset }) => {
	const [tag1, tag2] = await Promise.all([createTag(), createTag()])
	const asset = await createAsset({ tags: [tag1.id] })
	await client.assignTagToAssets(tag2.id, [asset.id])
	const res = await setupClient.getAssetByID(asset.id)
	expect(res.tags).toHaveLength(2)
})

it("throws NotFoundError if the tag does not exist", async ({ expect, client, asset }) => {
	await expect(() => client.assignTagToAssets(crypto.randomUUID(), [asset.id])).rejects.toThrow(
		NotFoundError,
	)
})

it("throws NotFoundError if an asset does not exist", async ({ expect, client, tag }) => {
	await expect(() => client.assignTagToAssets(tag.id, ["invalid"])).rejects.toThrow(NotFoundError)
})
