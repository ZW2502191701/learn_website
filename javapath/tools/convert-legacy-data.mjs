import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'web', 'data');
const outFile = path.join(root, 'src', 'data', 'legacyChapters.ts');

const files = [
  'collections.js',
  'threads.js',
  'jvm.js',
  'mysql.js',
  'redis.js',
  'ssm.js',
  'mq.js',
  'microservice.js',
  'designpattern.js',
  'scenario.js',
  'interview.js'
];

const sandbox = {
  window: {
    JAVAPATH_CHAPTERS: [],
    registerChapter(chapter) {
      sandbox.window.JAVAPATH_CHAPTERS.push(chapter);
    }
  }
};
sandbox.window.window = sandbox.window;

const errors = [];
const fileStats = [];

const DQ = String.fromCharCode(0x22); // ASCII double-quote

// 已知的 JS 字符串内部引号冲突修复映射
// 源文件中 ASCII " 出现在 JS 字符串内部，导致字符串提前闭合
// 修复方式：将内部 ASCII " 替换为中文书名号「」
const quoteFixes = [
  [`把${DQ}就绪${DQ}和${DQ}运行中${DQ}`, '把「就绪」和「运行中」'],
  [`允许${DQ}插队${DQ}抢锁`, '允许「插队」抢锁'],
  [`抽象类是${DQ}是不是${DQ}`, '抽象类是「是不是」'],
  [`接口是${DQ}能不能${DQ}`, '接口是「能不能」'],
  [`也是${DQ}不要 SELECT *${DQ}的原因`, '也是「不要 SELECT *」的原因'],
  [`消费者${DQ}消费多次结果一致${DQ}`, '消费者「消费多次结果一致」']
];

for (const file of files) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`源文件不存在: ${file}`);
    continue;
  }
  let code = fs.readFileSync(filePath, 'utf8');

  // 修复已知的 JS 字符串内部引号冲突
  for (const [from, to] of quoteFixes) {
    code = code.replaceAll(from, to);
  }

  // 修复模板字符串中的 ${ 转义
  code = code
    .replaceAll('<!-- ${}', '<!-- \\${}')
    .replaceAll('ORDER BY ${column}', 'ORDER BY \\${column}');

  try {
    vm.runInNewContext(code, sandbox, { filename: file });
  } catch (err) {
    errors.push(`执行 ${file} 时出错: ${err.message}`);
  }
}

const chapters = sandbox.window.JAVAPATH_CHAPTERS;

// 统计
for (const chapter of chapters) {
  const units = chapter.units ?? [];
  const groups = chapter.groups ?? [];
  fileStats.push({
    chapter: chapter.chapter,
    module: chapter.module,
    groups: groups.length,
    units: units.length,
    qaCount: units.reduce((sum, u) => sum + (u.qa?.length ?? 0), 0),
    conceptCount: units.reduce((sum, u) => sum + (u.concept?.length ?? 0), 0)
  });
}

const generatedAt = new Date().toISOString();

const content = [
  `/* Generated from web/data/*.js by tools/convert-legacy-data.mjs. */`,
  `/* Generated at: ${generatedAt} */`,
  `import type { LegacyChapter } from './legacyTypes';`,
  ``,
  `export const legacyChapters = ${JSON.stringify(chapters, null, 2)} satisfies LegacyChapter[];`,
  ``
].join('\n');

fs.writeFileSync(outFile, content, 'utf8');

// 输出报告
const report = {
  generatedAt,
  sourceDir: 'web/data/*.js',
  outputFile: 'src/data/legacyChapters.ts',
  chapters: chapters.length,
  totalUnits: fileStats.reduce((sum, s) => sum + s.units, 0),
  totalQA: fileStats.reduce((sum, s) => sum + s.qaCount, 0),
  totalConcepts: fileStats.reduce((sum, s) => sum + s.conceptCount, 0),
  errors: errors.length,
  files: fileStats
};

console.log('转换报告:');
console.log(JSON.stringify(report, null, 2));

if (errors.length) {
  console.error('\n转换错误:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`\n✓ 已写入 ${outFile}，包含 ${chapters.length} 个章节。`);
