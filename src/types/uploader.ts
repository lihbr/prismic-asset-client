/**
 * An object representing a user who uploaded assets to the Asset API.
 *
 * @internal
 */
export type AssetUploader = {
	/** Uploader ID, `"ghost"` for anonymous uploads. */
	id: string
}

/**
 * An object representing the result of querying uploaders from the Asset API.
 *
 * @internal
 */
export type GetAssetUploadersResult = { items: AssetUploader[] }
