export type AutonomyLevel = "Auto-1" | "Auto-2" | "Auto-3";

export type MissionContract = {
    missionId: string;
    userE164: string;
    level: AutonomyLevel;
    goal: string;

    createdAtMs: number;
    expiresAtMs: number;

    maxSteps: number;
    maxMinutes: number;
    maxToolCalls: number;

    allowedTools: string[];
    approvalRequiredTools: string[];
};

export function defaultContract(args: { missionId: string; userE164: string; goal: string; level: AutonomyLevel }): MissionContract {
    const now = Date.now();
    const base = {
        missionId: args.missionId,
        userE164: args.userE164,
        goal: args.goal,
        level: args.level,
        createdAtMs: now,
        expiresAtMs: now + 60 * 60_000,
        maxSteps: 12,
        maxMinutes: 8,
        maxToolCalls: 20
    };

    if (args.level === "Auto-1") {
        return {
            ...base,
            allowedTools: ["research.search", "research.open", "research.extract", "memory.read", "memory.write"],
            approvalRequiredTools: []
        };
    }
    if (args.level === "Auto-2") {
        return {
            ...base,
            allowedTools: ["research.search", "research.open", "research.extract", "memory.read", "memory.write", "safe.exec", "fs.read"],
            approvalRequiredTools: ["fs.write"]
        };
    }
    return {
        ...base,
        allowedTools: ["research.search", "research.open", "research.extract", "memory.read", "memory.write", "safe.exec", "fs.read", "fs.write"],
        approvalRequiredTools: ["safe.exec", "fs.write"]
    };
}
