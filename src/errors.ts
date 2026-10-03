/**
 * An error payload returned by the Asset API. Its shape varies between endpoints and the gateways
 * in front of the API.
 */
export type AssetAPIErrorResponse = {
	/** A human-readable error message. */
	message?: string

	/** An error message or code, e.g. `"invalid_token"`. */
	error?: string

	/** Additional details about `error`. */
	details?: string

	/** An error code, e.g. `"malformed_body"`. */
	code?: string

	/** Additional details about `code`, such as validation issues. */
	detail?: unknown
}

export class PrismicError<TResponse> extends Error {
	url?: string
	response: TResponse

	constructor(
		message = "An invalid API response was returned",
		url: string | undefined,
		response: TResponse,
	) {
		super(message)

		this.url = url
		this.response = response
	}
}

export class ForbiddenError<
	TResponse = AssetAPIErrorResponse | undefined,
> extends PrismicError<TResponse> {}

export class NotFoundError<
	TResponse = AssetAPIErrorResponse | undefined,
> extends PrismicError<TResponse> {}

export class InvalidDataError<
	TResponse = AssetAPIErrorResponse | undefined,
> extends PrismicError<TResponse> {}
