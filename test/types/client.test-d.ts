import { expectTypeOf, it } from "vitest"

import type {
	Asset,
	AssetClient,
	AssetTag,
	AssetUploader,
	CreateAssetClient,
	GetAssetsResult,
} from "../../src"
import { AssetType, createAssetClient } from "../../src"

const client = createAssetClient("qwerty", { writeToken: "***" })

it("creates an AssetClient", () => {
	expectTypeOf(createAssetClient).toEqualTypeOf<CreateAssetClient>()
	expectTypeOf(client).toEqualTypeOf<AssetClient>()
})

it("requires a write token", () => {
	// @ts-expect-error - A write token is required
	createAssetClient("qwerty", {})
	// @ts-expect-error - Options are required
	createAssetClient("qwerty")
})

it("returns assets", () => {
	expectTypeOf(client.getAssets()).resolves.toEqualTypeOf<GetAssetsResult>()
	expectTypeOf(client.getAssetByID("foo")).resolves.toEqualTypeOf<Asset>()
	expectTypeOf(client.getAssetsByIDs(["foo"])).resolves.toEqualTypeOf<GetAssetsResult>()
	expectTypeOf(client.dangerouslyGetAllAssets()).resolves.toEqualTypeOf<Asset[]>()
	expectTypeOf(client.createAsset(new Blob(), "foo.png")).resolves.toEqualTypeOf<Asset>()
	expectTypeOf(client.updateAsset("foo", { alt: "bar" })).resolves.toEqualTypeOf<Asset>()
	expectTypeOf(client.deleteAsset("foo")).resolves.toBeVoid()
	expectTypeOf(client.deleteAssets(["foo"])).resolves.toBeVoid()
})

it("returns tags", () => {
	expectTypeOf(client.getTags()).resolves.toEqualTypeOf<AssetTag[]>()
	expectTypeOf(client.createTag("foo")).resolves.toEqualTypeOf<AssetTag>()
	expectTypeOf(client.updateTag("foo", "bar")).resolves.toEqualTypeOf<AssetTag>()
	expectTypeOf(client.deleteTag("foo")).resolves.toBeVoid()
	expectTypeOf(client.assignTagToAssets("foo", ["bar"])).resolves.toBeVoid()
	expectTypeOf(client.unassignTagFromAssets("foo", ["bar"])).resolves.toBeVoid()
})

it("returns uploaders", () => {
	expectTypeOf(client.getUploaders()).resolves.toEqualTypeOf<AssetUploader[]>()
})

it("accepts blob parts as files", () => {
	client.createAsset("foo", "foo.txt")
	client.createAsset(new ArrayBuffer(1), "foo.txt")
	client.createAsset(new Uint8Array(1), "foo.txt")
	client.createAsset(new File([], "foo.txt"), "foo.txt")
	// @ts-expect-error - URLs are not supported
	client.createAsset(new URL("https://example.com/foo.png"), "foo.png")
})

it("supports asset types", () => {
	client.getAssets({ assetType: AssetType.Image })
	client.getAssets({ assetType: "all" })
	// @ts-expect-error - Unknown asset type
	client.getAssets({ assetType: "foo" })
	expectTypeOf<Asset["kind"]>().toEqualTypeOf<"audio" | "document" | "image" | "video">()
})

it("does not support cursor when getting all assets", () => {
	// @ts-expect-error - Cursors are managed internally
	client.dangerouslyGetAllAssets({ cursor: "foo" })
})

it("supports fetch params", () => {
	client.getAssets({ fetchOptions: { cache: "no-cache" } })
	client.getAssetByID("foo", { fetchOptions: { signal: new AbortController().signal } })
	client.createAsset("foo", "foo.txt", { alt: "bar", fetchOptions: { cache: "no-cache" } })
	client.deleteTag("foo", { fetchOptions: { headers: { foo: "bar" } } })
})
