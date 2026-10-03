import { vi } from "vitest"

import { AssetClient, PrismicError, createAssetClient } from "../src"
import type { FetchLike } from "../src"
import { it } from "./it"

it("returns an AssetClient", async ({ expect, writeToken }) => {
	const res = createAssetClient("example", { writeToken })
	expect(res).toBeInstanceOf(AssetClient)
})

it("accepts a repository name", async ({ expect, writeToken }) => {
	const res = createAssetClient("example", { writeToken })
	expect(res.repositoryName).toBe("example")
	expect(res.assetAPIEndpoint).toBe("https://asset-api.prismic.io/")
})

it("accepts a write token", async ({ expect, writeToken }) => {
	const res = createAssetClient("example", { writeToken })
	expect(res.writeToken).toBe(writeToken)
})

it("supports custom asset api endpoint", async ({ expect, writeToken }) => {
	const res = createAssetClient("example", {
		writeToken,
		assetAPIEndpoint: "https://example.com",
	})
	expect(res.assetAPIEndpoint).toBe("https://example.com/")
})

it("supports custom asset api endpoint with a trailing slash", async ({ expect, writeToken }) => {
	const res = createAssetClient("example", {
		writeToken,
		assetAPIEndpoint: "https://example.com/asset/",
	})
	expect(res.assetAPIEndpoint).toBe("https://example.com/asset/")
})

it("supports custom fetch", async ({ expect, writeToken }) => {
	const fetch: FetchLike = async () => Response.json({ items: [] })
	const res = createAssetClient("example", { writeToken, fetch })
	expect(res.fetchFn).toBe(fetch)
})

it("supports default fetch options", async ({ expect, writeToken }) => {
	const res = createAssetClient("example", { writeToken, fetchOptions: { cache: "no-cache" } })
	expect(res.fetchOptions).toStrictEqual({ cache: "no-cache" })
})

it("uses the global fetch function by default", async ({ expect, writeToken }) => {
	const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ items: [] }))
	const client = createAssetClient("example", { writeToken })
	await client.getTags()
	expect(fetchSpy).toHaveBeenCalledOnce()
})

it("throws if fetch is unavailable", async ({ expect, writeToken }) => {
	vi.stubGlobal("fetch", undefined)
	expect(() => createAssetClient("example", { writeToken })).toThrow(PrismicError)
	expect(() => createAssetClient("example", { writeToken })).toThrow(
		/fetch implementation was not provided/i,
	)
	vi.unstubAllGlobals()
})

it("throws if provided fetch is not a function", async ({ expect, writeToken }) => {
	expect(() =>
		createAssetClient("example", {
			writeToken,
			// @ts-expect-error - Testing an invalid fetch implementation
			fetch: "not a function",
		}),
	).toThrow(/fetch must be a function/i)
})

it("warns if running in a browser-like environment", async ({ expect, writeToken }) => {
	vi.stubGlobal("window", {})
	createAssetClient("example", { writeToken })
	expect(console.warn).toBeCalledWith(expect.stringMatching(/browser environment/i))
	vi.unstubAllGlobals()
})
