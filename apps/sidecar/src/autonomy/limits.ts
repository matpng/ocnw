export function shouldStop(args: {
    startedAtMs: number;
    nowMs: number;
    stepsDone: number;
    toolCallsDone: number;
    maxSteps: number;
    maxToolCalls: number;
    maxMinutes: number;
}): { stop: boolean; reason?: string } {
    const minutes = (args.nowMs - args.startedAtMs) / 60_000;
    if (args.stepsDone >= args.maxSteps) return { stop: true, reason: "Max steps reached" };
    if (args.toolCallsDone >= args.maxToolCalls) return { stop: true, reason: "Max tool calls reached" };
    if (minutes >= args.maxMinutes) return { stop: true, reason: "Max time reached" };
    return { stop: false };
}
