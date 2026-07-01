// Shopify Storefront API client. (ba_spec_v2 §13)
// Pulls products, collections, variants. Token comes from .env (never commit it).
// Skeleton: fill in the GraphQL queries.

const DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;      // e.g. blackaestheticspk.myshopify.com
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = '2024-01';

export async function shopifyQuery(query, variables = {}) {
  if (!DOMAIN || !TOKEN) {
    console.warn('[BA] Shopify env vars missing — see .env.example');
    return null;
  }
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json.data;
}

// Maps Shopify variant/option values → texture or GLB swap. Maintained manually
// as products are added (ba_spec_v2 §13). Keep in sync with docs/ASSETS.md.
export const variantToAsset = {
  // 'variantId-or-option': '/assets/textures/foo.ktx2',
};
