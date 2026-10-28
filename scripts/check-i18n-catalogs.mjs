import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const englishPath = resolve(root, 'src/i18n.ts');
const frenchPath = resolve(root, 'src/i18n/locales/fr-CA.ts');

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

export function validateCatalogs(english, french) {
  const problems = [];
  for (const key of english.keys()) if (!french.has(key)) problems.push(`fr-CA is missing ${key}`);
  for (const key of french.keys()) if (!english.has(key)) problems.push(`fr-CA has unknown key ${key}`);
  for (const [key, source] of english) {
    const translated = french.get(key);
    if (translated === undefined) continue;
    if (JSON.stringify(placeholders(source)) !== JSON.stringify(placeholders(translated))) problems.push(`placeholder mismatch in ${key}`);
  }
  return problems;
}

const resources = findVariableObject(englishPath, 'resources');
const englishResource = objectProperty(resources, 'en');
const englishCatalog = englishResource && ts.isObjectLiteralExpression(englishResource) ? objectProperty(englishResource, 'translation') : undefined;
const frenchCatalog = findVariableObject(frenchPath, 'frCA');
if (!englishCatalog || !ts.isObjectLiteralExpression(englishCatalog)) throw new Error('Could not locate the English translation catalog.');

const english = entries(englishCatalog);
const french = entries(frenchCatalog);
const problems = validateCatalogs(english, french);
if (process.argv.includes('--self-test')) {
  const brokenFixture = new Map(french);
  brokenFixture.delete(english.keys().next().value);
  if (validateCatalogs(english, brokenFixture).length === 0) throw new Error('Missing-key self-test did not detect a broken fixture.');
  console.log('Catalog validation self-test detected a deliberately missing key.');
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`French review-preview catalog parity passed (${english.size} messages).`);
}
