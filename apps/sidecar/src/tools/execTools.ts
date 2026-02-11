import { spawn } from "child_process";
import { ToolContext, ToolResult } from "./registry.js";

/**
 * safe.exec wrapper — v1 uses a stub sandbox profile.
 * In production, run inside Docker / restricted environment.
 */
export async function safeExec(args: { cmd: string; timeoutMs?: number }, ctx: ToolContext): Promise<ToolResult> {
    try {
        const timeout = Math.min(Math.max(args.timeoutMs ?? 10_000, 1_000), 30_000);
        const child = spawn(args.cmd, { shell: true });

        let stdout = "";
        let stderr = "";

        const killTimer = setTimeout(() => child.kill("SIGKILL"), timeout);

        child.stdout.on("data", (d) => (stdout += d.toString("utf8")));
        child.stderr.on("data", (d) => (stderr += d.toString("utf8")));

        const code: number = await new Promise((resolve) => child.on("close", resolve as any));
        clearTimeout(killTimer);

        return {
            ok: code === 0,
            data: { code, stdout: stdout.slice(0, 50_000), stderr: stderr.slice(0, 50_000) },
            error: code === 0 ? undefined : "Command failed"
        };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}
