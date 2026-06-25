import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (error) => logs.push({ type: 'pageerror', text: error.message }));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'D:/AI_Test/javapath/dashboard-desktop.png', fullPage: true });

const checks = {};
checks.title = await page.locator('text=Java 后端进阶学习平台').count();
checks.navGraph = await page.locator('button:has-text("知识图谱")').count();
await page.locator('button:has-text("知识图谱")').click();
await page.waitForTimeout(300);
checks.graphVisible = await page.locator('svg.knowledge-svg').count();
await page.locator('text=ConcurrentHashMap').first().click();
await page.waitForTimeout(200);
checks.graphDetail = await page.locator('text=关联面试题').count();

await page.locator('button:has-text("面试训练")').click();
await page.waitForTimeout(300);
checks.interviewModes = await page.locator('button:has-text("大厂二面")').count();
await page.locator('button:has-text("大厂二面")').click();
await page.locator('button:has-text("隐藏答案")').click();
checks.mockBlank = await page.locator('text=模拟面试模式').count();

await page.locator('button:has-text("全文搜索")').click();
await page.waitForTimeout(300);
await page.locator('input[placeholder="全文搜索知识点、面试题、场景题"]').fill('HashMap');
await page.waitForTimeout(300);
checks.searchResults = await page.locator('.search-results button').count();

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'D:/AI_Test/javapath/dashboard-mobile.png', fullPage: true });
checks.mobileMenu = await page.locator('button[aria-label="打开导航"]').count();

await browser.close();
console.log(JSON.stringify({ checks, logs }, null, 2));
