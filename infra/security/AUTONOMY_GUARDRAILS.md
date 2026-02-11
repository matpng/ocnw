# Autonomy Guardrails (Mandatory)

## Kill switch

- GLOBAL_KILL_SWITCH=true disables RUN + AUTONOMY tools immediately.

## Budgets

- max steps
- max minutes
- max tool calls
- per-tool timeouts

## Scope

- filesystem restricted to AUTONOMY_ALLOWED_ROOT
- deny network tools unless explicitly allowed

## Approvals

- Auto-2 requires approval for fs.write
- Auto-3 requires approval for safe.exec and fs.write

## Audit

- every tool call logged to event log
- store mission contract + outcomes
