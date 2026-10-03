import "vitest"

declare module "vitest" {
	export interface ProvidedContext {
		repositoryName: string
		writeToken: string
	}
}

interface CustomMatchers<R = unknown> {
	toHaveFetchedAssetAPI: (
		path: string,
		expectedParams?: ConstructorParameters<typeof URLSearchParams>[0],
		expectedInit?: RequestInit,
	) => R
	toHaveLastFetchedAssetAPI: (
		path: string,
		expectedParams?: ConstructorParameters<typeof URLSearchParams>[0],
		expectedInit?: RequestInit,
	) => R
	toHaveFetchedAssetAPITimes: (expected: number) => R
}

declare module "vitest" {
	interface Matchers<T> extends CustomMatchers<T> {}
}
