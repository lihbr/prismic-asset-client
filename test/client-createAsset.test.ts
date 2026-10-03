import { InvalidDataError } from "../src"
import { it } from "./it"

it("uploads a blob", async ({ expect, client, file, unique }) => {
	const filename = `${unique()}.png`
	const res = await client.createAsset(file, filename)
	expect(res).toMatchObject({
		id: expect.any(String),
		filename,
		extension: "png",
		kind: "image",
		width: 1,
		height: 1,
	})
	expect(client).toHaveLastFetchedAssetAPI("assets", undefined, { method: "POST" })
})

it("uploads a file", async ({ expect, client, file, unique }) => {
	const filename = `${unique()}.png`
	const res = await client.createAsset(new File([file], "ignored.png"), filename)
	expect(res).toMatchObject({ filename, kind: "image" })
})

it("uploads a blob part", async ({ expect, client, unique }) => {
	const filename = `${unique()}.txt`
	const res = await client.createAsset("foo", filename)
	expect(res).toMatchObject({ filename, kind: "document", size: 3 })
})

it("supports notes, credits, and alt", async ({ expect, client, file, unique }) => {
	const res = await client.createAsset(file, `${unique()}.png`, {
		notes: "notes",
		credits: "credits",
		alt: "alt",
	})
	expect(res).toMatchObject({ notes: "notes", credits: "credits", alt: "alt" })
})

it("supports tags", async ({ expect, client, file, unique, createTag }) => {
	const [tag1, tag2] = await Promise.all([createTag(), createTag()])
	const res = await client.createAsset(file, `${unique()}.png`, { tags: [tag1.id, tag2.id] })
	expect(res.tags).toHaveLength(2)
	expect(res.tags).toContainEqual(expect.objectContaining({ id: tag1.id }))
	expect(res.tags).toContainEqual(expect.objectContaining({ id: tag2.id }))
	expect(client).toHaveLastFetchedAssetAPI(`assets/${res.id}`, undefined, {
		method: "PATCH",
		body: JSON.stringify({ tags: [tag1.id, tag2.id] }),
	})
})

it("throws InvalidDataError on invalid metadata", async ({ expect, client, file, unique }) => {
	await expect(() =>
		client.createAsset(file, `${unique()}.png`, { notes: "0".repeat(501) }),
	).rejects.toThrow(InvalidDataError)
})

it("throws InvalidDataError on unknown tags", async ({ expect, client, file, unique }) => {
	await expect(() =>
		client.createAsset(file, `${unique()}.png`, { tags: [crypto.randomUUID()] }),
	).rejects.toThrow(InvalidDataError)
})
