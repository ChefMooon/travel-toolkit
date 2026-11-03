import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const englishPath = resolve(root, 'src/i18n.ts');
const languagesPath = resolve(root, 'src/i18n/languages.ts');
const localesDir = resolve(root, 'src/i18n/locales');

function findVariableObject(source, variableName) {
  const sourceFile = ts.createSourceFile('catalog.ts', readFileSync(source, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer ? unwrapExpression(declaration.initializer) : undefined;
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName && initializer && ts.isObjectLiteralExpression(initializer)) {
        return initializer;
      }
    }
  }
  throw new Error(`Could not find object catalog variable ${variableName} in ${source}`);
}

function unwrapExpression(expression) {
  while (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) || ts.isParenthesizedExpression(expression)) expression = expression.expression;
  return expression;
}

function defaultExportName(source) {
  const sourceFile = ts.createSourceFile('catalog.ts', readFileSync(source, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const exported = sourceFile.statements.find((statement) => ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression));
  if (!exported) throw new Error(`${source} must end with "export default <catalog variable>".`);
  return exported.expression.text;
}

/** Registered languages come from src/i18n/languages.ts; every non-English one needs src/i18n/locales/<code>.ts. */
function discoverLocales() {
  const registered = [...entriesOfKeys(findVariableObject(languagesPath, 'LANGUAGES'))].filter((code) => code !== 'en');
  const files = readdirSync(localesDir).filter((name) => name.endsWith('.ts')).map((name) => name.slice(0, -3));
  const problems = [
    ...registered.filter((code) => !files.includes(code)).map((code) => `${code} is registered in languages.ts but has no src/i18n/locales/${code}.ts`),
    ...files.filter((code) => !registered.includes(code)).map((code) => `src/i18n/locales/${code}.ts is not registered in languages.ts`),
  ];
  const locales = registered.filter((code) => files.includes(code)).map((code) => {
    const path = resolve(localesDir, `${code}.ts`);
    return { code, path, variable: defaultExportName(path) };
  });
  return { locales, problems };
}

function entriesOfKeys(object) {
  return object.properties.filter((property) => ts.isPropertyAssignment(property)).map((property) => propertyName(property.name));
}

function objectProperty(object, key) {
  return object.properties.find((property) => ts.isPropertyAssignment(property) && propertyName(property.name) === key)?.initializer;
}

function propertyName(name) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) ? name.text : undefined;
}

function entries(object) {
  const output = new Map();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property.name);
    const value = property.initializer;
    if (!key || !ts.isStringLiteral(value)) throw new Error('Catalog entries must use literal keys and string values.');
    output.set(key, value.text);
  }
  return output;
}

function placeholders(message) {
  return [...message.matchAll(/{{\s*([^,}\s]+)(?:\s*,[^}]*)?\s*}}/g)].map((match) => match[1]).sort();
}

export function validateCatalogs(english, french, code = 'fr-CA') {
  const problems = [];
  for (const key of english.keys()) if (!french.has(key)) problems.push(`${code} is missing ${key}`);
  for (const key of french.keys()) if (!english.has(key)) problems.push(`${code} has unknown key ${key}`);
  for (const [key, source] of english) {
    const translated = french.get(key);
    if (translated === undefined) continue;
    if (JSON.stringify(placeholders(source)) !== JSON.stringify(placeholders(translated))) problems.push(`${code}: placeholder mismatch in ${key}`);
  }
  return problems;
}

const resources = findVariableObject(englishPath, 'resources');
const englishResource = objectProperty(resources, 'en');
const englishCatalog = englishResource && ts.isObjectLiteralExpression(englishResource) ? objectProperty(englishResource, 'translation') : undefined;
if (!englishCatalog || !ts.isObjectLiteralExpression(englishCatalog)) throw new Error('Could not locate the English translation catalog.');

const english = entries(englishCatalog);
const { locales, problems: registryProblems } = discoverLocales();
const catalogs = locales.map(({ code, path, variable }) => ({ code, entries: entries(findVariableObject(path, variable)) }));
const problems = [...registryProblems, ...catalogs.flatMap(({ code, entries: catalog }) => validateCatalogs(english, catalog, code))];
if (process.argv.includes('--self-test')) {
  const brokenFixture = new Map(catalogs[0].entries);
  brokenFixture.delete(english.keys().next().value);
  if (validateCatalogs(english, brokenFixture).length === 0) throw new Error('Missing-key self-test did not detect a broken fixture.');
  console.log('Catalog validation self-test detected a deliberately missing key.');
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Catalog parity passed for ${catalogs.map(({ code }) => code).join(', ')} (${english.size} messages).`);
}
