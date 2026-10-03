# @lihbr/prismic-asset-client

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A JavaScript and TypeScript client for the [Prismic][prismic] [Asset API][asset-api-docs]. Upload, list, search, tag, and delete assets in a repository's media library.

It follows the conventions of [`@prismicio/client`][prismicio-client]: same factory function style, same error classes, same `fetch` options, same rate limit handling. It has no runtime dependencies.

> [!NOTE]
> This is a community package. Prismic does not maintain or support it.

## Install

```bash
npm install @lihbr/prismic-asset-client
```

## Usage

The client needs a repository name and a write token. Generate a write token in your repository settings, under _API & Security_.

```ts
import { createAssetClient } from "@lihbr/prismic-asset-client"

const client = createAssetClient("my-repo", {
	writeToken: process.env.PRISMIC_WRITE_TOKEN,
})

const { items, cursor } = await client.getAssets({ assetType: "image" })
```

Keep the write token on the server. The client logs a warning when it runs in a browser.

### Assets

```ts
// Query a page of assets, newest first.
const page = await client.getAssets({
	pageSize: 50,
	assetType: "image", // "all", "audio", "document", "image", or "video"
	keyword: "cat", // matches filenames, notes, credits, and alt texts
	tags: [tagID], // assets must have every tag
})
const nextPage = await client.getAssets({ pageSize: 50, cursor: page.cursor })

// Query assets by ID.
const asset = await client.getAssetByID("ZestwpSZ31z-H2JI")
const { items, missing_ids } = await client.getAssetsByIDs(["ZestwpSZ31z-H2JI", "invalid"])

// Query every asset, following cursors. Prefer filtering when you can.
const images = await client.dangerouslyGetAllAssets({ assetType: "image", limit: 500 })

// Upload an asset. `file` can be a Blob, a File, a string, an ArrayBuffer, or a typed array.
const file = new Blob([await fs.readFile("./cat.png")], { type: "image/png" })
const created = await client.createAsset(file, "cat.png", {
	alt: "A cat",
	credits: "Jane Doe",
	notes: "Taken in Paris",
	tags: [tagID],
})

// Update an asset. `tags` replaces all of the asset's tags.
await client.updateAsset(created.id, { filename: "cat-2.png", alt: "Another cat", tags: [] })

// Delete assets. Pages that use them will show broken files.
await client.deleteAsset(created.id)
await client.deleteAssets(["ZestwpSZ31z-H2JI", "ZestwpSZ31z-H2JJ"])
```

Uploads are limited to 100 MB per file. Notes, credits, and alt texts are limited to 500 characters each.

### Tags

Tags are referenced by ID everywhere. Names are unique and between 1 and 20 characters long.

```ts
const tags = await client.getTags() // includes each tag's asset count

const tag = await client.createTag("cats")
await client.updateTag(tag.id, "kittens")

await client.assignTagToAssets(tag.id, [assetID1, assetID2])
await client.unassignTagFromAssets(tag.id, [assetID2])

// Deleting a tag keeps its assets.
await client.deleteTag(tag.id)
```

### Fetch options

Every method accepts `fetchOptions`, merged on top of the client's own `fetchOptions`. Use them to pass headers, cache settings, or an abort signal.

```ts
const client = createAssetClient("my-repo", {
	writeToken,
	fetch: customFetch, // defaults to the global fetch function
	fetchOptions: { headers: { "x-foo": "bar" } },
})

const controller = new AbortController()
await client.getTags({ fetchOptions: { signal: controller.signal } })
```

### Errors

Failed requests throw one of the following errors. Each has the request `url` and the API's error payload as `response`.

| Error              | Status       | Example causes                                                     |
| ------------------ | ------------ | ------------------------------------------------------------------ |
| `InvalidDataError` | 400, 413     | Malformed query or body, unknown tag IDs, duplicate tag names      |
| `ForbiddenError`   | 401, 403     | Missing or invalid token, token for another repository             |
| `NotFoundError`    | 404          | Unknown asset or tag, or `getAssetByID()` without a matching asset |
| `PrismicError`     | Other status | Server and gateway errors. The other errors extend it              |

```ts
import { NotFoundError } from "@lihbr/prismic-asset-client"

try {
	await client.getAssetByID("invalid")
} catch (error) {
	if (error instanceof NotFoundError) {
		// ...
	}
}
```

### Rate limits

The Asset API rate limits requests per repository. The client waits 1.5 seconds between write requests to the same host, and retries requests that get a `429` response after the delay in their `retry-after` header. Concurrent identical read requests share a single network request.

## Contributing

Bug reports, ideas, and pull requests are welcome.

**Reporting a bug**: [Open an issue][repo-bug-report] explaining your application's setup and the bug you're encountering.

**Suggesting an improvement**: [Open an issue][repo-feature-request] explaining your improvement or feature so we can discuss and learn more.

**Submitting code changes**: For small fixes, feel free to [open a pull request][repo-pull-requests] with a description of your changes. For large changes, please first [open an issue][repo-feature-request] so we can discuss if and how the changes should be implemented.

See [CONTRIBUTING.md][contributing] to set up the project.

## License

[MIT][license]

<!-- Links -->

[prismic]: https://prismic.io
[asset-api-docs]: https://prismic.io/docs/asset-api-technical-reference
[prismicio-client]: https://github.com/prismicio/prismic-client
[contributing]: ./CONTRIBUTING.md
[license]: ./LICENSE
[repo-bug-report]: https://github.com/lihbr/prismic-asset-client/issues/new?assignees=&labels=bug&template=bug_report.md&title=
[repo-feature-request]: https://github.com/lihbr/prismic-asset-client/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=
[repo-pull-requests]: https://github.com/lihbr/prismic-asset-client/pulls

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lihbr/prismic-asset-client/latest.svg
[npm-version-href]: https://npmjs.com/package/@lihbr/prismic-asset-client
[npm-downloads-src]: https://img.shields.io/npm/dm/@lihbr/prismic-asset-client.svg
[npm-downloads-href]: https://npmjs.com/package/@lihbr/prismic-asset-client
