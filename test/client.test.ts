import { describe, vi } from "vitest"

import type { AssetClient } from "../src"
import {
	ForbiddenError,
	InvalidDataError,
	NotFoundError,
	PrismicError,
	createAssetClient,
} from "../src"
import type { FetchParams } from "../src"
import type { Fixtures } from "./it"
import { it as baseIt } from "./it"

const it = baseIt.extend<{ client: AssetClient }>({
	client: async ({ repositoryName, writeToken }, use) => {
		// Requests are mocked, a unique endpoint isolates write throttling
		// between tests.
		const client = createAssetClient(repositoryName, {
			writeToken,
			assetAPIEndpoint: `https://${crypto.randomUUID()}.example.com`,
		})
		vi.spyOn(client, "fetchFn")
		await use(client)
	},
})

const asset = {
	id: "foo",
	url: "https://example.com/foo.png",
	created_at: 0,
	last_modified: 0,
	filename: "foo.png",
	extension: "png",
	size: 1,
	kind: "image",
}
const tag = { id: crypto.randomUUID(), name: "foo", created_at: 0, last_modified: 0 }

type Case = {
	name: keyof AssetClient
	method: "GET" | "POST" | "PATCH" | "DELETE"
	fn: (args: Pick<Fixtures, "client" | "file">, params?: FetchParams) => Promise<unknown>
	response: () => Response
}

const cases: Case[] = [
	{
		name: "getAssets",
		method: "GET",
		fn: ({ client }, params) => client.getAssets(params),
		response: () => Response.json({ items: [asset] }),
	},
	{
		name: "getAssetByID",
		method: "GET",
		fn: ({ client }, params) => client.getAssetByID(asset.id, params),
		response: () => Response.json({ items: [asset] }),
	},
	{
		name: "getAssetsByIDs",
		method: "GET",
		fn: ({ client }, params) => client.getAssetsByIDs([asset.id], params),
		response: () => Response.json({ items: [asset] }),
	},
	{
		name: "dangerouslyGetAllAssets",
		method: "GET",
		fn: ({ client }, params) => client.dangerouslyGetAllAssets(params),
		response: () => Response.json({ items: [asset] }),
	},
	{
		name: "createAsset",
		method: "POST",
		fn: ({ client, file }, params) => client.createAsset(file, "foo.png", params),
		response: () => Response.json(asset),
	},
	{
		name: "updateAsset",
		method: "PATCH",
		fn: ({ client }, params) => client.updateAsset(asset.id, { alt: "foo", ...params }),
		response: () => Response.json(asset),
	},
	{
		name: "deleteAsset",
		method: "DELETE",
		fn: ({ client }, params) => client.deleteAsset(asset.id, params),
		response: () => new Response(null, { status: 204 }),
	},
	{
		name: "deleteAssets",
		method: "POST",
		fn: ({ client }, params) => client.deleteAssets([asset.id], params),
		response: () => new Response(null, { status: 204 }),
	},
	{
		name: "getTags",
		method: "GET",
		fn: ({ client }, params) => client.getTags(params),
		response: () => Response.json({ items: [tag] }),
	},
	{
		name: "createTag",
		method: "POST",
		fn: ({ client }, params) => client.createTag(tag.name, params),
		response: () => Response.json(tag, { status: 201 }),
	},
	{
		name: "updateTag",
		method: "PATCH",
		fn: ({ client }, params) => client.updateTag(tag.id, tag.name, params),
		response: () => Response.json(tag),
	},
	{
		name: "deleteTag",
		method: "DELETE",
		fn: ({ client }, params) => client.deleteTag(tag.id, params),
		response: () => new Response(null, { status: 204 }),
	},
	{
		name: "assignTagToAssets",
		method: "POST",
		fn: ({ client }, params) => client.assignTagToAssets(tag.id, [asset.id], params),
		response: () => new Response(null, { status: 204 }),
	},
	{
		name: "unassignTagFromAssets",
		method: "DELETE",
		fn: ({ client }, params) => client.unassignTagFromAssets(tag.id, [asset.id], params),
		response: () => new Response(null, { status: 204 }),
	},
	{
		name: "getUploaders",
		method: "GET",
		fn: ({ client }, params) => client.getUploaders(params),
		response: () => Response.json({ items: [{ id: "foo" }] }),
	},
]

