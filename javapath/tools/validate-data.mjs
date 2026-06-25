import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];

const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);

const transpileTsFile = (relativePath) => {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  return ts.transpileModule(source, {
    fileName: filePath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    }
  }).outputText;
};

const executeCjs = (relativePath, requireMap = {}) => {
  const code = transpileTsFile(relativePath);
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier in requireMap) return requireMap[specifier];
    throw new Error(`Unexpected import ${specifier} from ${relativePath}`);
  };
  const script = new vm.Script(`(function(exports, require, module) {\n${code}\n})`, { filename: relativePath });
  const fn = script.runInNewContext({ console, Map, Set, Array, Object, RegExp, Math, String, Number, Boolean });
  fn(module.exports, localRequire, module);
  return module.exports;
};

const legacyExports = executeCjs('src/data/legacyChapters.ts', {
  './legacyTypes': {}
});

const appExports = executeCjs('src/data/appData.ts', {
  './legacyChapters': legacyExports,
  '../types': {}
});

const appData = appExports.appData;

if (!appData) {
  throw new Error('Unable to load appData from src/data/appData.ts.');
}

const assertUniqueIds = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item?.id) {
      addError(`${label} contains an item without id.`);
      continue;
    }
    if (seen.has(item.id)) addError(`${label} has duplicate id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
};

const moduleIds = assertUniqueIds(appData.modules, 'modules');
const chapterIds = assertUniqueIds(appData.chapters, 'chapters');
const knowledgeIds = assertUniqueIds(appData.knowledgePoints, 'knowledgePoints');
const questionIds = assertUniqueIds(appData.questions, 'questions');
const scenarioIds = assertUniqueIds(appData.scenarios, 'scenarios');
const planIds = assertUniqueIds(appData.studyPlans, 'studyPlans');

if (!appData.modules.length) addError('modules must not be empty.');
if (!appData.knowledgePoints.length) addError('knowledgePoints must not be empty.');
if (!appData.questions.length) addWarning('questions is empty; interview training will be sparse.');
if (!appData.scenarios.length) addWarning('scenarios is empty; scenario practice will be sparse.');
if (!appData.studyPlans.length) addWarning('studyPlans is empty; plan route will be sparse.');

for (const module of appData.modules) {
  if (!module.title) addError(`module ${module.id} has empty title.`);
  if (!module.source) addWarning(`module ${module.id} has empty source.`);
  for (const chapterId of module.chapterIds ?? []) {
    if (!chapterIds.has(chapterId)) addError(`module ${module.id} references missing chapter ${chapterId}.`);
  }
}

for (const chapter of appData.chapters) {
  if (!moduleIds.has(chapter.moduleId)) addError(`chapter ${chapter.id} references missing module ${chapter.moduleId}.`);
  for (const knowledgePointId of chapter.knowledgePointIds ?? []) {
    if (!knowledgeIds.has(knowledgePointId)) addError(`chapter ${chapter.id} references missing knowledge point ${knowledgePointId}.`);
  }
}

for (const point of appData.knowledgePoints) {
  if (!moduleIds.has(point.moduleId)) addError(`knowledge point ${point.id} references missing module ${point.moduleId}.`);
  if (!chapterIds.has(point.chapterId)) addError(`knowledge point ${point.id} references missing chapter ${point.chapterId}.`);
  if (!point.title) addError(`knowledge point ${point.id} has empty title.`);
  for (const dependencyId of point.dependencies ?? []) {
    if (!knowledgeIds.has(dependencyId)) addError(`knowledge point ${point.id} references missing dependency ${dependencyId}.`);
  }
  for (const questionId of point.relatedQuestionIds ?? []) {
    if (!questionIds.has(questionId)) addError(`knowledge point ${point.id} references missing question ${questionId}.`);
  }
}

for (const question of appData.questions) {
  if (!moduleIds.has(question.moduleId)) addError(`question ${question.id} references missing module ${question.moduleId}.`);
  if (question.knowledgePointId && !knowledgeIds.has(question.knowledgePointId)) {
    addError(`question ${question.id} references missing knowledge point ${question.knowledgePointId}.`);
  }
  if (!question.title) addError(`question ${question.id} has empty title.`);
  if (!question.answer) addWarning(`question ${question.id} has empty answer.`);
}

for (const scenario of appData.scenarios) {
  if (!scenarioIds.has(scenario.id)) continue;
  if (!scenario.title) addError(`scenario ${scenario.id} has empty title.`);
  for (const moduleId of scenario.moduleIds ?? []) {
    if (!moduleIds.has(moduleId)) addError(`scenario ${scenario.id} references missing module ${moduleId}.`);
  }
  for (const questionId of scenario.relatedQuestionIds ?? []) {
    if (!questionIds.has(questionId)) addError(`scenario ${scenario.id} references missing question ${questionId}.`);
  }
  for (const [index, edge] of (scenario.architecture ?? []).entries()) {
    if (!edge.from || !edge.to) addError(`scenario ${scenario.id} has invalid architecture edge at index ${index}.`);
  }
}

for (const plan of appData.studyPlans) {
  if (!planIds.has(plan.id)) continue;
  for (const task of plan.dailyTasks ?? []) {
    for (const moduleId of task.moduleIds ?? []) {
      if (!moduleIds.has(moduleId)) addError(`study plan ${plan.id} day ${task.day} references missing module ${moduleId}.`);
    }
    for (const taskId of task.taskIds ?? []) {
      if (!knowledgeIds.has(taskId) && !questionIds.has(taskId) && !scenarioIds.has(taskId)) {
        addError(`study plan ${plan.id} day ${task.day} references missing task ${taskId}.`);
      }
    }
  }
}

const summary = {
  modules: appData.modules.length,
  chapters: appData.chapters.length,
  knowledgePoints: appData.knowledgePoints.length,
  questions: appData.questions.length,
  scenarios: appData.scenarios.length,
  studyPlans: appData.studyPlans.length,
  warnings: warnings.length,
  errors: errors.length
};

console.log('Data validation summary:');
console.log(JSON.stringify(summary, null, 2));

if (warnings.length) {
  console.warn('\nWarnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error('\nErrors:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
