# SHOPIFY_PRODUCT_ALIGNMENT_TASK

> Historical launch-critical task for Claude / Shopify MCP.
> Completed on 2026-07-12; kept here as the regeneration contract.

## Goal

Create a workspace file that maps live Shopify products and collection ordering to the local
assets already available in this repo, so the 3D storefront can launch with real handles,
prices, variants, collection membership, and product ordering without modeling every product.

## Current state

- `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` exists and was generated from Shopify Admin MCP on 2026-07-12.
- `docs/BA_PRODUCT_LOG.xlsx` exists with Summary / Shopify Live Products / 3D Website Products /
  Collections / Unmatched sheets.
- `src/data/shopifyVariants.js` mirrors exact live variant options, prices, handles, and GIDs for
  matched local products.
- `src/data/catalog.js` currently uses curated local products from:
  - `public/products/wall-art/`
  - `public/products/digital/final/`
  - `public/products/layered/svg/`
  - `public/products/3d/`
- Wall Art and Digital Art browse through curated local subcollections; product handles/prices for
  matched products now come from live Shopify data.

## Required output file

When regenerating, create `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` with this shape:

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

## After regeneration

Codex should keep `src/data/catalog.js` and `src/data/shopifyVariants.js` aligned so:

- Subcollection names/handles match Shopify collections.
- Product order follows Shopify.
- Product handles and variant IDs are available for checkout wiring.
- Site-side Thickness/Material options follow D53 until Master Khurram approves pushing those
  options into Shopify.
