# SHOPIFY_PRODUCT_ALIGNMENT_TASK

> Launch-critical task for Claude / Shopify MCP.

## Goal

Create a workspace file that maps live Shopify products and collection ordering to the local
assets already available in this repo, so the 3D storefront can launch with real handles,
prices, variants, collection membership, and product ordering without modeling every product.

## Current state

- `docs/CATALOG.md` has the Shopify collection list pulled on 2026-06-22.
- No per-product live Shopify export/mapping file was found in the workspace.
- `src/data/catalog.js` currently uses curated local products from:
  - `public/products/wall-art/`
  - `public/products/digital/final/`
  - `public/products/layered/svg/`
  - `public/products/3d/`
- Wall Art and Digital Art now browse through local subcollections, but membership is keyword
  based until live Shopify product data is mapped.

## Required output file

Create `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` with this shape:

```json
{
  "generated_at": "YYYY-MM-DD",
  "source": "Shopify Admin MCP",
  "collections": [
    {
      "shopify_collection_title": "Naruto",
      "shopify_collection_handle": "naruto",
      "nav_category_id": "digital-art",
      "sort_order": 1,
      "products": [
        {
          "shopify_title": "Naruto In The Dark",
          "shopify_handle": "naruto-in-the-dark",
          "shopify_product_id": "gid://shopify/Product/...",
          "available": true,
          "price": "PKR 2,500",
          "variant_ids": ["gid://shopify/ProductVariant/..."],
          "local_product_id": "digital-naruto-in-the-dark",
          "local_asset": "/products/digital/final/naruto-in-the-dark.jpg",
          "match_confidence": "exact"
        }
      ]
    }
  ],
  "unmatched_shopify_products": [],
  "unmatched_local_products": []
}
```

## Matching rules

1. Match by normalized title/handle first.
2. Then match by filename slug in `public/products/**`.
3. Preserve Shopify collection sort order.
4. Only map products whose local assets already exist.
5. Put live products with no local asset in `unmatched_shopify_products`.
6. Put local assets/products not found in Shopify in `unmatched_local_products`.

## After file exists

Codex should update `src/data/catalog.js` to consume or mirror this alignment so:

- Subcollection names/handles match Shopify collections.
- Product order follows Shopify.
- Product handles and variant IDs are available for checkout wiring.
- Placeholder keyword membership can be removed.
