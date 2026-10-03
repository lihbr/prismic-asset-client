import { NotFoundError } from "../src"
import { it } from "./it"

it("deletes a tag", async ({ expect, client, setupClient, tag }) => {
	await client.deleteTag(tag.id)
	expect(client).toHaveLastFetchedAssetAPI(`tags/${tag.id}`, undefined, { method: "DELETE" })
	const tags = await setupClient.getTags()
	expect(tags).not.toContainEqual(expect.objectContaining({ id: tag.id }))
})

it("keeps tagged assets", async ({ expect, client, setupClient, tag, createAsset }) => {
	const asset = await createAsset({ tags: [tag.id] })
	await client.deleteTag(tag.id)
	const res = await setupClient.getAssetByID(asset.id)
	expect(res.tags ?? []).toStrictEqual([])
})

it("throws NotFoundError if the tag does not exist", async ({ expect, client }) => {
	await expect(() => client.deleteTag(crypto.randomUUID())).rejects.toThrow(NotFoundError)
})
