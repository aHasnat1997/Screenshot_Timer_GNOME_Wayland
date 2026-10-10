import { spawn } from "child_process";
import { resolve } from "path";
import { copyFileSync, existsSync, mkdirSync } from "fs";

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Error: Missing parameters.");
  console.log(
    "Usage:   bun run index.ts <interval_minutes> <total_duration_minutes>",
  );
  console.log("Example: bun run index.ts 5 30");
  process.exit(1);
}

const intervalMin = parseFloat(args[0]);
const totalDurationMin = parseFloat(args[1]);

if (
  isNaN(intervalMin) ||
  isNaN(totalDurationMin) ||
  intervalMin <= 0 ||
  totalDurationMin <= 0
) {
  console.error(
    "❌ Error: Please provide valid positive numbers for both parameters.",
  );
  process.exit(1);
}

if (intervalMin > totalDurationMin) {
  console.error("❌ Error: Interval cannot be larger than the total duration.");
  process.exit(1);
}

// Target folder structure configuration
const TARGET_DIR = resolve(process.cwd(), "screen-short");

// Ensure the screen-short folder exists
if (!existsSync(TARGET_DIR)) {
  mkdirSync(TARGET_DIR, { recursive: true });
}

// Convert minutes to milliseconds
const intervalMs = intervalMin * 60 * 1000;
const totalDurationMs = totalDurationMin * 60 * 1000;

console.log(`📸 Screenshot timer started!`);
console.log(
  `⏱️ Capturing every ${intervalMin} minute(s) for a total of ${totalDurationMin} minute(s).`,
);
console.log(`📂 Output directory: ${TARGET_DIR}\n`);

// Counter for serial organization
let counter = 1;

function runCommand(command: string, commandArgs: string[]): Promise<string> {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, commandArgs);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => (stdout += data));
    child.stderr.on("data", (data: Buffer) => (stderr += data));
    child.on("error", rejectCommand);
    child.on("close", (code) => {
      if (code === 0) {
        resolveCommand(stdout);
      } else {
        rejectCommand(new Error(stderr.trim() || `${command} exited with code ${code}`));
      }
    });
  });
}

// GNOME Wayland permits application screenshots only through the desktop portal.
async function takeScreenshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `screen-short-${counter}-${timestamp}.png`;
  const outputPath = resolve(TARGET_DIR, filename);

  try {
    const uri = (await runCommand("gjs", ["--module", resolve(process.cwd(), "portal-screenshot.ts")])).trim();
    if (!uri.startsWith("file://")) {
      throw new Error("The desktop portal returned an invalid screenshot URI.");
    }
    copyFileSync(new URL(uri), outputPath);
    console.log(`✅ Saved: ${filename}`);
    counter++;
  } catch (error) {
    console.error(
      `❌ Failed to take screenshot:`,
      error instanceof Error ? error.message : error,
    );
  }
}

// Serialize captures so a slow portal response cannot overlap another request.
let captureQueue = Promise.resolve();
function queueScreenshot() {
  captureQueue = captureQueue.then(takeScreenshot);
  return captureQueue;
}

// Take the first screenshot immediately.
void queueScreenshot();

// Capture only at interval boundaries strictly before the end.  The final
// boundary is handled separately below so it always produces one last image.
let intervalNumber = 1;
const intervalId = setInterval(() => {
  if (intervalNumber * intervalMs < totalDurationMs) {
    void queueScreenshot();
  }
  intervalNumber++;
}, intervalMs);

// Take one final screenshot at the full duration, then stop.
setTimeout(async () => {
  clearInterval(intervalId);
  await queueScreenshot();
  console.log("\n🏁 Total duration reached. Screenshot timer stopped.");
  process.exit(0);
}, totalDurationMs);
