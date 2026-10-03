import { ForbiddenError, InvalidDataError, NotFoundError, PrismicError } from "./errors"
import type { AssetAPIErrorResponse } from "./errors"
import type { FetchLike, RequestInitLike, ResponseLike } from "./lib/request"
import { request } from "./lib/request"
import type {
	Asset,
	GetAssetsParams,
	GetAssetsResult,
	PatchAssetParams,
	PatchAssetResult,
	PostAssetParams,
	PostAssetResult,
} from "./types/asset"
import type {
	AssetTag,
	GetAssetTagsResult,
	PatchAssetTagResult,
	PostAssetTagResult,
} from "./types/tag"
import type { AssetUploader, GetAssetUploadersResult } from "./types/uploader"

const MAX_PAGE_SIZE = 100
const GET_ALL_QUERY_DELAY = 500

/** Parameters for client methods that use `fetch()`. */
export type FetchParams = {
	/**
	 * Options provided to the client's `fetch()` on all network requests. These options will be
	 * merged with internally required options. They can also be overriden on a per-query basis using
	 * the query's `fetchOptions` parameter.
	 */
	fetchOptions?: RequestInitLike
}

/**
 * Parameters specific to client methods that fetch all assets. These methods start with
 * `dangerouslyGetAll` (e.g. `dangerouslyGetAllAssets`).
 */
type GetAllParams = {
	/**
	 * Limit the number of assets queried.
	 *
	 * @default No limit.
	 */
	limit?: number
}

/** Additional parameters for creating an asset in the Prismic media library. */
export type CreateAssetParams = {
	/** Asset notes. */
	notes?: string

	/** Asset credits. */
	credits?: string

	/** Asset alt text. */
	alt?: string

	/** Asset tag IDs. */
	tags?: string[]
}

/** Asset client configuration. */
export type AssetClientConfig = {
	/** A Prismic write token that allows writing content to the repository. */
	writeToken: string

	/**
	 * The Prismic Asset API endpoint.
	 *
	 * @defaultValue `"https://asset-api.prismic.io/"`
	 * @see Prismic Asset API technical reference: {@link https://prismic.io/docs/asset-api-technical-reference}
	 */
	assetAPIEndpoint?: string

	/**
	 * The `fetch` function used to make network requests.
	 *
	 * @default The global `fetch` function.
	 */
	fetch?: FetchLike

	/**
	 * The default `fetch` options sent with each Asset API request. These parameters can be overriden
	 * on each method.
	 */
	fetchOptions?: RequestInitLike
}

/**
 * A client that allows querying and managing a Prismic repository's media library through the Asset
 * API.
 *
 * If used in an environment where a global `fetch` function is unavailable, the `fetch` option must
 * be provided as part of the `options` parameter.
 *
 * @see Prismic Asset API technical reference: {@link https://prismic.io/docs/asset-api-technical-reference}
 */
export class AssetClient {
	/** The Prismic repository's name. */
	repositoryName: string

	/** A Prismic write token that allows writing content to the repository. */
	writeToken: string

	/**
	 * The Prismic Asset API endpoint.
	 *
	 * @see Prismic Asset API technical reference: {@link https://prismic.io/docs/asset-api-technical-reference}
	 */
	assetAPIEndpoint = "https://asset-api.prismic.io/"

	/**
	 * The `fetch` function used to make network requests.
	 *
	 * @default The global `fetch` function.
	 */
	fetchFn: FetchLike

	/**
	 * The default `fetch` options sent with each Asset API request. These parameters can be overriden
	 * on each method.
	 */
	fetchOptions: RequestInitLike

	/**
	 * Creates a Prismic client that can be used to query and manage a repository's media library.
	 *
	 * @param repositoryName - The Prismic repository name for the repository.
	 * @param options - Configuration that determines how the Asset API is queried.
	 * @returns A client that can query and manage the repository's media library.
	 */
	constructor(repositoryName: string, options: AssetClientConfig) {
		const {
			writeToken,
			assetAPIEndpoint,
			fetchOptions = {},
			fetch = globalThis.fetch?.bind(globalThis),
		} = options

		if (typeof globalThis.window !== "undefined") {
			console.warn(
				"[@lihbr/prismic-asset-client] Prismic asset client appears to be running in a browser environment. This is not recommended as it exposes your write token. Consider using Prismic asset client in a server environment only.",
			)
		}

		if (!fetch) {
			throw new PrismicError(
				"A valid fetch implementation was not provided. In environments where fetch is not available, a fetch implementation must be provided via a polyfill or the `fetch` option.",
				undefined,
				undefined,
			)
		}
		if (typeof fetch !== "function") {
			throw new PrismicError(
				`fetch must be a function, but received: ${typeof fetch}`,
				undefined,
				undefined,
			)
		}

		this.repositoryName = repositoryName
		this.writeToken = writeToken
		this.fetchOptions = fetchOptions
		this.fetchFn = fetch

		if (assetAPIEndpoint) {
			this.assetAPIEndpoint = assetAPIEndpoint.endsWith("/")
				? assetAPIEndpoint
				: `${assetAPIEndpoint}/`
		}
	}

