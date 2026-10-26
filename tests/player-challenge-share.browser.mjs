import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const id = '123e4567-e89b-42d3-a456-426614174000';
const code = 'ABCD2345';
const fixture = {
  code, status: 'ok', target: { type: 'player_challenge_same_set', id: 'template-id' },
  url: `https://astria.cxmeow.top/pc/${code}`,
  appLink: `astria://player-challenges/${id}?sameSetCode=${code}`,
  miniappPath: `subPackages/player-challenges/pages/detail/index?id=${id}&sameSetCode=${code}`,
  preview: { title: '<img src=x onerror="window.__injected=true">艾欧泽亚知识挑战', subtitle: '知识 · 即时挑战 · 10 题', author: '天穹出题人' },
  sourceRunId: 'private-run-secret', standardAnswer: 'private-answer-secret',
};
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
let server;
let browser;
let origin;
let screenshots;
before(async () => {
  await readFile(join(root, 'pc/index.html'));
  screenshots = await mkdtemp(join(tmpdir(), 'astria-pc-browser-'));
  server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const file = pathname.startsWith('/pc/') ? 'pc/index.html' : pathname.startsWith('/s/') ? 's/index.html' : pathname === '/' ? 'index.html' : pathname.slice(1);
      const path = resolve(root, file);
      if (!path.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(path));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise((done) => server.close(done));
  console.log(`Browser screenshots: ${screenshots}`);
});

async function open(ua, response = fixture, path = `/pc/${code}`) {
  const context = await browser.newContext({ userAgent: ua, viewport: { width: 430, height: 932 } });
  const page = await context.newPage();
  const writes = [];
  const external = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') writes.push(request.url());
    const url = new URL(request.url());
    if (url.origin === origin) { await route.continue(); return; }
    if (url.pathname.endsWith(`/${code}`)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }); return;
    }
    if (url.pathname.endsWith('.png')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64') }); return;
    }
    external.push(url.href); await route.abort();
  });
  await page.goto(`${origin}${path}`);
  return { page, context, writes, external };
}

test('Android page uses safe text, preserves the same-set code and never offers an App action', async () => {
  const { page, context, writes, external } = await open('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36');
  try {
    await page.locator('#pc-ready').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#pc-title').textContent(), fixture.preview.title);
    assert.equal(await page.locator('#pc-title img').count(), 0);
    assert.equal(await page.locator('a[href^="astria:"]').count(), 0);
    assert.equal(await page.locator('#pc-code').textContent(), code);
    assert.equal(await page.locator('#pc-miniapp').isVisible(), true);
    assert.equal(await page.evaluate(() => window.__injected), undefined);
    assert.ok(!(await page.locator('body').textContent()).includes('private-answer-secret'));
    assert.ok(!(await page.locator('body').textContent()).includes('private-run-secret'));
    assert.deepEqual(writes, []); assert.deepEqual(external, []);
    await page.screenshot({ path: join(screenshots, 'android.png'), fullPage: true });
  } finally { await context.close(); }
});

test('Apple browser uses the exact supported deep link and retains mini-program fallback', async () => {
  const { page, context } = await open('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1');
  try {
    await page.locator('#pc-ready').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#pc-open-app').getAttribute('href'), fixture.appLink);
    assert.equal(await page.locator('#pc-open-app').isVisible(), true);
    assert.equal(await page.locator('#pc-miniapp').isVisible(), true);
    await page.screenshot({ path: join(screenshots, 'apple.png'), fullPage: true });
  } finally { await context.close(); }
});

test('WeChat never attempts App navigation even on Apple devices', async () => {
  const { page, context, writes } = await open('Mozilla/5.0 iPhone Mobile MicroMessenger/8.0');
  try {
    await page.locator('#pc-ready').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#pc-open-app').isVisible(), false);
    assert.equal(await page.locator('#pc-miniapp').isVisible(), true);
    assert.deepEqual(writes, []);
  } finally { await context.close(); }
});

test('unsupported Apple target retains the web and mini-program fallback', async () => {
  const { page, context } = await open('Mozilla/5.0 iPhone Mobile Safari', { ...fixture, appLink: null });
  try {
    await page.locator('#pc-ready').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#pc-open-app').isVisible(), false);
    assert.equal(await page.locator('#pc-copy').isVisible(), true);
    assert.equal(await page.locator('#pc-miniapp').isVisible(), true);
  } finally { await context.close(); }
});

test('withdrawn links hide stale server preview and do not expose content', async () => {
  const { page, context } = await open('Mozilla/5.0 Android Mobile', { ...fixture, status: 'revoked' });
  try {
    await page.locator('#pc-unavailable').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#pc-title').textContent(), '');
    assert.equal(await page.locator('#pc-open-app').getAttribute('href'), null);
    assert.equal(await page.locator('#pc-ready').isVisible(), false);
  } finally { await context.close(); }
});

test('old /s sharing continues to resolve its existing target types', async () => {
  const { page, context } = await open('Mozilla/5.0 Android Mobile', { ...fixture, target: { type: 'gearset', id }, preview: { title: '原配装分享', subtitle: null, author: null }, posterVariants: [] }, `/s/${code}`);
  try {
    await page.locator('#ready').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#title').textContent(), '原配装分享');
    assert.equal(new URL(page.url()).pathname, `/s/${code}`);
  } finally { await context.close(); }
});
