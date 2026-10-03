import { InvalidDataError, NotFoundError } from "../src"
import { it } from "./it"

it("updates an asset", async ({ expect, client, asset, unique }) => {
	const filename = `${unique()}.png`
	const res = await client.updateAsset(asset.id, {
		filename,
		notes: "notes",
		credits: "credits",
		alt: "alt",
	})
	expect(res).toMatchObject({
		id: asset.id,
		filename,
		notes: "notes",
		credits: "credits",
		alt: "alt",
	})
	expect(client).toHaveLastFetchedAssetAPI(`assets/${asset.id}`, undefined, {
		method: "PATCH",
		body: JSON.stringify({ notes: "notes", credits: "credits", alt: "alt", filename }),
	})
})

it("keeps unspecified fields", async ({ expect, client, setupClient, asset }) => {
	await setupClient.updateAsset(asset.id, { notes: "notes" })
	const res = await client.updateAsset(asset.id, { alt: "alt" })
	expect(res).toMatchObject({ notes: "notes", alt: "alt" })
})

it("replaces tags", async ({ expect, client, createTag, createAsset }) => {
	const [tag1, tag2] = await Promise.all([createTag(), createTag()])
	const asset = await createAsset({ tags: [tag1.id] })
	const res = await client.updateAsset(asset.id, { tags: [tag2.id] })
	expect(res.tags).toMatchObject([{ id: tag2.id }])
})

it("removes all tags", async ({ expect, client, tag, createAsset }) => {
	const asset = await createAsset({ tags: [tag.id] })
	const res = await client.updateAsset(asset.id, { tags: [] })
	expect(res.tags ?? []).toStrictEqual([])
})

it("throws NotFoundError if the asset does not exist", async ({ expect, client }) => {
	await expect(() => client.updateAsset("invalid", { alt: "alt" })).rejects.toThrow(NotFoundError)
})

it("throws InvalidDataError on unknown tags", async ({ expect, client, asset }) => {
	await expect(() => client.updateAsset(asset.id, { tags: [crypto.randomUUID()] })).rejects.toThrow(
		InvalidDataError,
	)
})

it("throws InvalidDataError on invalid metadata", async ({ expect, client, asset }) => {
	await expect(() => client.updateAsset(asset.id, { alt: "0".repeat(501) })).rejects.toThrow(
		InvalidDataError,
	)
})