describe.each(cases)("$name", ({ method, fn, response }) => {
	it("uses the expected method", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async () => response())
		await fn({ client, file })
		expect(vi.mocked(client.fetchFn).mock.lastCall?.[1]?.method ?? "GET").toBe(method)
	})

	it("sends repository and authorization headers", async ({
		expect,
		client,
		file,
		repositoryName,
		writeToken,
	}) => {
		vi.mocked(client.fetchFn).mockImplementation(async () => response())
		await fn({ client, file })
		expect(vi.mocked(client.fetchFn).mock.lastCall?.[1]?.headers).toMatchObject({
			repository: repositoryName,
			authorization: `Bearer ${writeToken}`,
		})
	})

	it("supports fetch options", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async () => response())
		await fn({ client, file }, { fetchOptions: { cache: "no-cache" } })
		expect(vi.mocked(client.fetchFn).mock.lastCall?.[1]).toMatchObject({ cache: "no-cache" })
	})

	it("supports default fetch options", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async () => response())
		client.fetchOptions = { cache: "no-cache", headers: { foo: "bar" } }
		await fn({ client, file }, { fetchOptions: { headers: { baz: "qux" } } })
		expect(vi.mocked(client.fetchFn).mock.lastCall?.[1]).toMatchObject({
			cache: "no-cache",
			headers: { foo: "bar", baz: "qux" },
		})
	})

	// Native `fetch()` is not used as aborting a `FormData` body causes an
	// unhandled rejection in Node.js.
	it("supports signal", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async (_url, init) => {
			init?.signal?.throwIfAborted()
			return response()
		})
		await expect(() =>
			fn({ client, file }, { fetchOptions: { signal: AbortSignal.abort() } }),
		).rejects.toThrow("aborted")
	})

	it("supports default signal", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async (_url, init) => {
			init?.signal?.throwIfAborted()
			return response()
		})
		client.fetchOptions = { signal: AbortSignal.abort() }
		await expect(() => fn({ client, file })).rejects.toThrow("aborted")
	})

	it.for([
		[400, InvalidDataError],
		[401, ForbiddenError],
		[403, ForbiddenError],
		[404, NotFoundError],
		[413, InvalidDataError],
		[500, PrismicError],
		[503, PrismicError],
	] as const)("throws on %i", async ([status, error], { expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async () =>
			Response.json({ error: "foo" }, { status }),
		)
		const promise = fn({ client, file })
		await expect(promise).rejects.toThrow(error)
		await expect(promise).rejects.toThrow("foo")
	})

	it("retries rate limited requests", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn)
			.mockResolvedValueOnce(
				Response.json(
					{ message: "API rate limit exceeded" },
					{
						status: 429,
						headers: { "retry-after": "0" },
					},
				),
			)
			.mockImplementation(async () => response())
		await expect(fn({ client, file })).resolves.not.toThrow()
		expect(client.fetchFn).toHaveBeenCalledTimes(2)
	})
})

describe.each(cases.filter(({ method }) => method === "GET"))("$name", ({ fn, response }) => {
	it("shares concurrent equivalent network requests", async ({ expect, client, file }) => {
		vi.mocked(client.fetchFn).mockImplementation(async () => response())
		const controller1 = new AbortController()
		const controller2 = new AbortController()
		await Promise.all([
			fn({ client, file }),
			fn({ client, file }),
			fn({ client, file }, { fetchOptions: { signal: controller1.signal } }),
			fn({ client, file }, { fetchOptions: { signal: controller1.signal } }),
			fn({ client, file }, { fetchOptions: { signal: controller2.signal } }),
			fn({ client, file }, { fetchOptions: { signal: controller2.signal } }),
		])
		await fn({ client, file })
		expect(client).toHaveFetchedAssetAPITimes(4)
	})

	it("does not share network requests across repositories", async ({
		expect,
		client,
		file,
		writeToken,
	}) => {
		const otherClient = createAssetClient("other", { writeToken })
		vi.spyOn(otherClient, "fetchFn").mockImplementation(async () => response())
		vi.mocked(client.fetchFn).mockImplementation(async () => response())
		await Promise.all([fn({ client, file }), fn({ client: otherClient, file })])
		expect(client.fetchFn).toHaveBeenCalledTimes(1)
		expect(otherClient.fetchFn).toHaveBeenCalledTimes(1)
	})
})

describe("errors", () => {
	it("uses the response message", async ({ expect, client }) => {
		vi.mocked(client.fetchFn).mockResolvedValue(
			Response.json({ code: "INVALID_TAGS", message: "Some tags were not found" }, { status: 400 }),
		)
		await expect(() => client.getTags()).rejects.toThrow("Some tags were not found")
	})

	it("uses the response error and details", async ({ expect, client }) => {
		vi.mocked(client.fetchFn).mockResolvedValue(
			Response.json({ error: "invalid_cursor", details: "Invalid" }, { status: 400 }),
		)
		await expect(() => client.getTags()).rejects.toThrow("invalid_cursor: Invalid")
	})

	it("uses the response code", async ({ expect, client }) => {
		vi.mocked(client.fetchFn).mockResolvedValue(
			Response.json({ code: "malformed_query", detail: [] }, { status: 400 }),
		)
		await expect(() => client.getTags()).rejects.toThrow("malformed_query")
	})

	it("exposes the response payload and URL", async ({ expect, client }) => {
		const payload = { error: "invalid_token" }
		vi.mocked(client.fetchFn).mockResolvedValue(
			Object.defineProperty(Response.json(payload, { status: 401 }), "url", {
				value: "https://example.com",
			}),
		)
		await expect(() => client.getTags()).rejects.toMatchObject({
			response: payload,
			url: "https://example.com",
		})
	})

	it("handles non-JSON responses", async ({ expect, client }) => {
		vi.mocked(client.fetchFn).mockResolvedValue(new Response("<html></html>", { status: 502 }))
		const promise = client.getTags()
		await expect(promise).rejects.toThrow(PrismicError)
		await expect(promise).rejects.toMatchObject({
			message: "An invalid API response was returned",
			response: undefined,
		})
	})

	baseIt("throws ForbiddenError with an invalid token", async ({ expect, repositoryName }) => {
		const client = createAssetClient(repositoryName, { writeToken: "invalid" })
		await expect(() => client.getTags()).rejects.toThrow(ForbiddenError)
	})
})
