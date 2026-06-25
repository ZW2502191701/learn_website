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

for (const file of files) {
  let code = fs.readFileSync(path.join(dataDir, file), 'utf8');
  code = code
    .replaceAll('把"就绪"和"运行中"', '把“就绪”和“运行中”')
    .replaceAll('允许"插队"抢锁', '允许“插队”抢锁')
    .replaceAll('抽象类是"是不是"', '抽象类是“是不是”')
    .replaceAll('接口是"能不能"', '接口是“能不能”')
    .replaceAll('也是"不要 SELECT *"的原因', '也是“不要 SELECT *”的原因')
    .replaceAll('消费者"消费多次结果一致"', '消费者“消费多次结果一致”')
    .replaceAll('<!-- ${}', '<!-- \\${}')
    .replaceAll('ORDER BY ${column}', 'ORDER BY \\${column}');
  vm.runInNewContext(code, sandbox, { filename: file });
}

const chapters = sandbox.window.JAVAPATH_CHAPTERS;
const content = `/* Generated from web/data/*.js by tools/convert-legacy-data.mjs. */\n` +
  `import type { LegacyChapter } from './legacyTypes';\n\n` +
  `export const legacyChapters = ${JSON.stringify(chapters, null, 2)} satisfies LegacyChapter[];\n`;

fs.writeFileSync(outFile, content, 'utf8');
console.log(`Wrote ${outFile} with ${chapters.length} chapters.`);
