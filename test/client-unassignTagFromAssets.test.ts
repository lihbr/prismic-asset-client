import { NotFoundError } from "../src"
import { it } from "./it"

it("untags assets", async ({ expect, client, setupClient, tag, createAsset }) => {
	const asset1 = await createAsset({ tags: [tag.id] })
	const asset2 = await createAsset({ tags: [tag.id] })
	await client.unassignTagFromAssets(tag.id, [asset1.id])
	expect(client).toHaveLastFetchedAssetAPI(`tags/${tag.id}/assets`, undefined, {
		method: "DELETE",
		body: JSON.stringify({ assetIds: [asset1.id] }),
	})
	const res = await setupClient.getAssets({ tags: [tag.id] })
	expect(res.items.map((asset) => asset.id)).toStrictEqual([asset2.id])
})

it("keeps other tags", async ({ expect, client, setupClient, createTag, createAsset }) => {
	const [tag1, tag2] = await Promise.all([createTag(), createTag()])
	const asset = await createAsset({ tags: [tag1.id, tag2.id] })
	await client.unassignTagFromAssets(tag2.id, [asset.id])
	const res = await setupClient.getAssetByID(asset.id)
	expect(res.tags).toMatchObject([{ id: tag1.id }])
})

it("throws NotFoundError if the tag does not exist", async ({ expect, client, asset }) => {
	await expect(() => client.unassignTagFromAssets(crypto.randomUUID(), [asset.id])).rejects.toThrow(
		NotFoundError,
	)
})

it("throws NotFoundError if an asset does not exist", async ({ expect, client, tag }) => {
	await expect(() => client.unassignTagFromAssets(tag.id, ["invalid"])).rejects.toThrow(
		NotFoundError,
	)
})
