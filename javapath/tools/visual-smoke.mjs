import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (error) => logs.push({ type: 'pageerror', text: error.message }));

const baseUrl = process.env.JAVAPATH_SMOKE_URL ?? 'http://127.0.0.1:5173/';
const outputDir = process.env.JAVAPATH_SMOKE_OUT ?? fs.mkdtempSync(path.join(os.tmpdir(), 'javapath-smoke-'));
const desktopShot = path.join(outputDir, 'dashboard-desktop.png');
const mobileShot = path.join(outputDir, 'dashboard-mobile.png');

const navigate = async (label) => {
  await page.getByLabel('打开全部页面').click();
  await page.getByRole('menuitem', { name: label }).click();
  await page.waitForTimeout(300);
};

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: desktopShot, fullPage: true });

const checks = {};
checks.title = await page.locator('text=JavaPath').count();
checks.routeMenu = await page.getByLabel('打开全部页面').count();

await navigate('知识图谱');
checks.navGraph = await page.locator('text=知识图谱').count();
checks.graphVisible = await page.locator('svg.knowledge-svg').count();
await page.locator('text=ConcurrentHashMap').first().click();
await page.waitForTimeout(200);
checks.graphDetail = await page.locator('text=关联面试题').count();

await navigate('面试训练');
checks.interviewModes = await page.locator('button:has-text("大厂二面")').count();
await page.locator('button:has-text("大厂二面")').click();
await page.locator('button:has-text("隐藏答案")').click();
checks.mockBlank = await page.locator('text=模拟面试模式').count();

await navigate('全文搜索');
await page.locator('input[placeholder="全文搜索知识点、面试题、场景题"]').fill('HashMap');
await page.waitForTimeout(300);
checks.searchResults = await page.locator('.search-results button').count();

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: mobileShot, fullPage: true });
checks.mobileMenu = await page.locator('button[aria-label="打开全部页面"]').count();

await browser.close();
console.log(JSON.stringify({ checks, screenshots: { desktop: desktopShot, mobile: mobileShot }, logs }, null, 2));
