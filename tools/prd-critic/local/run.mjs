#!/usr/bin/env node
// Local live runner for PRD-Critic. Reads ANTHROPIC_API_KEY from the
// environment and never touches a web page — this is the only way to run
// PRD-Critic against your own PRD with your own key. The public page at
// tools/prd-critic/index.html shows a precomputed canned demo only and
// makes zero network calls.
//
// Usage:
//   cd tools/prd-critic/local
//   npm install
//   export ANTHROPIC_API_KEY=sk-ant-...
//   npm run critique -- ../sample-prd.md
//   npm run critique -- /path/to/your-prd.md

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const here = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(path.join(here, '..', 'schema.json'), 'utf8'));

const SYSTEM_PROMPT = `You are PRD-Critic, a senior product management reviewer. You critique product
requirement documents (PRDs) against a fixed rubric — you never write or improve the PRD yourself,
only evaluate it as submitted.

Score each of these six dimensions from 1 (missing/unusable) to 5 (clear and complete):

1. Problem Clarity — is the problem specific, falsifiable, and backed by evidence (numbers, quotes,
   support data) rather than assertion?
2. Success Metrics — are there measurable targets with a baseline, a numeric goal, and a measurement
   window? Directional language ("improves", "goes down") without numbers scores low.
3. Scope & Kill Criteria — is what's in and out of scope stated, and is there a defined condition
   under which the team would stop, roll back, or reconsider the approach?
4. Risks & Failure Modes — are specific risks named with likelihood, impact, and a mitigation — not
   just a list of things that could go wrong?
5. Edge Cases — are the non-happy-path scenarios specific to this feature actually enumerated?
6. AI-Specific Readiness — for features involving a model: is the model choice justified, is there an
   accuracy/quality threshold the system must clear before shipping, is there a cost model, and is
   there a human-in-the-loop or review design for when the model is wrong?

For each dimension, ground your rationale in the PRD's actual text. Quote it directly when you can;
use null for supporting_quote only when the gap is a true absence with nothing to quote. Do not
soften scores to be encouraging — a PRD with real gaps should score low on the dimensions where the
gaps are real. Identify the risks most likely to cause a costly rebuild or a production incident, and
list any sections or considerations missing entirely.`;

async function main() {
  const inputPath = process.argv[2] ?? path.join(here, '..', 'sample-prd.md');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'ANTHROPIC_API_KEY is not set.\n' +
      'This runner reads your key from the environment — it is never entered into a web page.\n\n' +
      '  export ANTHROPIC_API_KEY=sk-ant-...\n' +
      '  npm run critique -- path/to/your-prd.md\n'
    );
    process.exit(1);
  }

  let prdText;
  try {
    prdText = readFileSync(inputPath, 'utf8');
  } catch (err) {
    console.error(`Could not read PRD file at ${inputPath}: ${err.message}`);
    process.exit(1);
  }

  const client = new Anthropic();
  console.error(`Critiquing ${inputPath} ...`);

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Critique this PRD:\n\n${prdText}` }],
      output_config: {
        format: { type: 'json_schema', schema },
      },
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      console.error('No text block in the response — nothing to parse.');
      process.exit(1);
    }

    const critique = JSON.parse(textBlock.text);
    const outPath = path.join(process.cwd(), 'critique-output.json');
    writeFileSync(outPath, JSON.stringify(critique, null, 2));
    console.error(`Wrote ${outPath}`);
    console.log(JSON.stringify(critique, null, 2));
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('Authentication failed — check that ANTHROPIC_API_KEY is a valid key.');
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error('Rate limited — wait a moment and try again.');
    } else if (err instanceof Anthropic.APIError) {
      console.error(`API error (${err.status}): ${err.message}`);
    } else {
      throw err;
    }
    process.exit(1);
  }
}

main();
