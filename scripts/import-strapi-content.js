/**
 * Import Strapi v3 content into Strapi v4
 *
 * Usage:
 *   node import-strapi-content.js <export-file> <strapi-url> <api-token>
 *
 * Example:
 *   node import-strapi-content.js /tmp/strapi-content-export.json https://staging.newcontent.gogroom.co.uk <token>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const EXPORT_FILE = process.argv[2] || '/tmp/strapi-content-export.json';
const STRAPI_URL = process.argv[3] || 'https://staging.newcontent.gogroom.co.uk';
const API_TOKEN = process.argv[4] || '';

if (!API_TOKEN) {
  console.error('Usage: node import-strapi-content.js <export-file> <strapi-url> <api-token>');
  process.exit(1);
}

// Map v3 table names to v4 API endpoints
// Collection types use POST, single types use PUT
const CONTENT_TYPE_MAP = {
  // Collection types (multiple entries)
  'groomin_guides': { endpoint: 'groomin-guides', type: 'collection' },
  'team_members': { endpoint: 'team-members', type: 'collection' },
  'homepage_banners': { endpoint: 'homepage-banners', type: 'collection' },
  'policies': { endpoint: 'policies', type: 'collection' },
  'testimonials': { endpoint: 'testimonials', type: 'collection' },

  // Single types (one entry only) - use PUT
  'general_images': { endpoint: 'general-image', type: 'single' },
  'homepage_three_offers': { endpoint: 'homepage-three-offer', type: 'single' },
  'all_products_images': { endpoint: 'all-products-image', type: 'single' },
  'bundle_main_images': { endpoint: 'bundle-main-image', type: 'single' },
  'contact_us_pages': { endpoint: 'contact-us-page', type: 'single' },
  'about_us_pages': { endpoint: 'about-us-page', type: 'single' },
  'homepage_features': { endpoint: 'homepage-feature', type: 'single' },
  'homepage_featured_section_ones': { endpoint: 'homepage-featured-section-one', type: 'single' },
  'homepage_featured_section_twos': { endpoint: 'homepage-featured-section-two', type: 'single' },
  'homepage_triple_points': { endpoint: 'homepage-triple-point', type: 'single' },
};

// Fields to exclude when creating content (Strapi auto-generates these)
const EXCLUDE_FIELDS = [
  'id', 'created_at', 'updated_at', 'published_at',
  'created_by_id', 'updated_by_id', 'sitemap_exclude',
  'createdAt', 'updatedAt', 'publishedAt'
];

// Media fields that should be skipped (we'll handle images separately)
const MEDIA_FIELDS = [
  'image', 'images', 'banner', 'heroImage', 'hero_image',
  'offerOneImage', 'offerTwoImage', 'offerThreeImage',
  'SectionOneImages', 'SectionTwoImage', 'sectionOneImages', 'sectionTwoImage'
];

function fetchApi(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/${endpoint}`, STRAPI_URL);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`API ${method} ${endpoint} failed: ${res.statusCode} - ${data}`));
        } else {
          resolve(data ? JSON.parse(data) : null);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function cleanDataForV4(data) {
  const cleaned = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip excluded fields
    if (EXCLUDE_FIELDS.includes(key)) continue;

    // Skip media fields for now (can't pass URLs directly)
    if (MEDIA_FIELDS.includes(key)) continue;

    // Keep the value if not null
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

async function importContentType(contentType, items) {
  const config = CONTENT_TYPE_MAP[contentType];
  if (!config) {
    console.log(`  Skipping unknown content type: ${contentType}`);
    return { created: 0, failed: 0 };
  }

  const { endpoint, type } = config;
  const method = type === 'single' ? 'PUT' : 'POST';

  console.log(`\n=== Importing ${contentType} (${items.length} items) -> ${method} /api/${endpoint} ===`);

  let created = 0;
  let failed = 0;

  // For single types, only import the first item
  const itemsToImport = type === 'single' ? [items[0]] : items;

  for (const item of itemsToImport) {
    try {
      // Clean the data (skip media fields)
      const data = cleanDataForV4(item);

      // Create/update the content
      const response = await fetchApi(endpoint, method, { data });
      console.log(`  Created: ${item.id} -> ${response.data?.id || 'ok'}`);
      created++;
    } catch (error) {
      console.error(`  Failed to create ${contentType} id=${item.id}: ${error.message}`);
      failed++;
    }
  }

  return { created, failed };
}

async function main() {
  console.log('Strapi Content Import');
  console.log('=====================');
  console.log(`Export file: ${EXPORT_FILE}`);
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log('');
  console.log('NOTE: Media fields are skipped. Upload images manually in Strapi admin.');
  console.log('');

  // Load export data
  if (!fs.existsSync(EXPORT_FILE)) {
    console.error(`Export file not found: ${EXPORT_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));

  // Import each content type
  const summary = {};

  for (const [contentType, config] of Object.entries(CONTENT_TYPE_MAP)) {
    const items = data[contentType];
    if (!items || items.length === 0) {
      continue;
    }

    const result = await importContentType(contentType, items);
    summary[contentType] = result;
  }

  // Print summary
  console.log('\n=== Import Summary ===');
  for (const [type, result] of Object.entries(summary)) {
    console.log(`${type}: ${result.created} created, ${result.failed} failed`);
  }

  console.log('\n=== Next Steps ===');
  console.log('1. Go to Strapi admin and upload images for each content type');
  console.log('2. Images are hosted on Cloudinary - you can reference the old URLs from the export file');
}

main().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
