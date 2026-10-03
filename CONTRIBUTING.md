# Contributing

This package is maintained by [lihbr](https://lihbr.com). It is a community package, not maintained by Prismic. Ask for help by [opening an issue](https://github.com/lihbr/prismic-asset-client/issues/new/choose), or request a review by opening a pull request.

## Setup

The following setup is required to work on this project:

- Node.js 22 or later
- npm CLI
- A Prismic account dedicated to tests

## Project-specific notes

Tests run against the real Asset API. The global setup creates a throwaway repository with the Prismic account from `.env.test.local`, and deletes it once tests finish. Copy `.env.test.example` to `.env.test.local` and fill in the account's credentials before running tests.

Each test creates the assets and tags it needs. Filter queries by a test-specific tag to keep tests independent of each other. Mock `fetch` responses only for cases the API can't produce on demand, such as server errors.

The client mirrors [`@prismicio/client`](https://github.com/prismicio/prismic-client). Follow its conventions when adding methods: one method per endpoint, a trailing `params` argument that accepts `fetchOptions`, and the same error classes.

## Develop

```sh
# Clone and prepare the project.
git clone git@github.com:lihbr/prismic-asset-client.git
cd prismic-asset-client
npm install

# Create a new branch for your changes (e.g. lh/fix-win32-paths).
git checkout -b <your-initials>/<feature-or-fix-description>

# Start the development watcher.
# Run this command while you are working on your changes.
node --run dev

# Build the project for production.
# Run this command when you want to see the production version.
node --run build

# Lint your changes before requesting a review. No errors are allowed.
node --run lint
# Some errors can be fixed automatically:
node --run lint -- --fix

# Format your changes before requesting a review. No errors are allowed.
node --run format

# Test your changes before requesting a review.
# All changes should be tested. No failing tests are allowed.
node --run test
# Run only unit tests (optionally in watch mode):
node --run unit
node --run unit:watch
# Run only type tests
node --run types
```

## Submit a pull request

```sh
# Open a pull request. This example uses the GitHub CLI.
gh pr create

# Prereleases are published to npm automatically upon pushing commits.
# Install the prerelease using the `pr-${number}` tag.
npm install @lihbr/prismic-asset-client@pr-101

# When ready, PRs should be merged using the "Squash and merge" option.
```

## Publish

This repository uses [Release Please](https://github.com/googleapis/release-please). To publish changes in `main`, merge [the pending Release Please PR](https://github.com/lihbr/prismic-asset-client/pulls?q=is%3Apr+is%3Aopen+label%3A%22autorelease%3A+pending%22).

If you don't see a pending PR, there are no changes to publish from `main`.
