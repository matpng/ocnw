import { rolldown } from "rolldown";
import config from "../apps/shared/OpenClawKit/Tools/CanvasA2UI/rolldown.config.mjs";

console.log("Aliases:", config.resolve.alias);

// Try to build
try {
  const bundle = await rolldown(config);
  await bundle.write(config.output);
  console.log("Build success");
} catch (err) {
  console.error("Build failed:", err);
}