	/**
	 * Queries a page of assets from the repository's media library. Assets are ordered from newest to
	 * oldest, or by relevance when searching.
	 *
	 * @example
	 * 	;```ts
	 * 	const page = await client.getAssets({ assetType: "image", pageSize: 50 })
	 * 	const nextPage = await client.getAssets({ assetType: "image", pageSize: 50, cursor: page.cursor })
	 * 	```
	 *
	 * @param params - Parameters to filter and paginate assets, and additional fetch parameters.
	 * @returns A page of assets and a cursor to query the next page.
	 */
	async getAssets(params: GetAssetsParams & FetchParams = {}): Promise<GetAssetsResult> {
		const { pageSize, cursor, assetType, keyword, tags, uploaderID, aiDescription, aiKeywords } =
			params

		const url = new URL("assets", this.assetAPIEndpoint)
		const searchParams = {
			limit: pageSize?.toString(),
			cursor,
			assetType,
			keyword,
			uploaderId: uploaderID,
			aiDescription,
			aiKeywords,
		}
		for (const [key, value] of Object.entries(searchParams)) {
			if (value !== undefined) {
				url.searchParams.set(key, value)
			}
		}
		for (const tag of tags ?? []) {
			url.searchParams.append("tags", tag)
		}

		return await this.#getAssets(url, params)
	}

	/**
	 * Queries an asset from the repository's media library by its ID.
	 *
	 * @example
	 * 	;```ts
	 * 	const asset = await client.getAssetByID("ZestwpSZ31z-H2JI")
	 * 	```
	 *
	 * @param id - ID of the asset.
	 * @param params - Additional fetch parameters.
	 * @returns The asset with an ID matching the `id` parameter, if a matching asset exists.
	 * @throws {@link NotFoundError} If no asset with the given ID exists.
	 */
	async getAssetByID(id: string, params?: FetchParams): Promise<Asset> {
		const url = new URL("assets", this.assetAPIEndpoint)
		url.searchParams.set("ids", id)

		const { items } = await this.#getAssets(url, params)
		if (!items[0]) {
			throw new NotFoundError("No asset was returned", url.toString(), undefined)
		}

		return items[0]
	}

	/**
	 * Queries assets from the repository's media library by their IDs.
	 *
	 * @example
	 * 	;```ts
	 * 	const { items, missing_ids } = await client.getAssetsByIDs(["ZestwpSZ31z-H2JI", "ZestwpSZ31z-H2JJ"])
	 * 	```
	 *
	 * @param ids - IDs of the assets.
	 * @param params - Additional fetch parameters.
	 * @returns Assets with IDs matching the `ids` parameter, and the IDs that were not found.
	 */
	async getAssetsByIDs(ids: string[], params?: FetchParams): Promise<GetAssetsResult> {
		if (!ids.length) {
			return { items: [] }
		}

		const url = new URL("assets", this.assetAPIEndpoint)
		for (const id of ids) {
			url.searchParams.append("ids", id)
		}

		return await this.#getAssets(url, params)
	}

