import type { AssetClientConfig } from "./AssetClient"
import { AssetClient } from "./AssetClient"

/**
 * Type definitions for the `createAssetClient()` function. May be augmented by third-party
 * libraries.
 */
export interface CreateAssetClient {
	(...args: ConstructorParameters<typeof AssetClient>): AssetClient
}

/**
 * Creates a Prismic client that can be used to query and manage a repository's media library
 * through the Asset API.
 *
 * @remarks
 *   This client works in environments supporting File, Blob, and FormData, including Node.js 22 and
 *   later.
 * @example
 * 	;```ts
 * 	createAssetClient("qwerty", { writeToken: "***" })
 * 	```
 *
 * @param repositoryName - The Prismic repository name for the repository.
 * @param options - Configuration that determines how the Asset API is queried.
 * @returns A client that can query and manage the repository's media library.
 * @see Prismic Asset API technical reference: {@link https://prismic.io/docs/asset-api-technical-reference}
 */
export const createAssetClient: CreateAssetClient = (
	repositoryName: string,
	options: AssetClientConfig,
) => new AssetClient(repositoryName, options)
