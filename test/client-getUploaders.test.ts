import { it } from "./it"

it("returns uploaders", async ({ expect, client, asset }) => {
	const res = await client.getUploaders()
	expect(res).toContainEqual({ id: asset.uploader_id })
	expect(client).toHaveLastFetchedAssetAPI("uploaders")
})