	/**
	 * **IMPORTANT**: Avoid using `dangerouslyGetAllAssets` as it may be slower and require more
	 * resources than other methods. Prefer using other methods that filter by keyword, type, or tags
	 * to only query the assets you need.
	 *
	 * Queries all assets from the repository's media library, following pagination cursors.
	 *
	 * @example
	 * 	;```ts
	 * 	const assets = await client.dangerouslyGetAllAssets({ assetType: "image" })
	 * 	```
	 *
	 * @param params - Parameters to filter, sort, and limit assets, and additional fetch parameters.
	 * @returns A list of all assets matching the parameters.
	 */
	async dangerouslyGetAllAssets(
		params: Omit<GetAssetsParams, "cursor"> & GetAllParams & FetchParams = {},
	): Promise<Asset[]> {
		const { limit = Infinity, ...actualParams } = params
		const resolvedParams = {
			...actualParams,
			pageSize: Math.min(limit, actualParams.pageSize || MAX_PAGE_SIZE),
		}

		const assets: Asset[] = []
		let latestResult: GetAssetsResult | undefined

		while ((!latestResult || latestResult.cursor) && assets.length < limit) {
			latestResult = await this.getAssets({ ...resolvedParams, cursor: latestResult?.cursor })
			assets.push(...latestResult.items)

			// The Asset API returns a cursor for every non-empty page, a short
			// page is the last one.
			if (latestResult.items.length < resolvedParams.pageSize) {
				break
			}

			if (latestResult.cursor && assets.length < limit) {
				await new Promise((res) => setTimeout(res, GET_ALL_QUERY_DELAY))
			}
		}

		return assets.slice(0, limit)
	}

