import fs from "fs/promises";
import path from "path";
import { ToolContext, ToolResult } from "./registry.js";

function resolveInRoot(root: string, p: string): string {
    const full = path.resolve(root, p);
    const r = path.resolve(root);
    if (!full.startsWith(r)) throw new Error("Path escapes allowed root");
    return full;
}

export async function fsRead(args: { path: string }, ctx: ToolContext): Promise<ToolResult> {
    try {
        const full = resolveInRoot(ctx.allowedRoot, args.path);
        const data = await fs.readFile(full, "utf8");
        return { ok: true, data: { text: data.slice(0, 200_000) } };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

export async function fsWrite(args: { path: string; text: string }, ctx: ToolContext): Promise<ToolResult> {
    try {
        const full = resolveInRoot(ctx.allowedRoot, args.path);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, args.text, "utf8");
        return { ok: true, data: { written: true, path: args.path } };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}
