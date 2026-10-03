import { deepEqual } from "node:assert/strict"

import type { MockInstance } from "vitest"
import { afterEach, beforeEach, expect, vi } from "vitest"

import { AssetClient } from "../src"

beforeEach(() => {
	vi.spyOn(console, "log").mockImplementation(() => {})
	vi.spyOn(console, "warn").mockImplementation(() => {})
})

afterEach(() => {
	vi.resetAllMocks()
	vi.useRealTimers()
})

expect.extend({
	toHaveFetchedAssetAPI(client: unknown, path, expectedParams, expectedInit = {}) {
		assertMockedClient(client)

		const parsedExpectedParams = new URLSearchParams(expectedParams)

		const pass = vi.mocked(client.fetchFn).mock.calls.some(([url, init]) => {
			const urlMatches =
				filterURLParams(url, Array.from(parsedExpectedParams.keys())).toString() ===
				getAssetAPIURL(client, path, parsedExpectedParams).toString()
			const initMatches = isDeepEqual(
				filterRequestInit(init, Object.keys(expectedInit)),
				expectedInit,
			)

			return urlMatches && initMatches
		})

		return {
			pass,
			message: () =>
				`Client ${!pass || !this.isNot ? "did not call" : "called"} the Asset API \`${path}\`${parsedExpectedParams.size > 0 ? ` with the required params` : ""}`,
		}
	},
	toHaveLastFetchedAssetAPI(client: unknown, path, expectedParams, expectedInit = {}) {
		assertMockedClient(client)
		assertHasBeenCalled(client.fetchFn)

		const parsedExpectedParams = new URLSearchParams(expectedParams)
		const [url, init] = client.fetchFn.mock.lastCall

		const urlMatches =
			filterURLParams(url, Array.from(parsedExpectedParams.keys())).toString() ===
			getAssetAPIURL(client, path, parsedExpectedParams).toString()
		const initMatches = isDeepEqual(
			filterRequestInit(init, Object.keys(expectedInit)),
			expectedInit,
		)
		const pass = urlMatches && initMatches

		const actual = new Request(
			filterURLParams(url, Array.from(parsedExpectedParams.keys())),
			filterRequestInit(init, Object.keys(expectedInit)),
		)
		const expected = new Request(getAssetAPIURL(client, path, parsedExpectedParams), expectedInit)

		return {
			pass,
			message: () =>
				`The client ${!pass || !this.isNot ? "did not last call" : "last called"} the Asset API \`${path}\`${parsedExpectedParams.size > 0 || Object.keys(expectedInit).length > 0 ? ` with the expected parameters` : ""}`,
			actual: stringifyRequest(actual),
			expected: stringifyRequest(expected),
		}
	},
	toHaveFetchedAssetAPITimes(client: unknown, expected) {
		assertMockedClient(client)

		const actual = vi
			.mocked(client.fetchFn)
			.mock.calls.filter(([url]) => new URL(url).href.startsWith(client.assetAPIEndpoint)).length

		return {
			pass: actual === expected,
			message: () => `Client fetched Asset API ${actual} time${actual === 1 ? "" : "s"}.`,
			actual,
			expected,
		}
	},
})

function assertMockedClient(
	input: unknown,
): asserts input is AssetClient & { fetchFn: MockInstance<AssetClient["fetchFn"]> } {
	if (!(input instanceof AssetClient) || !vi.isMockFunction(input.fetchFn)) {
		throw new Error("Not a mocked Prismic asset client")
	}
}

function assertHasBeenCalled(mock: MockInstance): asserts mock is typeof mock & {
	mock: { lastCall: NonNullable<typeof mock.mock.lastCall> }
} {
	if (!mock.mock.lastCall) {
		throw new Error("The mock was never called")
	}
}

function getAssetAPIURL(
	client: AssetClient,
	path: string,
	params?: ConstructorParameters<typeof URLSearchParams>[0],
): URL {
	const url = new URL(path, client.assetAPIEndpoint)
	url.search = new URLSearchParams(params).toString()

	return url
}

function filterURLParams(url: string | URL, keys: string[]) {
	url = new URL(url)

	const res = new URL(url.pathname, url.origin)
	for (const key of new Set(keys)) {
		for (const value of url.searchParams.getAll(key)) {
			res.searchParams.append(key, value)
		}
	}

	return res
}

function filterRequestInit<T extends RequestInit>(
	init: T | undefined,
	keys: (keyof T | (string & Record<never, never>))[],
) {
	return Object.fromEntries(
		Object.entries(init ?? {}).filter(([key]) => keys.includes(key as keyof T)),
	)
}

function stringifyRequest(request: Request) {
	const obj = {
		url: request.url,
		method: request.method,
		cache: request.cache,
		headers: Object.fromEntries([...request.headers].sort()),
		signal: { aborted: request.signal.aborted },
		body: request.body?.toString(),
	}

	return JSON.stringify(obj, null, 2)
}

function isDeepEqual<T>(actual: unknown, expected: T): expected is T {
	try {
		deepEqual(actual, expected)

		return true
	} catch {
		return false
	}
}
