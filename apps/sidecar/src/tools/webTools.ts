/**
 * If your OpenClaw already has web tools via Antigravity,
 * you can either:
 * 1) Keep web tool execution inside OpenClaw (agent calls tools natively), OR
 * 2) Execute web tools here and provide results to the agent.
 *
 * This file provides stubs for option (2).
 */
import { ToolContext, ToolResult } from "./registry.js";

export async function webSearch(args: { query: string; recencyDays?: number; maxResults?: number }, ctx: ToolContext): Promise<ToolResult> {
    return { ok: false, error: "web.search not wired. Use OpenClaw built-in web tools or implement here." };
}

export async function webOpen(args: { url: string }, ctx: ToolContext): Promise<ToolResult> {
    return { ok: false, error: "web.open not wired. Implement in webTools.ts." };
}

export async function webExtract(args: { url: string; mode?: "readable" | "text" }, ctx: ToolContext): Promise<ToolResult> {
    return { ok: false, error: "web.extract not wired. Implement in webTools.ts." };
}
