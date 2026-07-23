<!--
FICTIONAL DOCUMENT. "Ledgerly" is not a real company. This PRD was written for
PRD-Critic's canned demo and golden set — it does not describe, reference, or
derive from any real employer's product, data, or internal documents.
-->

# PRD: Auto-Categorize — AI Expense Line-Item Categorization

**Product:** Ledgerly (fictional B2B expense management SaaS)
**Author:** Product team
**Status:** Draft v1

## Problem

Finance teams using Ledgerly manually re-categorize expense line items (e.g.
"Uber to airport" → Travel, "AWS invoice" → Cloud Infrastructure) before they
can be exported to the customer's accounting system. Categorization is the
#2 support complaint after "reconciliation is slow." On average, employees
spend 12 minutes a week fixing auto-imported transactions from corporate
cards, because our current rules-based categorizer only gets ~60% of line
items right and silently miscategorizes the rest.

## Goal

Use an LLM to categorize expense line items automatically so finance teams
spend less time on manual cleanup, and exports to accounting systems are
accurate on the first pass.

## Solution

When a new transaction arrives from a connected card feed, send the merchant
name, amount, and memo field to an LLM, along with the customer's chart of
accounts, and have it return a suggested category. Show the suggestion in
the UI with a confidence indicator. If the employee doesn't change it within
24 hours, auto-apply it.

## Success Metrics

- Categorization accuracy improves
- Support tickets about categorization go down
- Users are happier with the product

## Risks

- The LLM might get things wrong sometimes
- Some customers have unusual chart-of-accounts setups
- Cost of calling the LLM on every transaction

## Rollout

Ship to a few beta customers first, then roll out to everyone.

## Out of Scope

- Multi-currency handling (v2)
- Receipt OCR (already exists as a separate feature)
