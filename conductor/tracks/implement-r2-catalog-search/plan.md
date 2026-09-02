# Plan: Implement R2 Catalog Search

## Phase 1: Setup & Typing
- [x] Define interfaces for `Product` and `Category` in `shared/catalog.ts`.
- [x] Ensure `wrangler.jsonc` has the correct `r2_buckets` binding.

## Phase 2: Service Implementation
- [x] Update `server/services/cascade-engine.ts` to include R2 retrieval logic.
- [x] Implement `searchCatalog` function using the R2 binding.

## Phase 3: Integration & Testing
- [x] Expose search functionality via a new API endpoint (or integrate into existing).
- [x] Write a test in `server/tests/` to verify R2 data retrieval and search functionality (using mocks).
- [x] Validate search against real/mocked R2 data.