	/**
	 * Uploads an asset to the repository's media library.
	 *
	 * @remarks
	 *   Assets are limited to 100 MB.
	 * @example
	 * 	;```ts
	 * 	const file = new Blob([await fs.readFile("./cat.png")], { type: "image/png" })
	 * 	const asset = await client.createAsset(file, "cat.png", { alt: "A cat" })
	 * 	```
	 *
	 * @param file - The file to upload as an asset.
	 * @param filename - The filename of the asset.
	 * @param params - Additional asset data and fetch parameters.
	 * @returns The created asset.
	 */
	async createAsset(
		file: PostAssetParams["file"] | File,
		filename: string,
		{ notes, credits, alt, tags, ...params }: CreateAssetParams & FetchParams = {},
	): Promise<Asset> {
		const url = new URL("assets", this.assetAPIEndpoint)

		const formData = new FormData()
		formData.append(
			"file",
			new File([file], filename, {
				type: file instanceof Blob ? file.type : undefined,
			}),
		)

		if (notes) {
			formData.append("notes", notes)
		}

		if (credits) {
			formData.append("credits", credits)
		}

		if (alt) {
			formData.append("alt", alt)
		}

		const response = await this.#request(url, params, {
			method: "POST",
			body: formData,
		})
		switch (response.status) {
			case 200: {
				const asset = (await response.json()) as PostAssetResult

				if (tags && tags.length) {
					return this.updateAsset(asset.id, { tags, ...params })
				}

				return asset
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Updates an asset in the repository's media library.
	 *
	 * @example
	 * 	;```ts
	 * 	const asset = await client.updateAsset("ZestwpSZ31z-H2JI", { alt: "A cat" })
	 * 	```
	 *
	 * @param id - The ID of the asset to update.
	 * @param params - The asset data to update and additional fetch parameters. `tags` replaces all
	 *   of the asset's tags.
	 * @returns The updated asset.
	 */
	async updateAsset(
		id: string,
		{ notes, credits, alt, filename, tags, ...params }: PatchAssetParams & FetchParams = {},
	): Promise<Asset> {
		const url = new URL(`assets/${encodeURIComponent(id)}`, this.assetAPIEndpoint)

		const response = await this.#request(url, params, {
			method: "PATCH",
			body: JSON.stringify({
				notes,
				credits,
				alt,
				filename,
				tags,
			}),
			headers: {
				"content-type": "application/json",
			},
		})
		switch (response.status) {
			case 200: {
				return (await response.json()) as PatchAssetResult
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Deletes an asset from the repository's media library.
	 *
	 * @remarks
	 *   Deleting assets used in published pages results in broken files.
	 * @example
	 * 	;```ts
	 * 	await client.deleteAsset("ZestwpSZ31z-H2JI")
	 * 	```
	 *
	 * @param id - The ID of the asset to delete.
	 * @param params - Additional fetch parameters.
	 */
	async deleteAsset(id: string, params?: FetchParams): Promise<void> {
		const url = new URL(`assets/${encodeURIComponent(id)}`, this.assetAPIEndpoint)

		const response = await this.#request(url, params, { method: "DELETE" })
		switch (response.status) {
			case 204: {
				return
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Deletes assets from the repository's media library.
	 *
	 * @remarks
	 *   Deleting assets used in published pages results in broken files. The request succeeds if at
	 *   least one of the assets exists.
	 * @example
	 * 	;```ts
	 * 	await client.deleteAssets(["ZestwpSZ31z-H2JI", "ZestwpSZ31z-H2JJ"])
	 * 	```
	 *
	 * @param ids - The IDs of the assets to delete.
	 * @param params - Additional fetch parameters.
	 */
	async deleteAssets(ids: string[], params?: FetchParams): Promise<void> {
		if (!ids.length) {
			return
		}

		const url = new URL("assets/bulk-delete", this.assetAPIEndpoint)

		const response = await this.#request(url, params, {
			method: "POST",
			body: JSON.stringify({ ids }),
			headers: {
				"content-type": "application/json",
			},
		})
		switch (response.status) {
			case 204: {
				return
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Queries all tags from the repository's media library.
	 *
	 * @example
	 * 	;```ts
	 * 	const tags = await client.getTags()
	 * 	```
	 *
	 * @param params - Additional fetch parameters.
	 * @returns A list of all tags, with their asset count.
	 */
	async getTags(params?: FetchParams): Promise<AssetTag[]> {
		const url = new URL("tags", this.assetAPIEndpoint)

		const response = await this.#request(url, params)
		switch (response.status) {
			case 200: {
				const json = (await response.json()) as GetAssetTagsResult

				return json.items
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Creates a tag in the repository's media library.
	 *
	 * @remarks
	 *   Tag names must be unique and between 1 and 20 characters long.
	 * @example
	 * 	;```ts
	 * 	const tag = await client.createTag("cats")
	 * 	```
	 *
	 * @param name - The name of the tag to create.
	 * @param params - Additional fetch parameters.
	 * @returns The created tag.
	 */
	async createTag(name: string, params?: FetchParams): Promise<AssetTag> {
		const url = new URL("tags", this.assetAPIEndpoint)

		const response = await this.#request(url, params, {
			method: "POST",
			body: JSON.stringify({ name }),
			headers: {
				"content-type": "application/json",
			},
		})
		switch (response.status) {
			case 201: {
				return (await response.json()) as PostAssetTagResult
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Renames a tag in the repository's media library.
	 *
	 * @remarks
	 *   Tag names must be unique and between 1 and 20 characters long.
	 * @example
	 * 	;```ts
	 * 	const tag = await client.updateTag("2c6f0f9e-…", "dogs")
	 * 	```
	 *
	 * @param id - The ID of the tag to update.
	 * @param name - The new name of the tag.
	 * @param params - Additional fetch parameters.
	 * @returns The updated tag.
	 */
	async updateTag(id: string, name: string, params?: FetchParams): Promise<AssetTag> {
		const url = new URL(`tags/${encodeURIComponent(id)}`, this.assetAPIEndpoint)

		const response = await this.#request(url, params, {
			method: "PATCH",
			body: JSON.stringify({ name }),
			headers: {
				"content-type": "application/json",
			},
		})
		switch (response.status) {
			case 200: {
				return (await response.json()) as PatchAssetTagResult
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Deletes a tag from the repository's media library. Assets with the tag are kept.
	 *
	 * @example
	 * 	;```ts
	 * 	await client.deleteTag("2c6f0f9e-…")
	 * 	```
	 *
	 * @param id - The ID of the tag to delete.
	 * @param params - Additional fetch parameters.
	 */
	async deleteTag(id: string, params?: FetchParams): Promise<void> {
		const url = new URL(`tags/${encodeURIComponent(id)}`, this.assetAPIEndpoint)

		const response = await this.#request(url, params, { method: "DELETE" })
		switch (response.status) {
			case 204: {
				return
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Adds a tag to assets in the repository's media library.
	 *
	 * @example
	 * 	;```ts
	 * 	await client.assignTagToAssets("2c6f0f9e-…", ["ZestwpSZ31z-H2JI"])
	 * 	```
	 *
	 * @param tagID - The ID of the tag to add.
	 * @param assetIDs - The IDs of the assets to tag.
	 * @param params - Additional fetch parameters.
	 */
	async assignTagToAssets(tagID: string, assetIDs: string[], params?: FetchParams): Promise<void> {
		const url = new URL(`tags/${encodeURIComponent(tagID)}/assets`, this.assetAPIEndpoint)

		const response = await this.#request(url, params, {
			method: "POST",
			body: JSON.stringify({ assetIds: assetIDs }),
			headers: {
				"content-type": "application/json",
			},
		})
		switch (response.status) {
			case 204: {
				return
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Removes a tag from assets in the repository's media library.
	 *
	 * @example
	 * 	;```ts
	 * 	await client.unassignTagFromAssets("2c6f0f9e-…", ["ZestwpSZ31z-H2JI"])
	 * 	```
	 *
	 * @param tagID - The ID of the tag to remove.
	 * @param assetIDs - The IDs of the assets to untag.
	 * @param params - Additional fetch parameters.
	 */
	async unassignTagFromAssets(
		tagID: string,
		assetIDs: string[],
		params?: FetchParams,
	): Promise<void> {
		const url = new URL(`tags/${encodeURIComponent(tagID)}/assets`, this.assetAPIEndpoint)

		const response = await this.#request(url, params, {
			method: "DELETE",
			body: JSON.stringify({ assetIds: assetIDs }),
			headers: {
				"content-type": "application/json",
			},
		})
		switch (response.status) {
			case 204: {
				return
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Queries all users who uploaded assets to the repository's media library.
	 *
	 * @param params - Additional fetch parameters.
	 * @returns A list of all uploaders.
	 * @internal
	 */
	async getUploaders(params?: FetchParams): Promise<AssetUploader[]> {
		const url = new URL("uploaders", this.assetAPIEndpoint)

		const response = await this.#request(url, params)
		switch (response.status) {
			case 200: {
				const json = (await response.json()) as GetAssetUploadersResult

				return json.items
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Queries assets from the Asset API.
	 *
	 * @param url - The `/assets` URL to query, including search parameters.
	 * @param params - Additional fetch parameters.
	 * @returns The queried assets.
	 */
	async #getAssets(url: URL, params?: FetchParams): Promise<GetAssetsResult> {
		const response = await this.#request(url, params)
		switch (response.status) {
			case 200: {
				return (await response.json()) as GetAssetsResult
			}
			default: {
				return await this.#handleAssetAPIError(response)
			}
		}
	}

	/**
	 * Makes an authenticated HTTP request to the Asset API using the client's configured fetch
	 * function and options.
	 *
	 * @param url - The URL to request.
	 * @param params - Fetch options from the user.
	 * @param init - Additional fetch options to merge with the user-provided options.
	 * @returns The response from the fetch request.
	 */
	async #request(url: URL, params?: FetchParams, init?: RequestInitLike): Promise<ResponseLike> {
		return await request(
			url,
			{
				...this.fetchOptions,
				...params?.fetchOptions,
				...init,
				headers: {
					...this.fetchOptions?.headers,
					...params?.fetchOptions?.headers,
					...init?.headers,
					repository: this.repositoryName,
					authorization: `Bearer ${this.writeToken}`,
				},
				signal: params?.fetchOptions?.signal || this.fetchOptions?.signal,
			},
			this.fetchFn,
		)
	}

	/**
	 * Handles error responses from the Asset API.
	 *
	 * @param response - The HTTP response from the Asset API.
	 * @throws {@link InvalidDataError} For 400 and 413 errors.
	 * @throws {@link ForbiddenError} For 401 and 403 errors.
	 * @throws {@link NotFoundError} For 404 errors.
	 * @throws {@link PrismicError} For 500 and other unexpected errors.
	 */
	async #handleAssetAPIError(response: ResponseLike): Promise<never> {
		let payload: AssetAPIErrorResponse | undefined
		try {
			payload = JSON.parse(await response.text())
		} catch {
			// noop, non-JSON payloads come from gateways and are not exposed
		}

		const message = getErrorMessage(payload)

		switch (response.status) {
			case 400:
			case 413: {
				throw new InvalidDataError(message, response.url, payload)
			}

			case 401:
			case 403: {
				throw new ForbiddenError(message, response.url, payload)
			}

			case 404: {
				throw new NotFoundError(message, response.url, payload)
			}

			case 500:
			default: {
				throw new PrismicError(message, response.url, payload)
			}
		}
	}
}

/**
 * Resolves a human-readable message from an Asset API error payload.
 *
 * @param payload - The error payload.
 * @returns The error message, if any.
 */
function getErrorMessage(payload: unknown): string | undefined {
	if (typeof payload !== "object" || payload === null) {
		return
	}

	const { message, error, details, code } = payload as AssetAPIErrorResponse

	if (typeof message === "string") {
		return message
	}

	if (typeof error === "string") {
		return typeof details === "string" ? `${error}: ${details}` : error
	}

	if (typeof code === "string") {
		return code
	}
}
