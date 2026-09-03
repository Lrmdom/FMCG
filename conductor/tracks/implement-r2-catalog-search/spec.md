# Specification: R2 Catalog Search Implementation

## Objective
Enable the application to perform searches against product catalog data cached in Cloudflare R2 object storage.

## Requirements
1.  **Storage Access**: The system must securely access `asualoja-sanity-data-pt.json` from the `hono-pubsub-filesystem` R2 bucket using Cloudflare bindings.
2.  **Service Integration**: Implement `searchCatalog` in `server/services/cascade-engine.ts`.
3.  **Typing**: Ensure robust TypeScript types in `shared/catalog.ts` for catalog items.
4.  **Performance**: Optimize data retrieval (e.g., caching/lazy loading) to ensure fast search response times.
