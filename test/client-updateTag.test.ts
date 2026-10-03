import { InvalidDataError, NotFoundError } from "../src"
import { it } from "./it"

it("renames a tag", async ({ expect, client, tag, unique }) => {
	const name = unique()
	const res = await client.updateTag(tag.id, name)
	expect(res).toMatchObject({ id: tag.id, name })
	expect(client).toHaveLastFetchedAssetAPI(`tags/${tag.id}`, undefined, {
		method: "PATCH",
		body: JSON.stringify({ name }),
	})
})

it("throws InvalidDataError if the name is taken", async ({ expect, client, createTag }) => {
	const [tag1, tag2] = await Promise.all([createTag(), createTag()])
	await expect(() => client.updateTag(tag1.id, tag2.name)).rejects.toThrow(InvalidDataError)
})

it("throws NotFoundError if the tag does not exist", async ({ expect, client, unique }) => {
	await expect(() => client.updateTag(crypto.randomUUID(), unique())).rejects.toThrow(NotFoundError)
})
