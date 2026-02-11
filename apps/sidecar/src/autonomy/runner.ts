import { MissionContract } from "./contracts.js";
import { shouldStop } from "./limits.js";
import { runToolCall } from "../tools/runner.js";
import { ToolContext } from "../tools/registry.js";

/**
 * Autonomy loop:
 * - Ask OpenClaw for a plan/next action
 * - Validate tool calls against contract
 * - Execute allowed tools (with approval gates)
 * - Feed results back to OpenClaw and iterate
 *
 * NOTE: This runner assumes your OpenClaw bridge can accept "observations" (tool results).
 * If not, implement "single-shot" autonomy where each iteration is a new call containing
 * the previous tool results in the prompt.
 */
export async function runMission(opts: {
    contract: MissionContract;
    callAgent: (input: { goal: string; observations: any[]; contract: MissionContract }) => Promise<{ text: string; tool_calls?: any[] }>;
    toolCtx: ToolContext;
    requestApproval: (toolName: string, payload: any) => Promise<"APPROVED" | "DENIED" | "EXPIRED">;
}): Promise<{ summary: string; observations: any[]; stoppedReason?: string }> {
    const startedAt = Date.now();
    let steps = 0;
    let toolCalls = 0;
    const observations: any[] = [];

    while (true) {
        const stop = shouldStop({
            startedAtMs: startedAt,
            nowMs: Date.now(),
            stepsDone: steps,
            toolCallsDone: toolCalls,
            maxSteps: opts.contract.maxSteps,
            maxToolCalls: opts.contract.maxToolCalls,
            maxMinutes: opts.contract.maxMinutes
        });
        if (stop.stop) {
            return { summary: "Mission stopped by limits.", observations, stoppedReason: stop.reason };
        }

        const agent = await opts.callAgent({ goal: opts.contract.goal, observations, contract: opts.contract });
        steps += 1;

        const calls = agent.tool_calls ?? [];
        if (!calls.length) {
            // Agent declares done
            return { summary: agent.text, observations };
        }

        // Execute each tool call sequentially (safe)
        for (const c of calls) {
            const name = c.name;
            if (!opts.contract.allowedTools.includes(name)) {
                observations.push({ type: "tool_blocked", name, reason: "Not allowed by contract" });
                continue;
            }

            if (opts.contract.approvalRequiredTools.includes(name)) {
                const decision = await opts.requestApproval(name, c);
                if (decision !== "APPROVED") {
                    observations.push({ type: "tool_denied", name, reason: `Approval ${decision}` });
                    continue;
                }
            }

            const { result } = await runToolCall({ name, args: c.args }, opts.toolCtx);
            toolCalls += 1;
            observations.push({ type: "tool_result", name, result });

            // stop check inside loop
            const stop2 = shouldStop({
                startedAtMs: startedAt,
                nowMs: Date.now(),
                stepsDone: steps,
                toolCallsDone: toolCalls,
                maxSteps: opts.contract.maxSteps,
                maxToolCalls: opts.contract.maxToolCalls,
                maxMinutes: opts.contract.maxMinutes
            });
            if (stop2.stop) return { summary: "Mission stopped by limits.", observations, stoppedReason: stop2.reason };
        }
    }
}
