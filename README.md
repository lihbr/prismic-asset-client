# @lihbr/prismic-asset-client

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A JavaScript and TypeScript client for the [Prismic][prismic] [Asset API][asset-api-docs].

> [!NOTE]
> This is a community package. Prismic does not maintain or support it.

## Install

```bash
npm install @lihbr/prismic-asset-client
```

## Documentation

```ts
import {
	createAssetClient,
	ForbiddenError, // 401, 403: missing or invalid token, no repository access
	InvalidDataError, // 400, 413: malformed query or body, unknown tags, duplicate tag name, file over 100 MB
	NotFoundError, // 404: unknown asset or tag
	PrismicError, // anything else, all errors extend it and expose `url` and the API's `response`
} from "@lihbr/prismic-asset-client"

const client = createAssetClient("my-repo", {
	writeToken: "***", // required, sent as `Authorization: Bearer` with a `repository` header
	assetAPIEndpoint?: "https://asset-api.prismic.io/",
	fetch?: FetchLike, // defaults to globalThis.fetch
	fetchOptions?: RequestInitLike,
})

// Every method also accepts `{ fetchOptions }` as its last argument.

// Assets
client.getAssets({ pageSize?, cursor?, assetType?, keyword?, tags?, uploaderID? }) // GET /assets → { items, total?, cursor?, missing_ids? }
client.getAssetByID(id)                       // GET /assets?ids= → Asset (throws NotFoundError if missing)
client.getAssetsByIDs(ids)                    // GET /assets?ids=… → { items, missing_ids? }
client.dangerouslyGetAllAssets({ limit?, ...getAssets params }) // follows the cursor → Asset[]
client.createAsset(file, filename, { notes?, credits?, alt?, tags? }) // POST /assets (plus a PATCH if tags are given) → Asset
client.updateAsset(id, { filename?, notes?, credits?, alt?, tags? })   // PATCH /assets/:id → Asset (tags replace the whole set)
client.deleteAsset(id)                        // DELETE /assets/:id
client.deleteAssets(ids)                      // POST /assets/bulk-delete

// Tags
client.getTags()                              // GET /tags → AssetTag[] (with count)
client.createTag(name)                        // POST /tags → AssetTag (1–20 chars)
client.updateTag(id, name)                    // PATCH /tags/:id → AssetTag
client.deleteTag(id)                          // DELETE /tags/:id
client.assignTagToAssets(tagID, assetIDs)     // POST /tags/:id/assets
client.unassignTagFromAssets(tagID, assetIDs) // DELETE /tags/:id/assets

// Uploaders
client.getUploaders()                         // GET /uploaders → { id }[]
```

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
