# SEO Monitoring and Regression Checklist

This checklist is designed for a monthly SEO audit and a production deployment verification pass.

## Quick Runbook

1. Start the app locally:

```bash
pnpm dev
```

2. Run automated SEO checks (indexing, robots, sitemap, metadata, schema, broken links):

```bash
pnpm seo:check
```

3. Run Core Web Vitals and SEO category checks with Lighthouse:

```bash
npx lighthouse http://localhost:3000 --only-categories=performance,seo --view
```

4. Run production automated checks:

```bash
pnpm seo:check:prod
```

5. Run production Lighthouse checks:

```bash
npx lighthouse https://zeroerroresports.com --only-categories=performance,seo --view
```

## Monthly SEO Audit Checklist

### 1) Indexing and Crawl Controls

- [ ] Confirm `/robots.txt` is reachable and includes `Sitemap:`
- [ ] Confirm private sections remain blocked in robots (`/admin`, `/api`, `/profile`)
- [ ] Confirm public pages do not accidentally include `noindex`
- [ ] Spot-check Google Search Console coverage for newly indexed and excluded pages

### 2) Sitemap Health

- [ ] Confirm `/sitemap.xml` is reachable and valid XML
- [ ] Confirm core routes are present (`/`, `/about`, `/services`, `/events`, `/teams`, `/contact`, `/ze-club`)
- [ ] Confirm dynamic SEO-critical routes are still included (for example season routes)
- [ ] Re-submit sitemap in Search Console if major URL changes happened this month

### 3) Metadata Regression Checks

- [ ] Verify canonical tags exist on core public pages
- [ ] Verify title and description tags are present and not duplicated accidentally
- [ ] Verify Open Graph tags (`og:title`, image, description) exist
- [ ] Verify Twitter card tags are present
- [ ] Verify new pages include metadata before release

### 4) Structured Data (Schema)

- [ ] Verify JSON-LD scripts render on pages that should contain schema
- [ ] Validate schema on key pages in Rich Results Test
- [ ] Verify FAQ schema appears only on pages where FAQ content is visible
- [ ] Confirm Organization schema remains present site-wide

### 5) Core Web Vitals (CWV)

- [ ] Run Lighthouse on home and events pages
- [ ] Check for regressions in LCP and CLS compared to last month
- [ ] Verify critical hero/banner images are still optimized and load correctly
- [ ] Confirm no large layout shifts were introduced by recent UI changes

### 6) Broken Links and Internal Linking

- [ ] Run automated internal link checks and fix any 4xx/5xx routes
- [ ] Confirm important money pages are reachable within a few internal clicks
- [ ] Verify newly added anchors use meaningful, contextual link text
- [ ] Spot-check navigation/footer links on mobile and desktop

## Deployment Verification Checklist (Production)

Run this checklist after each production deployment.

- [ ] `pnpm seo:check:prod` passes with no failures
- [ ] `https://zeroerroresports.com/robots.txt` returns HTTP 200
- [ ] `https://zeroerroresports.com/sitemap.xml` returns HTTP 200
- [ ] Core pages return HTTP 200 and include canonical + description + OG tags
- [ ] Expected JSON-LD renders on `/about`, `/services`, and `/events`
- [ ] Lighthouse SEO + performance run completed with no critical regressions
- [ ] No new broken internal links from homepage and key landing pages
- [ ] Search Console shows no sudden spike in excluded, blocked, or error pages

## Notes

- The script `scripts/seo-check.mjs` is intentionally lightweight and dependency-free.
- For deeper diagnostics (CWV trends, rich results, indexing trends), pair this checklist with Search Console and Lighthouse reports.
