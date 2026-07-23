<!--
Committed before any labeling happens. If this file's git history ever shows
edits to the rubric or label guide *after* golden-set.json gained labels,
that's the tell that the protocol was fitted to the results — the whole
point of publishing this first is to make that checkable.
-->

# PRD-Critic Evaluation Protocol

## What this measures

**PRD-Critic's per-dimension scores vs. Yonatan's independent, blind labels** on the
same golden set — not the critic's output judged by another LLM call, and not the
critic's rubric used to grade its own output. Judge-vs-critic-with-the-same-rubric is
close to tautological: of course a model agrees with itself applying the same
instructions. This protocol exists to avoid exactly that failure mode.

**This is a pilot, not a benchmark.** ~20 items, one labeler, no adjudication pass.
It reports what it reports and no more.

## What is NOT claimed

- No single headline "alignment rate" or "accuracy" percentage.
- No claim that results generalize beyond `golden-set.json`.
- No claim of inter-rater reliability — there is one rater (Yonatan). A second
  independent labeler and an adjudication pass on disagreements is future work,
  noted as such, not promised on a timeline.
- No claim that the rubric itself is the objectively correct rubric — it's one
  experienced PM's judgment about what makes a PRD buildable, made explicit and
  falsifiable rather than left implicit.

## Dataset

`golden-set.json` — approximately 20 **original, fictionalized** PRDs, written for
this project. None describe, reference, or derive from any real employer's product,
data, or internal documents (see the disclosure note in that file).

**Selection criteria**, decided before labeling:
- Spans quality levels deliberately — some strong, some weak, most mixed, so scores
  aren't compressed at one end.
- Spans a few different feature archetypes (data/ML features, workflow/automation
  features, pure-UI features) so the rubric is exercised outside a single domain.
- Each PRD is short enough to label in a few minutes, so the labeling session stays
  under an hour and doesn't get abandoned partway through.

## Label guide

For each of the 6 rubric dimensions (see `tools/prd-critic/index.html` for full
definitions), the labeler assigns 1&ndash;5 independently, without seeing the
critic's output for that PRD.

| Score | Meaning | Anchor |
|---|---|---|
| 1 | Missing or unusable | The dimension isn't addressed at all, or what's written is too vague to act on. |
| 2 | Present but seriously underspecified | Gestured at, but missing the specifics needed to build or evaluate against it (e.g. a metric named with no number, baseline, or window). |
| 3 | Adequate | Enough to proceed, with gaps a reviewer would flag but not block on. |
| 4 | Clear | Specific, falsifiable, and actionable with only minor gaps. |
| 5 | Complete | Nothing an experienced reviewer would add. |

Labeler notes any dimension where the score felt genuinely borderline between two
values — these are the disagreements worth reading, not just counting.

## Blinding procedure

1. Labels are recorded in a column of `golden-set.json` before running the critic
   against that PRD, OR the labeler covers/does not open the critic's output file
   until all 20 PRDs are labeled.
2. Labeling happens in one sitting where practical, to reduce drift in how the
   labeler applies the anchors across the set.
3. Once all 20 are labeled, the critic is run once per PRD (no re-rolling for a
   more favorable output) and scores are compared.

## Reporting

For each of the 6 dimensions, across the full set:
- **Exact agreement rate** (critic score == label, out of ~20)
- **Within-1 agreement rate** (|critic score &minus; label| &le; 1)
- **Mean signed difference** (critic score &minus; label, averaged) &mdash; reveals
  systematic leniency (positive) or harshness (negative) per dimension
- **2&ndash;3 concrete disagreement examples per dimension**, with both scores and
  enough of the PRD excerpt to see why they diverged

This is published as a table plus a short prose readout, not a single number. The
question a reader should be able to answer from it: *on which dimensions does the
critic agree with an experienced reviewer, and on which does it systematically miss?*

## Publishing rule

`evals.html` ships with this protocol visible **before** any labels exist, showing
a "not yet run" state. It is updated with real per-dimension results only after
labeling is complete under this exact protocol — never with placeholder or implied
numbers in the meantime.

## Future work (not promised, noted for honesty)

- Second independent labeler + adjudication pass on disagreements, to get an actual
  inter-rater reliability number instead of one person's judgment.
- Expanding the golden set past ~20 once a first pilot round is complete.
- Testing rubric stability by having the same labeler re-label a subset after a
  time gap, to see how much of the "disagreement" is actually labeler noise.
