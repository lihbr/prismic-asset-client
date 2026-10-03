import { InvalidDataError } from "../src"
import { it } from "./it"

it("creates a tag", async ({ expect, client, unique }) => {
	const name = unique()
	const res = await client.createTag(name)
	expect(res).toMatchObject({ id: expect.any(String), name })
	expect(client).toHaveLastFetchedAssetAPI("tags", undefined, {
		method: "POST",
		body: JSON.stringify({ name }),
	})
})

it("throws InvalidDataError if the tag already exists", async ({ expect, client, tag }) => {
	await expect(() => client.createTag(tag.name)).rejects.toThrow(InvalidDataError)
})

it("throws InvalidDataError if the name is too long", async ({ expect, client }) => {
	await expect(() => client.createTag("0".repeat(21))).rejects.toThrow(InvalidDataError)
})
