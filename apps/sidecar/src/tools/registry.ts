import { envOptional } from "../util/env.js";

export type ToolContext = {
    userE164: string;
    mode: string;
    missionId?: string;
    allowedRoot: string;
};

export type ToolResult = { ok: boolean; data?: any; error?: string };

export type ToolFn = (args: any, ctx: ToolContext) => Promise<ToolResult>;

type ToolSpec = { name: string; fn: ToolFn; timeoutMs: number };

const registry = new Map<string, ToolSpec>();

export function registerTool(spec: ToolSpec) {
    registry.set(spec.name, spec);
}

export function getTool(name: string): ToolSpec | undefined {
    return registry.get(name);
}

export function allowedRoot(): string {
    return envOptional("AUTONOMY_ALLOWED_ROOT", "./workspace")!;
}
