#!/usr/bin/env node

const baseUrl = process.env.SEO_BASE_URL || "http://localhost:3000";
const timeoutMs = Number(process.env.SEO_TIMEOUT_MS || 12000);

const keyPages = ["/", "/about", "/services", "/events", "/teams", "/ze-club"];
const requiredSitemapPaths = ["/", "/about", "/services", "/events", "/teams", "/contact", "/ze-club"];

const results = [];
const checkedLinks = new Set();

function addResult(ok, area, message) {
  results.push({ ok, area, message });
}

async function fetchText(pathOrUrl) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : new URL(pathOrUrl, baseUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, url };
  } catch (error) {
    return { ok: false, status: 0, text: "", url, error: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function hasMeta(html, name, valuePart) {
  const escaped = name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const metaRegex = new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]*>`, "i");
  const match = html.match(metaRegex);
  if (!match) return false;
  return match[0].toLowerCase().includes(valuePart.toLowerCase());
}

function hasPropertyMeta(html, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const propertyRegex = new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]*>`, "i");
  return propertyRegex.test(html);
}

function hasCanonical(html) {
  return /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);
}

function hasJsonLd(html) {
  return /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html);
}

function collectInternalLinks(html) {
  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith("#")) continue;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (href.startsWith("http://") || href.startsWith("https://")) continue;
    if (!href.startsWith("/")) continue;

    const normalized = href.split("#")[0].split("?")[0] || "/";
    links.push(normalized);
  }

  return [...new Set(links)];
}

async function checkRobots() {
  const robots = await fetchText("/robots.txt");
  if (!robots.ok) {
    addResult(false, "robots", `Unable to fetch /robots.txt (status ${robots.status})`);
    return;
  }

  addResult(true, "robots", "/robots.txt is reachable");
  addResult(robots.text.includes("Sitemap:"), "robots", "robots includes Sitemap directive");
  addResult(robots.text.includes("/admin"), "indexing", "robots disallows /admin");
  addResult(robots.text.includes("/api"), "indexing", "robots disallows /api");
  addResult(robots.text.includes("/profile"), "indexing", "robots disallows /profile");
}

async function checkSitemap() {
  const sitemap = await fetchText("/sitemap.xml");
  if (!sitemap.ok) {
    addResult(false, "sitemap", `Unable to fetch /sitemap.xml (status ${sitemap.status})`);
    return;
  }

  addResult(true, "sitemap", "/sitemap.xml is reachable");
  addResult(/<urlset/i.test(sitemap.text), "sitemap", "sitemap has <urlset>");

  for (const path of requiredSitemapPaths) {
    addResult(sitemap.text.includes(path), "sitemap", `sitemap includes ${path}`);
  }
}

async function checkPageSignals() {
  for (const path of keyPages) {
    const page = await fetchText(path);
    if (!page.ok) {
      addResult(false, "metadata", `${path} is not reachable (status ${page.status})`);
      continue;
    }

    addResult(hasCanonical(page.text), "metadata", `${path} has canonical link`);
    addResult(hasMeta(page.text, "description", "content="), "metadata", `${path} has meta description`);
    addResult(hasPropertyMeta(page.text, "og:title"), "metadata", `${path} has Open Graph title`);
    addResult(hasMeta(page.text, "twitter:card", "content="), "metadata", `${path} has Twitter card tag`);
    addResult(!hasMeta(page.text, "robots", "noindex"), "indexing", `${path} is indexable (no noindex tag)`);

    if (path === "/about" || path === "/services" || path === "/events") {
      addResult(hasJsonLd(page.text), "schema", `${path} includes JSON-LD schema`);
    }

    const links = collectInternalLinks(page.text);
    for (const link of links) {
      checkedLinks.add(link);
    }
  }
}

async function checkBrokenLinks() {
  if (checkedLinks.size === 0) {
    addResult(false, "broken-links", "No internal links discovered from key pages");
    return;
  }

  for (const path of checkedLinks) {
    const response = await fetchText(path);
    addResult(response.ok, "broken-links", `${path} returns ${response.status}`);
  }
}

function printSummary() {
  const failed = results.filter((item) => !item.ok);
  const passed = results.length - failed.length;

  console.log(`SEO check base URL: ${baseUrl}`);
  console.log(`Passed: ${passed} | Failed: ${failed.length}`);

  for (const item of results) {
    const mark = item.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] [${item.area}] ${item.message}`);
  }

  if (failed.length > 0) {
    console.log("\nAt least one SEO check failed.");
    process.exitCode = 1;
    return;
  }

  console.log("\nAll automated SEO checks passed.");
}

async function main() {
  await checkRobots();
  await checkSitemap();
  await checkPageSignals();
  await checkBrokenLinks();

  // CWV usually requires Lighthouse/browser tooling. Keep this as a documented manual step.
  addResult(true, "cwv", "Run Lighthouse command from SEO checklist for CWV validation");

  printSummary();
}

main().catch((error) => {
  console.error("Unexpected seo-check error:", error);
  process.exit(1);
});
