// Pins the PRD-Critic API contract: validates the committed canned-demo
// fixture (../sample-critique.json) against the JSON Schema that local/run.mjs
// sends as output_config.format.schema (../schema.json).
//
// Deliberately dependency-free — a small subset validator covering only the
// JSON Schema features this project's schema actually uses (type, enum,
// properties/required/additionalProperties, items/minItems/maxItems,
// minimum/maximum). Not a general-purpose validator.
//
// Run: node tools/prd-critic/local/schema.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(path.join(here, '..', 'schema.json'), 'utf8'));
const fixture = JSON.parse(readFileSync(path.join(here, '..', 'sample-critique.json'), 'utf8'));

const errors = [];

function fail(pathStr, message) {
  errors.push(`${pathStr}: ${message}`);
}

function validate(node, sch, pathStr) {
  if (sch.type) {
    const types = Array.isArray(sch.type) ? sch.type : [sch.type];
    const actual = node === null ? 'null' : Array.isArray(node) ? 'array' : typeof node;
    const normalized = actual === 'number' && Number.isInteger(node) ? ['integer', 'number'] : [actual];
    if (!types.some((t) => normalized.includes(t))) {
      fail(pathStr, `expected type ${types.join('|')}, got ${actual}`);
      return;
    }
  }

  if (sch.enum && !sch.enum.includes(node)) {
    fail(pathStr, `value ${JSON.stringify(node)} not in enum ${JSON.stringify(sch.enum)}`);
  }

  if (typeof node === 'number') {
    if (sch.minimum !== undefined && node < sch.minimum) fail(pathStr, `${node} < minimum ${sch.minimum}`);
    if (sch.maximum !== undefined && node > sch.maximum) fail(pathStr, `${node} > maximum ${sch.maximum}`);
  }

  if (sch.type === 'object' || (sch.properties && node && typeof node === 'object' && !Array.isArray(node))) {
    const keys = Object.keys(node ?? {});
    for (const req of sch.required ?? []) {
      if (!(req in node)) fail(pathStr, `missing required property "${req}"`);
    }
    if (sch.additionalProperties === false) {
      const allowed = new Set(Object.keys(sch.properties ?? {}));
      for (const k of keys) {
        if (!allowed.has(k)) fail(pathStr, `unexpected property "${k}"`);
      }
    }
    for (const [key, propSchema] of Object.entries(sch.properties ?? {})) {
      if (key in node) validate(node[key], propSchema, `${pathStr}.${key}`);
    }
  }

  if (sch.type === 'array' && Array.isArray(node)) {
    if (sch.minItems !== undefined && node.length < sch.minItems) {
      fail(pathStr, `array length ${node.length} < minItems ${sch.minItems}`);
    }
    if (sch.maxItems !== undefined && node.length > sch.maxItems) {
      fail(pathStr, `array length ${node.length} > maxItems ${sch.maxItems}`);
    }
    if (sch.items) {
      node.forEach((item, i) => validate(item, sch.items, `${pathStr}[${i}]`));
    }
  }
}

validate(fixture, schema, 'sample-critique.json');

// Contract-specific checks beyond generic JSON Schema (fixed dimension set,
// in the order the public page and golden-set labeling both assume).
const expectedDimensionNames = [
  'Problem Clarity',
  'Success Metrics',
  'Scope & Kill Criteria',
  'Risks & Failure Modes',
  'Edge Cases',
  'AI-Specific Readiness',
];
const actualNames = (fixture.dimensions ?? []).map((d) => d.name);
if (JSON.stringify(actualNames) !== JSON.stringify(expectedDimensionNames)) {
  fail('sample-critique.json.dimensions', `expected names in order ${JSON.stringify(expectedDimensionNames)}, got ${JSON.stringify(actualNames)}`);
}

if (errors.length > 0) {
  console.error(`FAIL — ${errors.length} schema violation(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
} else {
  console.log('PASS — sample-critique.json satisfies schema.json (6/6 dimensions, correct order, all constraints hold).');
}
