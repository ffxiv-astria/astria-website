import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://astria.cxmeow.top";
const output = new URL("../dist/", import.meta.url);
const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map((match) => [match[1], match[2] ?? match[3] ?? match[4]]),
);
async function htmlFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return htmlFiles(new URL(`${entry.name}/`, directory), relative);
    return entry.name.endsWith(".html") ? [relative] : [];
  }));
  return files.flat();
}
const sitemap = await readFile(new URL("sitemap.xml", output), "utf8");
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(locations.length, new Set(locations).size, "Sitemap contains duplicate URLs");
const expectedIndexable = new Set();
const titles = new Set();
const descriptions = new Set();
let structuredPages = 0;
for (const file of await htmlFiles(output)) {
  const route = file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`;
  const html = await readFile(new URL(file, output), "utf8");
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map((match) => attributes(match[0]));
  const meta = (name) => tags.find((tag) => tag.name === name || tag.property === name)?.content;
  const noindex = /(?:^|[,\s])noindex(?:$|[,\s])/.test(meta("robots") ?? "");
  if (noindex) {
    assert(!locations.includes(`${origin}${route}`), `${route} must not be in sitemap`);
    assert(!html.includes('type="application/ld+json"'), `${route} must not expose public-page structured data`);
    continue;
  }
  const url = `${origin}${route}`;
  expectedIndexable.add(url);
  const canonical = tags.filter((tag) => tag.rel === "canonical");
  assert.equal(canonical.length, 1, `${route} needs one canonical`);
  assert.equal(canonical[0].href, url, `${route} canonical must be the clean production URL`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = meta("description");
  assert(title && !titles.has(title), `${route} needs a unique title`);
  assert(description && !descriptions.has(description), `${route} needs a unique description`);
  titles.add(title);
  descriptions.add(description);
  if (!route.startsWith("/legal/") && route !== "/account-deletion/") {
    assert.equal(meta("og:url"), url, `${route} needs a matching OG URL`);
    assert.equal(meta("og:image"), `${origin}/brand/astria-social-card.png`);
    assert.equal(meta("og:image:width"), "1200");
    assert.equal(meta("og:image:height"), "630");
    assert.equal(meta("twitter:image"), meta("og:image"));
    const block = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert(block, `${route} needs JSON-LD`);
    const data = JSON.parse(block);
    assert.equal(data["@context"], "https://schema.org");
    assert(data["@graph"].some((item) => item["@type"] === "WebSite"));
    assert(data["@graph"].some((item) => item["@id"] === `${url}#webpage`));
    assert(!block.includes("SearchAction"), "No global web search is offered");
    assert(!block.includes("aggregateRating"), "Do not invent ratings");
    if (route !== "/") {
      const breadcrumb = data["@graph"].find((item) => item["@type"] === "BreadcrumbList");
      assert(breadcrumb, `${route} needs a breadcrumb`);
      assert.equal(breadcrumb.itemListElement.at(-1).item, url);
    }
    structuredPages += 1;
  }
}
assert.deepEqual(new Set(locations), expectedIndexable, "Sitemap must match public indexable HTML");
const robots = await readFile(new URL("robots.txt", output), "utf8");
for (const match of robots.matchAll(/^Disallow:\s*(\S+)/gm)) {
  assert(!locations.some((url) => new URL(url).pathname.startsWith(match[1])), "Robots blocks a sitemap page");
}
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const featureIndex = await readFile(new URL("features/index.html", output), "utf8");
for (const slug of ["game-data", "market", "gathering-weather", "housing", "gearing", "collections"]) {
  assert(featureIndex.includes(`href="/features/${slug}/"`), `Feature page ${slug} must be linked`);
}
for (const file of ["s/index.html", "pc/index.html", "recap/travel/index.html", "recap/travel/embed/index.html", "bind/daoyu-relay/index.html", "travel-annual-recap/index.html"]) {
  const html = await readFile(new URL(file, output), "utf8");
  assert(/name="robots"[^>]*content="noindex, nofollow"/.test(html), `${file} must remain noindex`);
}
const image = await readFile(new URL("brand/astria-social-card.png", output));
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
console.log(`SEO checks passed: ${locations.length} indexable URLs, ${structuredPages} structured pages, 6 linked feature topics.`);
