# Phase 1 Prompt
Audit current SEO setup and implement crawl/index foundations in this Next.js App Router project.
Tasks:
1. Create app/robots.ts with rules:
- Allow all public pages
- Disallow /admin, /api, /profile
- Add sitemap URL https://zeroerroresports.com/sitemap.xml
2. Create app/sitemap.ts and include all public routes from app pages.
3. Ensure dynamic public routes are included where possible, especially ze-club seasons.
4. Use correct Next.js MetadataRoute types.
5. Keep private routes excluded from sitemap.
6. Show final diff and explain each change briefly.

# Phase 2 Prompt
Implement complete page-level metadata coverage for all public pages in the app folder.
Requirements:
1. Add unique metadata for each public page using Next.js Metadata.
2. Include title, description, openGraph, twitter, alternates canonical for each page.
3. Keep metadata aligned with India-first esports audience and English-only content.
4. Add generateMetadata for dynamic route app/ze-club/seasons/[seasonNumber]/page.tsx.
5. Ensure noindex is applied to non-rank pages if needed.
6. Keep existing design and functionality unchanged.
7. Show final diff and a table of page to metadata status.

# Phase 3 Prompt
Add structured data JSON-LD across the website for rich results.
Tasks:
1. Create reusable SEO helpers in lib/seo.ts.
2. Add Organization schema sitewide from layout.
3. Add Event schema for events pages and event listing content.
4. Add BreadcrumbList schema for nested ze-club routes.
5. Ensure schema is valid JSON-LD and only uses visible page data.
6. Do not break existing components.
7. Show final diff and include sample generated JSON-LD outputs.

# Phase 4 Prompt
Improve technical SEO through rendering and performance strategy while preserving UX.
Tasks:
1. Identify SEO-critical public pages currently marked use client.
2. Refactor to server-first page shells where possible, and move interactivity into child client components.
3. Keep all visual behavior and animations intact.
4. Improve image SEO and Core Web Vitals:
- Proper image priority only for LCP image
- Stable dimensions or aspect boxes to reduce CLS
- Descriptive alt text quality checks
5. Replace unnecessary no-store usage for crawl-relevant content with suitable revalidate strategy.
6. Show before vs after rendering strategy and final diff.

# Phase 5 Prompt
Improve internal linking and content architecture for higher topical authority.
Tasks:
1. Strengthen contextual internal links among home, about, services, teams, events, ze-club pages.
2. Add FAQ sections for high-intent user queries where appropriate.
3. Add FAQ schema only where FAQ content is visible on page.
4. Improve heading hierarchy where needed without changing design intent.
5. Keep content focused on India esports audience.
6. Show final diff and list new internal links added per page.

# Phase 6 Prompt
Set up SEO monitoring and regression checks for this project.
Tasks:
1. Add a markdown checklist file for monthly SEO audits.
2. Include checks for indexing, sitemap, robots, metadata, schema, CWV, and broken links.
3. Add a lightweight script or documented commands to validate key SEO signals locally.
4. Include a deployment verification checklist for production.
5. Keep it simple and maintainable for this repo.
6. Show final diff and explain how to run each check.

# Full Implementation Prompt
Implement the complete SEO roadmap end-to-end for this Next.js project in phased commits.
Scope:
1. Crawl/index foundations: app/robots.ts, app/sitemap.ts, canonical host strategy.
2. Page-level metadata for all public routes.
3. Dynamic metadata for season detail pages.
4. JSON-LD schema: Organization, Event, BreadcrumbList, FAQ where applicable.
5. Server-first rendering for SEO-critical pages while preserving existing UI and animation.
6. Better caching strategy for crawl-relevant content with revalidate where appropriate.
7. Internal linking and FAQ improvements for topical authority.
8. Add SEO monitoring checklist and local validation steps.
Constraints:
- Keep private profile pages non-indexable.
- Keep language English-only.
- Keep India-first positioning in metadata copy.
- Do not introduce breaking changes.
Output:
1. Apply code changes directly.
2. Show grouped diff by phase.
3. Provide validation results and next actions.