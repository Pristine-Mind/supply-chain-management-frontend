#!/usr/bin/env node
/**
 * Dynamic Sitemap Generator
 * Fetches products, sellers, categories, and blog posts from the API
 * and writes public/sitemap.xml before each production build.
 *
 * Usage:  node scripts/generate-sitemap.js
 * Run automatically via:  npm run build  (see package.json prebuild script)
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://appmulyabazzar.com';
// The API base can be overridden at build time:
//   SITEMAP_API_BASE=https://appmulyabazzar.com node scripts/generate-sitemap.js
const API_BASE = process.env.SITEMAP_API_BASE || process.env.VITE_REACT_APP_API_URL || BASE_URL;
const TODAY = new Date().toISOString().split('T')[0];
const FETCH_TIMEOUT_MS = 15000;

// ─── Helpers ───────────────────────────────────────────────────────────────

function url(loc, { lastmod = TODAY, changefreq = 'weekly', priority = '0.7' } = {}) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function fetchJSON(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const fullUrl = `${API_BASE}${endpoint}${query ? '?' + query : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(fullUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`⚠ Timeout fetching ${endpoint}`);
    } else {
      console.warn(`⚠ Skipping ${endpoint}: ${err.message}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ─── Static pages ──────────────────────────────────────────────────────────

const STATIC_URLS = [
  url(`${BASE_URL}/`,             { changefreq: 'daily',   priority: '1.0' }),
  url(`${BASE_URL}/deals`,        { changefreq: 'daily',   priority: '0.9' }),
  url(`${BASE_URL}/flash-sale`,   { changefreq: 'daily',   priority: '0.9' }),
  url(`${BASE_URL}/featured`,     { changefreq: 'weekly',  priority: '0.8' }),
  url(`${BASE_URL}/marketplace/all-products`, { changefreq: 'daily', priority: '0.8' }),
  url(`${BASE_URL}/creators`,     { changefreq: 'weekly',  priority: '0.7' }),
  url(`${BASE_URL}/blog`,         { changefreq: 'weekly',  priority: '0.7' }),
  url(`${BASE_URL}/sell`,         { changefreq: 'monthly', priority: '0.7' }),
  url(`${BASE_URL}/transporters`, { changefreq: 'monthly', priority: '0.6' }),
  url(`${BASE_URL}/about`,        { changefreq: 'monthly', priority: '0.6' }),
  url(`${BASE_URL}/contact`,      { changefreq: 'monthly', priority: '0.6' }),
  url(`${BASE_URL}/faq`,          { changefreq: 'monthly', priority: '0.5' }),
  url(`${BASE_URL}/shipping`,     { changefreq: 'monthly', priority: '0.5' }),
  url(`${BASE_URL}/returns`,      { changefreq: 'monthly', priority: '0.5' }),
];

// ─── Dynamic pages ─────────────────────────────────────────────────────────

/**
 * Fetches all pages using limit/offset pagination.
 * Caps at maxItems to avoid sitemap size limits (50k URL max).
 */
async function fetchAllPages(endpoint, maxItems = 5000) {
  const results = [];
  const pageSize = 100;
  let offset = 0;

  while (results.length < maxItems) {
    const data = await fetchJSON(endpoint, { limit: pageSize, offset });
    if (!data) break;
    const items = data.results ?? (Array.isArray(data) ? data : []);
    results.push(...items);
    if (!data.next || items.length === 0) break;
    offset += pageSize;
  }
  return results;
}

async function buildProductURLs() {
  console.log('  Fetching products...');
  const products = await fetchAllPages('/api/v1/marketplace/', 5000);
  console.log(`  → ${products.length} products`);
  return products.map(p =>
    url(`${BASE_URL}/marketplace/${p.id}`, { changefreq: 'weekly', priority: '0.8' })
  );
}

async function buildCategoryURLs() {
  console.log('  Fetching categories...');
  const data = await fetchJSON('/api/v1/categories/', { page_size: 200 });
  const categories = data?.results ?? (Array.isArray(data) ? data : []);
  const entries = [];

  for (const cat of categories) {
    const slug = createSlug(cat.name);
    entries.push(url(`${BASE_URL}/marketplace/categories/${slug}`, { changefreq: 'weekly', priority: '0.7' }));

    // Subcategories — returns plain array
    const subs = await fetchJSON(`/api/v1/categories/${cat.id}/subcategories/`);
    const subList = Array.isArray(subs) ? subs : subs?.results ?? [];
    for (const sub of subList) {
      const subSlug = createSlug(sub.name);
      entries.push(url(`${BASE_URL}/marketplace/categories/${slug}/${subSlug}`, { changefreq: 'weekly', priority: '0.6' }));
    }
  }
  console.log(`  → ${entries.length} category URLs`);
  return entries;
}

async function buildSellerURLs() {
  console.log('  Fetching sellers...');
  const sellers = await fetchAllPages('/api/v1/seller-profiles/');
  console.log(`  → ${sellers.length} sellers`);
  return sellers
    .filter(s => s.username)
    .map(s => url(`${BASE_URL}/marketplace/seller/${s.username}`, { changefreq: 'weekly', priority: '0.7' }));
}

async function buildBlogURLs() {
  console.log('  Fetching blog posts...');
  const posts = await fetchAllPages('/blog/posts/');
  console.log(`  → ${posts.length} blog posts`);
  return posts.map(p =>
    url(`${BASE_URL}/blog/${p.id}`, {
      lastmod: p.updated_at ? p.updated_at.split('T')[0] : TODAY,
      changefreq: 'monthly',
      priority: '0.6',
    })
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function generate() {
  console.log(`🗺  Generating sitemap from ${API_BASE} ...`);

  const [productURLs, categoryURLs, sellerURLs, blogURLs] = await Promise.all([
    buildProductURLs(),
    buildCategoryURLs(),
    buildSellerURLs(),
    buildBlogURLs(),
  ]);

  const allURLs = [
    ...STATIC_URLS,
    ...categoryURLs,
    ...productURLs,
    ...sellerURLs,
    ...blogURLs,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${allURLs.join('\n')}

</urlset>
`;

  const outPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');

  console.log(`\n✅ sitemap.xml written — ${allURLs.length} total URLs`);
  console.log(`   Static:     ${STATIC_URLS.length}`);
  console.log(`   Categories: ${categoryURLs.length}`);
  console.log(`   Products:   ${productURLs.length}`);
  console.log(`   Sellers:    ${sellerURLs.length}`);
  console.log(`   Blog posts: ${blogURLs.length}`);
}

generate().catch(err => {
  console.error('❌ Sitemap generation failed:', err);
  process.exit(1);
});

