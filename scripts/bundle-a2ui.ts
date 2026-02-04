import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const HASH_FILE = path.join(ROOT_DIR, "src", "canvas-host", "a2ui", ".bundle.hash");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "canvas-host", "a2ui", "a2ui.bundle.js");
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, "vendor", "a2ui", "renderers", "lit");
const A2UI_APP_DIR = path.join(ROOT_DIR, "apps", "shared", "OpenClawKit", "Tools", "CanvasA2UI");

const INPUT_PATHS = [
    path.join(ROOT_DIR, "package.json"),
    path.join(ROOT_DIR, "pnpm-lock.yaml"),
    A2UI_RENDERER_DIR,
    A2UI_APP_DIR,
];

async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function walk(entryPath: string, files: string[]): Promise<void> {
    const st = await fs.stat(entryPath);
    if (st.isDirectory()) {
        const entries = await fs.readdir(entryPath);
        for (const entry of entries) {
            await walk(path.join(entryPath, entry), files);
        }
        return;
    }
    files.push(entryPath);
}

function normalize(p: string): string {
    return p.split(path.sep).join("/");
}

async function computeHash(): Promise<string> {
    const files: string[] = [];

    for (const input of INPUT_PATHS) {
        if (await pathExists(input)) {
            await walk(input, files);
        }
    }

    files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

    const hash = createHash("sha256");
    for (const filePath of files) {
        const rel = normalize(path.relative(ROOT_DIR, filePath));
        hash.update(rel);
        hash.update("\0");
        hash.update(await fs.readFile(filePath));
        hash.update("\0");
    }

    return hash.digest("hex");
}

async function runCommand(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            cwd,
            stdio: "inherit",
            shell: true,
        });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(" ")}`));
            }
        });

        proc.on("error", (err) => {
            reject(err);
        });
    });
}

async function main() {
    try {
        // Docker builds exclude vendor/apps via .dockerignore.
        // In that environment we must keep the prebuilt bundle.
        const rendererExists = await pathExists(A2UI_RENDERER_DIR);
        const appExists = await pathExists(A2UI_APP_DIR);

        if (!rendererExists || !appExists) {
            console.log("A2UI sources missing; keeping prebuilt bundle.");
            return;
        }

        // Check if bundle is up to date
        const currentHash = await computeHash();

        if (await pathExists(HASH_FILE)) {
            const previousHash = await fs.readFile(HASH_FILE, "utf-8");
            if (previousHash.trim() === currentHash && (await pathExists(OUTPUT_FILE))) {
                console.log("A2UI bundle up to date; skipping.");
                return;
            }
        }

        // Run TypeScript compilation
        console.log("Compiling A2UI renderer...");
        await runCommand("pnpm", ["-s", "exec", "tsc", "-p", path.join(A2UI_RENDERER_DIR, "tsconfig.json")], ROOT_DIR);

        // Run Rolldown bundling
        console.log("Bundling A2UI app...");
        await runCommand("rolldown", ["-c", path.join(A2UI_APP_DIR, "rolldown.config.mjs")], ROOT_DIR);

        // Save hash
        await fs.writeFile(HASH_FILE, currentHash, "utf-8");
        console.log("A2UI bundle complete.");
    } catch (err) {
        console.error("A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle");
        console.error("If this persists, verify pnpm deps and try again.");
        throw err;
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
