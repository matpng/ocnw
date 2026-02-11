import { getTool, ToolContext, ToolResult } from "./registry.js";

export type ToolCall = { name: string; args: any };

export async function runToolCall(call: ToolCall, ctx: ToolContext): Promise<{ call: ToolCall; result: ToolResult }> {
    const spec = getTool(call.name);
    if (!spec) return { call, result: { ok: false, error: `Unknown tool: ${call.name}` } };

    // Timeout wrapper
    const p = spec.fn(call.args, ctx);
    const timeout = new Promise<ToolResult>((resolve) => setTimeout(() => resolve({ ok: false, error: "Tool timeout" }), spec.timeoutMs));
    const result = await Promise.race([p, timeout]);
    return { call, result };
}
